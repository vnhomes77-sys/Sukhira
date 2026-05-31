import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logging.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'database.db');

let db;
let useCloudDatabase = false;

if (process.env.DATABASE_URL && process.env.USE_CLOUD_DB === 'true') {
  useCloudDatabase = true;
  logger.warn(`Production Database Connection URL detected. DB endpoint: ${process.env.DATABASE_URL.split('@')[1] || 'Confidential URL'}`);
} else {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      logger.error('Error opening database:', err);
    } else {
      logger.info(`Connected to SQLite database at: ${dbPath}`);
      initDb();
    }
  });
}

// Promisify database operations
export const query = (sql, params = []) => {
  if (useCloudDatabase) {
    logger.info(`[Cloud Database Query Executing]: ${sql}`);
    throw new Error('Cloud Database Driver packages (e.g. pg, mysql2) are not installed. To switch database provider, run npm install pg or mysql2 and implement connection pool drivers.');
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  if (useCloudDatabase) {
    logger.info(`[Cloud Database Get Executing]: ${sql}`);
    throw new Error('Cloud Database Driver packages are not installed.');
  }
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  if (useCloudDatabase) {
    logger.info(`[Cloud Database Run Executing]: ${sql}`);
    throw new Error('Cloud Database Driver packages are not installed.');
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const safeAlterTable = async (table, columnDef) => {
  try {
    await run(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
    logger.info(`Migration successful: Added ${columnDef} to ${table}`);
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      logger.error(`Migration error on table ${table} for ${columnDef}: ${err.message}`);
    }
  }
};

const initDb = async () => {
  try {
    // Enable foreign keys
    await run('PRAGMA foreign_keys = ON;');

    // Users table (Updated with role & status)
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'customer', -- 'customer', 'owner', 'manager', 'order_staff', 'support'
        status TEXT DEFAULT 'active', -- 'active', 'inactive' (blocked)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table (Updated with stock & status)
    await run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        season TEXT NOT NULL, -- 'winter', 'summer', 'monsoon'
        category TEXT NOT NULL, -- 'clothing', 'accessories', 'skincare'
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        discount_price REAL DEFAULT 0,
        rating REAL DEFAULT 4.5,
        images TEXT NOT NULL, -- JSON array of image URLs
        variants TEXT, -- JSON array of sizes/variants
        features TEXT, -- JSON array of features
        usage_instructions TEXT, -- For skincare items
        stock INTEGER DEFAULT 10,
        min_stock_level INTEGER DEFAULT 5,
        status TEXT DEFAULT 'active', -- 'active', 'draft'
        skincare_routine TEXT, -- JSON array representing routine instructions
        is_spotlight INTEGER DEFAULT 0, -- 1 if yes, 0 if no
        is_featured INTEGER DEFAULT 0 -- 1 if yes
      )
    `);

    // Reviews table
    await run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Cart items table
    await run(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        variant TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Addresses table
    await run(`
      CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address_line TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        country TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Orders table (Updated with tracking information)
    await run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_id_str TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL, -- 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'
        total REAL NOT NULL,
        subtotal REAL NOT NULL,
        shipping_cost REAL NOT NULL,
        discount REAL DEFAULT 0,
        shipping_address TEXT NOT NULL, -- JSON string
        payment_method TEXT NOT NULL, -- 'COD', 'UPI', 'CARD'
        payment_status TEXT NOT NULL, -- 'pending', 'paid'
        tracking_number TEXT,
        courier_name TEXT,
        internal_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        delivery_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Order items table
    await run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        variant TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Wishlist table
    await run(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(user_id, product_id)
      )
    `);

    // Returns table (NEW)
    await run(`
      CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'refunded'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Settings table (NEW)
    await run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // FAQs table (NEW)
    await run(`
      CREATE TABLE IF NOT EXISTS faqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL
      )
    `);

    // OTPs table (NEW)
    await run(`
      CREATE TABLE IF NOT EXISTS otps (
        email TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        expires_at DATETIME NOT NULL
      )
    `);

    // Safe Alter Table Column Migrations for Existing Databases
    await safeAlterTable('users', "role TEXT DEFAULT 'customer'");
    await safeAlterTable('users', "status TEXT DEFAULT 'active'");
    
    await safeAlterTable('products', 'discount_price REAL DEFAULT 0');
    await safeAlterTable('products', 'stock INTEGER DEFAULT 10');
    await safeAlterTable('products', 'min_stock_level INTEGER DEFAULT 5');
    await safeAlterTable('products', "status TEXT DEFAULT 'active'");
    await safeAlterTable('products', 'skincare_routine TEXT');

    await safeAlterTable('orders', 'tracking_number TEXT');
    await safeAlterTable('orders', 'courier_name TEXT');
    await safeAlterTable('orders', 'internal_notes TEXT');
    await safeAlterTable('orders', 'payment_id TEXT');
    await safeAlterTable('orders', 'razorpay_order_id TEXT');

    logger.info('Database tables and migrations verified successfully.');
  } catch (err) {
    logger.error(`Error initializing tables: ${err.message}`);
  }
};

export default db;
