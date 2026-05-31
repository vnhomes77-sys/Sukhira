import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './logging.js';
import { initSentry, captureException } from './sentry.js';
import webhookRouter from './webhookRoute.js';
import { run, query, get } from './db.js';

// Auto-run seeding by importing seed.js (after a short delay to ensure tables exist)
setTimeout(() => {
  import('./seed.js').then(() => {
    logger.info('Seed check triggered.');
  });
}, 1000);

dotenv.config();

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_sukhira2026',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'sukhira_secret_key_98765'
});

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sukhira_secret_key_2026';

// Initialize Sentry error telemetry
initSentry(app);

// Rate Limiter Configurations
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 OTP request / verification operations per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' }
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 order transactions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many order transactions, please try again after 15 minutes' }
});

// Production Middlewares
app.use(helmet());
app.use(globalLimiter);

// Strict CORS check configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow server-to-server or scripts
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Winston-integrated morgan streaming logger
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(webhookRouter);

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Sukhira Seasons" <${process.env.SMTP_USER || 'no-reply@sukhira.com'}>`,
    to: email,
    subject: 'Your OTP to sign in to Sukhira',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; border: 1px solid #ffe8cc; border-radius: 12px; background-color: #fffaf0;">
        <h2 style="color: #ea580c; text-align: center; font-size: 1.8rem; margin-bottom: 1.5rem; letter-spacing: 1px;">SUKHIRA</h2>
        <p style="font-size: 1rem; color: #5c2509; line-height: 1.5;">Hello,</p>
        <p style="font-size: 1rem; color: #5c2509; line-height: 1.5;">You are attempting to sign in or register at <strong>Sukhira</strong>. Please use the following One-Time Password (OTP) to complete your authentication:</p>
        <div style="text-align: center; margin: 2rem 0;">
          <span style="font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; padding: 0.8rem 2rem; background-color: #ffe8cc; border: 2px dashed #ea580c; border-radius: 8px; color: #ea580c; display: inline-block;">${otp}</span>
        </div>
        <p style="font-size: 0.85rem; color: #8f4f2a; line-height: 1.5; border-top: 1px solid #ffe8cc; padding-top: 1rem; margin-top: 2rem;">
          This OTP is valid for 5 minutes. If you did not request this code, please ignore this email.
        </p>
      </div>
    `
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n======================================================');
    console.log(`[OTP Dev Alert] SMTP credentials not set.`);
    console.log(`OTP Code for ${email} is: ${otp}`);
    console.log('======================================================\n');
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP success] OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error(`[SMTP error] Failed to send email to ${email}:`, error.message);
    console.log('\n======================================================');
    console.log(`[OTP Dev Fallback Alert] OTP Code for ${email} is: ${otp}`);
    console.log('======================================================\n');
  }
};

// ==================== AUTH ENDPOINTS ====================

app.post('/api/auth/register', (req, res) => {
  return res.status(400).json({ message: 'Direct registration is disabled. Please login via Email OTP, which will automatically create your account if it does not exist.' });
});

app.post('/api/auth/send-otp', authLimiter, async (req, res) => {
  const { email, isAdminLogin } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  try {
    if (isAdminLogin) {
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user || user.role === 'customer') {
        return res.status(403).json({ message: 'Access Denied: This email is not approved or registered as admin staff by the Owner.' });
      }
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Access Denied: Your staff account is deactivated.' });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await run(
      'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET otp = excluded.otp, expires_at = excluded.expires_at',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (err) {
    logger.error('Error in send-otp:', err);
    captureException(err);
    res.status(500).json({ message: err.message });
  }
});


app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, otp, isAdminLogin } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Please provide email and OTP' });
  }

  try {
    const record = await get('SELECT * FROM otps WHERE email = ?', [email]);
    if (!record) {
      return res.status(400).json({ message: 'No OTP requested for this email' });
    }

    const now = new Date().toISOString();
    if (record.expires_at < now) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code. Please try again.' });
    }

    await run('DELETE FROM otps WHERE email = ?', [email]);

    let user = await get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (isAdminLogin) {
      if (!user || user.role === 'customer') {
        return res.status(403).json({ message: 'Access Denied: This email is not approved or registered as admin staff by the Owner.' });
      }
    }

    if (!user) {
      const name = email.split('@')[0];
      const randomPasswordDummy = Math.random().toString(36).substring(2);
      const passwordHash = await bcrypt.hash(randomPasswordDummy, 10);
      
      const insertResult = await run(
        'INSERT INTO users (email, password_hash, name, phone, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [email, passwordHash, name, null, 'customer', 'active']
      );
      
      user = {
        id: insertResult.id,
        email,
        name,
        phone: null,
        role: 'customer',
        status: 'active'
      };
      console.log(`[Register] Dynamically created new OTP user: ${email}`);
    } else {
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
    }


    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role, status: user.status }
    });
  } catch (err) {
    console.error('Error in login-otp:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT id, email, name, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== PRODUCTS ENDPOINTS ====================

app.get('/api/products', async (req, res) => {
  const { season, category, priceMin, priceMax, rating, sort, search, spotlight } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (season) {
    sql += ' AND season = ?';
    params.push(season.toLowerCase());
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category.toLowerCase());
  }
  if (priceMin) {
    sql += ' AND price >= ?';
    params.push(parseFloat(priceMin));
  }
  if (priceMax) {
    sql += ' AND price <= ?';
    params.push(parseFloat(priceMax));
  }
  if (rating) {
    sql += ' AND rating >= ?';
    params.push(parseFloat(rating));
  }
  if (spotlight) {
    sql += ' AND is_spotlight = ?';
    params.push(parseInt(spotlight));
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
  }

  // Sorting
  if (sort === 'price-low-high') {
    sql += ' ORDER BY price ASC';
  } else if (sort === 'price-high-low') {
    sql += ' ORDER BY price DESC';
  } else if (sort === 'rating') {
    sql += ' ORDER BY rating DESC';
  } else {
    // Default: New/id desc
    sql += ' ORDER BY id DESC';
  }

  try {
    const products = await query(sql, params);
    // Parse images, features, variants strings back to JSON objects
    const parsedProducts = products.map((prod) => ({
      ...prod,
      images: JSON.parse(prod.images),
      variants: prod.variants ? JSON.parse(prod.variants) : [],
      features: prod.features ? JSON.parse(prod.features) : [],
      is_spotlight: !!prod.is_spotlight,
      is_featured: !!prod.is_featured
    }));
    res.json(parsedProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const reviews = await query('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC', [req.params.id]);

    const parsedProduct = {
      ...product,
      images: JSON.parse(product.images),
      variants: product.variants ? JSON.parse(product.variants) : [],
      features: product.features ? JSON.parse(product.features) : [],
      is_spotlight: !!product.is_spotlight,
      is_featured: !!product.is_featured,
      reviews
    };
    res.json(parsedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create reviews
app.post('/api/products/:id/reviews', async (req, res) => {
  const { user_name, rating, comment } = req.body;
  const product_id = req.params.id;

  if (!user_name || !rating || !comment) {
    return res.status(400).json({ message: 'Please provide user_name, rating, and comment' });
  }

  try {
    // Insert review
    await run(
      'INSERT INTO reviews (product_id, user_name, rating, comment) VALUES (?, ?, ?, ?)',
      [product_id, user_name, rating, comment]
    );

    // Calculate new average rating for the product
    const stats = await get('SELECT AVG(rating) as avgRating FROM reviews WHERE product_id = ?', [product_id]);
    const avgRating = Math.round(stats.avgRating * 10) / 10;

    await run('UPDATE products SET rating = ? WHERE id = ?', [avgRating, product_id]);

    res.status(201).json({ message: 'Review added successfully', avgRating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== CART ENDPOINTS ====================

app.get('/api/cart', authenticate, async (req, res) => {
  try {
    const cartItems = await query(
      `SELECT c.id, c.product_id, c.quantity, c.variant, p.name, p.price, p.images, p.season, p.category 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    const parsedCartItems = cartItems.map((item) => ({
      ...item,
      images: JSON.parse(item.images)
    }));
    res.json(parsedCartItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/cart', authenticate, async (req, res) => {
  const { product_id, quantity, variant } = req.body;
  if (!product_id || !quantity) {
    return res.status(400).json({ message: 'Please provide product_id and quantity' });
  }
  try {
    // Check if item already in cart
    const existing = await get(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND (variant = ? OR (variant IS NULL AND ? IS NULL))',
      [req.user.id, product_id, variant || null, variant || null]
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
      res.json({ message: 'Cart updated', id: existing.id });
    } else {
      const result = await run(
        'INSERT INTO cart_items (user_id, product_id, quantity, variant) VALUES (?, ?, ?, ?)',
        [req.user.id, product_id, quantity, variant || null]
      );
      res.status(201).json({ message: 'Added to cart', id: result.id });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/cart/:id', authenticate, async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }
  try {
    await run('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.id, req.user.id]);
    res.json({ message: 'Cart item updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/cart/:id', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Cart item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ADDRESSES ENDPOINTS ====================

app.get('/api/addresses', authenticate, async (req, res) => {
  try {
    const addresses = await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [req.user.id]);
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/addresses', authenticate, async (req, res) => {
  const { name, phone, email, address_line, city, state, pincode, country, is_default } = req.body;
  if (!name || !phone || !email || !address_line || !city || !state || !pincode || !country) {
    return res.status(400).json({ message: 'Please provide all address fields' });
  }
  try {
    if (is_default) {
      // Unset previous defaults
      await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    const result = await run(
      `INSERT INTO addresses (user_id, name, phone, email, address_line, city, state, pincode, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, phone, email, address_line, city, state, pincode, country, is_default ? 1 : 0]
    );
    res.status(201).json({ id: result.id, message: 'Address added successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/addresses/:id', authenticate, async (req, res) => {
  const { name, phone, email, address_line, city, state, pincode, country, is_default } = req.body;
  try {
    if (is_default) {
      await run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    await run(
      `UPDATE addresses 
       SET name = ?, phone = ?, email = ?, address_line = ?, city = ?, state = ?, pincode = ?, country = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [name, phone, email, address_line, city, state, pincode, country, is_default ? 1 : 0, req.params.id, req.user.id]
    );
    res.json({ message: 'Address updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/addresses/:id', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ORDERS ENDPOINTS ====================

app.get('/api/orders', authenticate, async (req, res) => {
  try {
    const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/orders/:id_or_str', async (req, res) => {
  try {
    // Can look up by SQLite id or the custom order_id_str
    const order = await get(
      'SELECT * FROM orders WHERE id = ? OR order_id_str = ?',
      [req.params.id_or_str, req.params.id_or_str]
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const items = await query(
      `SELECT oi.id, oi.quantity, oi.price, oi.variant, p.name, p.images, p.season 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [order.id]
    );
    const parsedItems = items.map((item) => ({
      ...item,
      images: JSON.parse(item.images)
    }));
    res.json({
      ...order,
      shipping_address: JSON.parse(order.shipping_address),
      items: parsedItems
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Razorpay Order
app.post('/api/orders/razorpay-order', authenticate, orderLimiter, async (req, res) => {
  const { total, address_id, discount, subtotal, shipping_cost } = req.body;
  if (!total || isNaN(total) || total <= 0) {
    return res.status(400).json({ message: 'Invalid total amount' });
  }

  try {
    const cartItems = await query('SELECT * FROM cart_items WHERE user_id = ?', [req.user.id]);
    const itemsMeta = cartItems.map(item => ({ id: item.product_id, qty: item.quantity, var: item.variant || '' }));

    const amountInPaisa = Math.round(parseFloat(total) * 100);
    const options = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        user_id: req.user.id.toString(),
        address_id: (address_id || '').toString(),
        discount: (discount || 0).toString(),
        subtotal: (subtotal || 0).toString(),
        shipping_cost: (shipping_cost || 0).toString(),
        total: total.toString(),
        items: JSON.stringify(itemsMeta).substring(0, 250)
      }
    };

    const rzpOrder = await razorpay.orders.create(options);
    res.json({
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_sukhira2026'
    });
  } catch (err) {
    if (
      process.env.RAZORPAY_KEY_ID === 'rzp_test_sukhira2026' || 
      (err.statusCode === 401) ||
      (err.message && err.message.includes('Authentication failed'))
    ) {
      logger.warn('Razorpay authentication failed or mock key active. Falling back to Mock Payment Mode.');
      return res.json({
        razorpay_order_id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(parseFloat(total) * 100),
        key_id: 'rzp_test_sukhira2026',
        is_mock: true
      });
    }
    logger.error('Error creating Razorpay order:', err);
    captureException(err);
    res.status(500).json({ message: err.message || 'Failed to initialize payment gateway order' });
  }
});

// Verify Payment & Place Order (for Razorpay payments)
app.post('/api/orders/verify-payment', authenticate, orderLimiter, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    address_id,
    payment_method,
    discount,
    subtotal,
    shipping_cost,
    total
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !address_id) {
    return res.status(400).json({ message: 'Missing transaction verification parameters' });
  }

  try {
    // 1. Verify cryptographic signature
    const isMock = razorpay_order_id.startsWith('order_mock_');
    if (!isMock) {
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'sukhira_secret_key_98765');
      hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
      const generated_signature = hmac.digest('hex');

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ message: 'Transaction signature verification failed' });
      }
    }

    // 2. Resolve shipping address
    const address = await get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [address_id, req.user.id]);
    if (!address) {
      return res.status(400).json({ message: 'Invalid shipping address' });
    }

    // 3. Resolve cart items
    const cartItems = await query('SELECT * FROM cart_items WHERE user_id = ?', [req.user.id]);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // 4. Generate unique order string
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderIdStr = `SUK-${dateStr}-${rand}`;

    // Estimated delivery date (5 days from now)
    const delDate = new Date();
    delDate.setDate(delDate.getDate() + 5);
    const deliveryDateString = delDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    // 5. Insert order
    const orderResult = await run(
      `INSERT INTO orders (user_id, order_id_str, status, total, subtotal, shipping_cost, discount, shipping_address, payment_method, payment_status, delivery_date, payment_id, razorpay_order_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        orderIdStr,
        'placed',
        total,
        subtotal,
        shipping_cost,
        discount || 0,
        JSON.stringify(address),
        payment_method || 'RAZORPAY',
        'paid',
        deliveryDateString,
        razorpay_payment_id,
        razorpay_order_id
      ]
    );

    const orderId = orderResult.id;

    // 6. Insert order items
    for (const item of cartItems) {
      const product = await get('SELECT price FROM products WHERE id = ?', [item.product_id]);
      await run(
        'INSERT INTO order_items (order_id, product_id, quantity, price, variant) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, product.price, item.variant]
      );
    }

    // 7. Clear cart
    await run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    res.status(201).json({
      message: 'Payment verified and order placed successfully',
      order_id: orderId,
      order_id_str: orderIdStr
    });
  } catch (err) {
    logger.error('Error verifying payment and creating order:', err);
    captureException(err);
    res.status(500).json({ message: err.message || 'Failed to complete transaction' });
  }
});

// Create Order (places order using items currently in user's cart)
app.post('/api/orders', authenticate, orderLimiter, async (req, res) => {
  const { address_id, payment_method, discount, subtotal, shipping_cost, total } = req.body;
  if (!address_id || !payment_method) {
    return res.status(400).json({ message: 'Please provide address_id and payment_method' });
  }

  try {
    // 1. Get address
    const address = await get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [address_id, req.user.id]);
    if (!address) {
      return res.status(400).json({ message: 'Invalid shipping address' });
    }

    // 2. Get cart items
    const cartItems = await query('SELECT * FROM cart_items WHERE user_id = ?', [req.user.id]);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // 3. Create unique order ID string
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderIdStr = `SUK-${dateStr}-${rand}`;

    // Estimated delivery date (5 days from now)
    const delDate = new Date();
    delDate.setDate(delDate.getDate() + 5);
    const deliveryDateString = delDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    // Payment status
    const paymentStatus = payment_method === 'COD' ? 'pending' : 'paid';

    // 4. Insert order
    const orderResult = await run(
      `INSERT INTO orders (user_id, order_id_str, status, total, subtotal, shipping_cost, discount, shipping_address, payment_method, payment_status, delivery_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        orderIdStr,
        'placed',
        total,
        subtotal,
        shipping_cost,
        discount || 0,
        JSON.stringify(address),
        payment_method,
        paymentStatus,
        deliveryDateString
      ]
    );

    const orderId = orderResult.id;

    // 5. Insert order items
    for (const item of cartItems) {
      // Get product price
      const product = await get('SELECT price FROM products WHERE id = ?', [item.product_id]);
      await run(
        'INSERT INTO order_items (order_id, product_id, quantity, price, variant) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, product.price, item.variant]
      );
    }

    // 6. Clear cart
    await run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    res.status(201).json({
      message: 'Order placed successfully',
      order_id: orderId,
      order_id_str: orderIdStr
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== WISHLIST ENDPOINTS ====================

app.get('/api/wishlist', authenticate, async (req, res) => {
  try {
    const list = await query(
      `SELECT w.id, w.product_id, p.name, p.price, p.images, p.season, p.rating 
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?`,
      [req.user.id]
    );
    const parsedList = list.map((item) => ({
      ...item,
      images: JSON.parse(item.images)
    }));
    res.json(parsedList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/wishlist', authenticate, async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ message: 'Product ID required' });
  }
  try {
    const existing = await get('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (existing) {
      await run('DELETE FROM wishlist WHERE id = ?', [existing.id]);
      return res.json({ message: 'Removed from wishlist', added: false });
    } else {
      await run('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
      return res.json({ message: 'Added to wishlist', added: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ADMIN PANEL APIs ====================

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, email, name, role, status FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    if (user.role === 'customer') {
      return res.status(403).json({ message: 'Access denied: Admin permissions required' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient privileges' });
    }
    next();
  };
};

// Public configurations for Storefront
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const config = {};
    rows.forEach(r => {
      config[r.key] = r.value;
    });
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/faqs', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM faqs ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard Statistics Overview
app.get('/api/admin/dashboard-stats', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const ordersToday = await get("SELECT count(*) as count FROM orders WHERE date(created_at) = date('now')");
    const revToday = await get("SELECT sum(total) as sum FROM orders WHERE date(created_at) = date('now')");
    const revMonth = await get("SELECT sum(total) as sum FROM orders WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')");
    const totalProds = await get("SELECT count(*) as count FROM products");
    const lowStock = await get("SELECT count(*) as count FROM products WHERE stock <= min_stock_level");
    
    const recentOrders = await query(`
      SELECT o.*, u.name as customer_name 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC LIMIT 5
    `);
    
    const seasonSales = await query(`
      SELECT p.season, SUM(oi.price * oi.quantity) as sales, COUNT(DISTINCT oi.order_id) as orders
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.season
    `);

    const topSelling = await query(`
      SELECT p.id, p.name, p.images, p.price, p.season, p.category, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC LIMIT 5
    `);

    res.json({
      stats: {
        ordersToday: ordersToday.count,
        revenueToday: revToday.sum || 0,
        revenueMonth: revMonth.sum || 0,
        totalProducts: totalProds.count,
        lowStockAlerts: lowStock.count
      },
      recentOrders,
      seasonSales,
      topSelling: topSelling.map(p => ({
        ...p,
        images: JSON.parse(p.images)
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Products CRUD Management
app.get('/api/admin/products', authenticateAdmin, authorize(['owner', 'manager', 'support']), async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY id DESC');
    const parsed = products.map(p => ({
      ...p,
      images: JSON.parse(p.images),
      variants: p.variants ? JSON.parse(p.variants) : [],
      features: p.features ? JSON.parse(p.features) : [],
      skincare_routine: p.skincare_routine ? JSON.parse(p.skincare_routine) : null
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/products', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  const { season, category, name, description, price, discount_price, images, variants, features, usage_instructions, stock, min_stock_level, status, skincare_routine, is_spotlight, is_featured } = req.body;
  if (!season || !category || !name || !price || !images) {
    return res.status(400).json({ message: 'Missing required product parameters' });
  }
  try {
    const result = await run(`
      INSERT INTO products (season, category, name, description, price, discount_price, images, variants, features, usage_instructions, stock, min_stock_level, status, skincare_routine, is_spotlight, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      season.toLowerCase(),
      category.toLowerCase(),
      name,
      description || '',
      parseFloat(price),
      discount_price ? parseFloat(discount_price) : 0,
      JSON.stringify(images),
      variants ? JSON.stringify(variants) : JSON.stringify([]),
      features ? JSON.stringify(features) : JSON.stringify([]),
      usage_instructions || null,
      stock !== undefined ? parseInt(stock) : 15,
      min_stock_level !== undefined ? parseInt(min_stock_level) : 4,
      status || 'active',
      skincare_routine ? JSON.stringify(skincare_routine) : null,
      is_spotlight ? 1 : 0,
      is_featured ? 1 : 0
    ]);
    res.status(201).json({ id: result.id, message: 'Product created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/products/:id', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  const { season, category, name, description, price, discount_price, images, variants, features, usage_instructions, stock, min_stock_level, status, skincare_routine, is_spotlight, is_featured } = req.body;
  try {
    await run(`
      UPDATE products 
      SET season = ?, category = ?, name = ?, description = ?, price = ?, discount_price = ?, images = ?, variants = ?, features = ?, usage_instructions = ?, stock = ?, min_stock_level = ?, status = ?, skincare_routine = ?, is_spotlight = ?, is_featured = ?
      WHERE id = ?
    `, [
      season.toLowerCase(),
      category.toLowerCase(),
      name,
      description || '',
      parseFloat(price),
      discount_price ? parseFloat(discount_price) : 0,
      JSON.stringify(images),
      variants ? JSON.stringify(variants) : JSON.stringify([]),
      features ? JSON.stringify(features) : JSON.stringify([]),
      usage_instructions || null,
      parseInt(stock),
      parseInt(min_stock_level),
      status,
      skincare_routine ? JSON.stringify(skincare_routine) : null,
      is_spotlight ? 1 : 0,
      is_featured ? 1 : 0,
      req.params.id
    ]);
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/products/:id', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  try {
    await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/products/bulk-status', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !ids.length || !status) {
    return res.status(400).json({ message: 'Missing IDs or status parameters' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await run(`UPDATE products SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);
    res.json({ message: 'Products status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/products/bulk-delete', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  const { ids } = req.body;
  if (!ids || !ids.length) {
    return res.status(400).json({ message: 'Missing product IDs' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await run(`DELETE FROM products WHERE id IN (${placeholders})`, [...ids]);
    res.json({ message: 'Products deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Orders & Fulfillment APIs
app.get('/api/admin/orders', authenticateAdmin, authorize(['owner', 'manager', 'order_staff', 'support']), async (req, res) => {
  try {
    const orders = await query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
    `);
    
    const parsed = [];
    for (const o of orders) {
      const items = await query(`
        SELECT oi.*, p.name, p.images 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [o.id]);
      
      parsed.push({
        ...o,
        shipping_address: JSON.parse(o.shipping_address),
        items: items.map(i => ({
          ...i,
          images: JSON.parse(i.images)
        }))
      });
    }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/orders/:id/status', authenticateAdmin, authorize(['owner', 'manager', 'order_staff']), async (req, res) => {
  const { status, courier_name, tracking_number } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'Missing status parameter' });
  }
  try {
    await run(`
      UPDATE orders 
      SET status = ?, courier_name = ?, tracking_number = ? 
      WHERE id = ?
    `, [
      status.toLowerCase(),
      courier_name || null,
      tracking_number || null,
      req.params.id
    ]);
    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/orders/:id/notes', authenticateAdmin, authorize(['owner', 'manager', 'order_staff', 'support']), async (req, res) => {
  const { internal_notes } = req.body;
  try {
    await run('UPDATE orders SET internal_notes = ? WHERE id = ?', [internal_notes || '', req.params.id]);
    res.json({ message: 'Order internal notes updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/orders/:id/cancel', authenticateAdmin, authorize(['owner', 'manager', 'order_staff']), async (req, res) => {
  try {
    await run("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/returns', authenticateAdmin, authorize(['owner', 'manager', 'support']), async (req, res) => {
  try {
    const list = await query(`
      SELECT r.*, o.order_id_str, u.name as customer_name, o.total 
      FROM returns r
      JOIN orders o ON r.order_id = o.id
      JOIN users u ON o.user_id = u.id
      ORDER BY r.id DESC
    `);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/returns/:id/status', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'Status required' });
  }
  try {
    await run('UPDATE returns SET status = ? WHERE id = ?', [status, req.params.id]);
    if (status === 'refunded') {
      const returnReq = await get('SELECT order_id FROM returns WHERE id = ?', [req.params.id]);
      await run("UPDATE orders SET status = 'refunded', payment_status = 'refunded' WHERE id = ?", [returnReq.order_id]);
    }
    res.json({ message: 'Return status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Inventory Tracking APIs
app.get('/api/admin/inventory', authenticateAdmin, authorize(['owner', 'manager', 'order_staff']), async (req, res) => {
  try {
    const rows = await query('SELECT id, name, season, category, stock, min_stock_level, price FROM products ORDER BY stock ASC, id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/inventory/:id/stock', authenticateAdmin, authorize(['owner', 'manager', 'order_staff']), async (req, res) => {
  const { stock, min_stock_level } = req.body;
  try {
    if (stock !== undefined && min_stock_level !== undefined) {
      await run('UPDATE products SET stock = ?, min_stock_level = ? WHERE id = ?', [parseInt(stock), parseInt(min_stock_level), req.params.id]);
    } else if (stock !== undefined) {
      await run('UPDATE products SET stock = ? WHERE id = ?', [parseInt(stock), req.params.id]);
    } else if (min_stock_level !== undefined) {
      await run('UPDATE products SET min_stock_level = ? WHERE id = ?', [parseInt(min_stock_level), req.params.id]);
    }
    res.json({ message: 'Inventory stock level adjusted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer Management APIs
app.get('/api/admin/customers', authenticateAdmin, authorize(['owner', 'manager', 'support']), async (req, res) => {
  try {
    const customers = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
             COUNT(o.id) as total_orders,
             COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY total_spent DESC, u.id DESC
    `);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/customers/:id', authenticateAdmin, authorize(['owner', 'manager', 'support']), async (req, res) => {
  try {
    const user = await get("SELECT id, name, email, phone, status, created_at FROM users WHERE id = ? AND role = 'customer'", [req.params.id]);
    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [req.params.id]);
    const addresses = await query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [req.params.id]);
    res.json({ customer: user, orders, addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/customers/:id/status', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'Status required' });
  }
  try {
    await run("UPDATE users SET status = ? WHERE id = ? AND role = 'customer'", [status, req.params.id]);
    res.json({ message: `Customer status changed to ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Analytics Reporting APIs
app.get('/api/admin/analytics/sales-trend', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const monthlySales = await query(`
      SELECT strftime('%Y-%m', created_at) as month, SUM(total) as revenue, COUNT(id) as orders
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY month
      ORDER BY month ASC
    `);
    const dailySales = await query(`
      SELECT date(created_at) as day, SUM(total) as revenue, COUNT(id) as orders
      FROM orders
      WHERE status != 'cancelled' AND strftime('%m', created_at) = strftime('%m', 'now')
      GROUP BY day
      ORDER BY day ASC
    `);
    res.json({ monthlySales, dailySales });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/analytics/performance', authenticateAdmin, authorize(['owner', 'manager']), async (req, res) => {
  try {
    const bestSellers = await query(`
      SELECT p.id, p.name, p.price, p.season, p.category, SUM(oi.quantity) as sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY sold DESC LIMIT 10
    `);
    const leastSellers = await query(`
      SELECT p.id, p.name, p.price, p.season, p.category, COALESCE(SUM(oi.quantity), 0) as sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id
      ORDER BY sold ASC LIMIT 10
    `);
    const categoryBreakdown = await query(`
      SELECT p.category, SUM(oi.price * oi.quantity) as revenue, SUM(oi.quantity) as units_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.category
    `);
    res.json({ bestSellers, leastSellers, categoryBreakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff Management APIs
app.get('/api/admin/staff', authenticateAdmin, authorize(['owner']), async (req, res) => {
  try {
    const staff = await query("SELECT id, name, email, role, status, created_at FROM users WHERE role != 'customer' ORDER BY id ASC");
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/staff', authenticateAdmin, authorize(['owner']), async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Missing staff registration parameters' });
  }
  try {
    const existing = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ message: 'Staff member account already exists' });
    }
    // Since we login with OTP, we hash a random dummy password string to fulfill db constraint
    const dummyPass = Math.random().toString(36).substring(2);
    const hash = await bcrypt.hash(dummyPass, 10);
    await run("INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)", [name, email, hash, role, 'active']);
    res.status(201).json({ message: 'Staff member added successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.put('/api/admin/staff/:id', authenticateAdmin, authorize(['owner']), async (req, res) => {
  const { name, role, status, password } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await run("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.params.id]);
    }
    await run("UPDATE users SET name = ?, role = ?, status = ? WHERE id = ?", [name, role, status, req.params.id]);
    res.json({ message: 'Staff details updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Settings & FAQ Management APIs
app.put('/api/admin/settings', authenticateAdmin, authorize(['owner']), async (req, res) => {
  const updates = req.body;
  try {
    for (const key of Object.keys(updates)) {
      const val = updates[key];
      await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, typeof val === 'object' ? JSON.stringify(val) : String(val)]);
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/faqs', authenticateAdmin, authorize(['owner']), async (req, res) => {
  const { question, answer } = req.body;
  try {
    const result = await run('INSERT INTO faqs (question, answer) VALUES (?, ?)', [question, answer]);
    res.status(201).json({ id: result.id, message: 'FAQ added successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/faqs/:id', authenticateAdmin, authorize(['owner']), async (req, res) => {
  const { question, answer } = req.body;
  try {
    await run('UPDATE faqs SET question = ?, answer = ? WHERE id = ?', [question, answer, req.params.id]);
    res.json({ message: 'FAQ updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/faqs/:id', authenticateAdmin, authorize(['owner']), async (req, res) => {
  try {
    await run('DELETE FROM faqs WHERE id = ?', [req.params.id]);
    res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    // Perform simple check on the database connection
    await get('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Health check failed:', err);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  logger.info(`Backend API Server running on port ${PORT}`);
});
