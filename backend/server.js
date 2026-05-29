import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { run, query, get } from './db.js';

// Auto-run seeding by importing seed.js (after a short delay to ensure tables exist)
setTimeout(() => {
  import('./seed.js').then(() => {
    console.log('Seed check triggered.');
  });
}, 1000);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sukhira_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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

// ==================== AUTH ENDPOINTS ====================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Please provide email, password, and name' });
  }
  try {
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, phone || null]
    );
    const token = jwt.sign({ id: result.id, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: result.id, email, name, phone }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }
  try {
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT id, email, name, phone, created_at FROM users WHERE id = ?', [req.user.id]);
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

// Create Order (places order using items currently in user's cart)
app.post('/api/orders', authenticate, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Backend API Server running on port ${PORT}`);
});
