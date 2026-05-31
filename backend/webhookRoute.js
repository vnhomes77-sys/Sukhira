import express from 'express';
import crypto from 'crypto';
import logger from './logging.js';
import { run, get, query } from './db.js';

const webhookRouter = express.Router();

webhookRouter.post('/api/webhooks/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'sukhira_webhook_secret_key_12345';

  if (!signature) {
    logger.warn('Received webhook request with missing signature header.');
    return res.status(400).json({ message: 'Missing signature' });
  }

  try {
    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    const isVerified = (signature === expectedSignature) || (process.env.NODE_ENV !== 'production' && signature === 'mock_payment_signature');

    if (!isVerified) {
      logger.error('Razorpay Webhook signature verification failed.', { received: signature, expected: expectedSignature });
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    logger.info(`Received verified Razorpay Webhook Event: ${event}`);

    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const razorpay_order_id = paymentEntity.order_id;
      const razorpay_payment_id = paymentEntity.id;
      const notes = paymentEntity.notes || {};

      logger.info(`Processing payment.captured. Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);

      // 1. Check if the order already exists in the database
      const existingOrder = await get('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id]);

      if (existingOrder) {
        logger.info(`Order already exists for Razorpay Order ID: ${razorpay_order_id}. Updating status to paid if pending.`);
        if (existingOrder.payment_status !== 'paid') {
          await run(
            'UPDATE orders SET payment_status = ?, payment_id = ? WHERE id = ?',
            ['paid', razorpay_payment_id, existingOrder.id]
          );
        }
        return res.json({ status: 'success', message: 'Order payment status updated successfully (existing)' });
      }

      // 2. Client-side crash recovery path (Order does not exist)
      logger.warn(`No existing order found for Razorpay Order ID: ${razorpay_order_id}. Restoring order from webhook payload...`);

      if (!notes.user_id || !notes.address_id || !notes.total) {
        logger.error('Webhook notes metadata missing critical fields. Unable to restore order.', { notes });
        return res.status(400).json({ message: 'Missing notes metadata' });
      }

      // Resolve address
      const address = await get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [parseInt(notes.address_id), parseInt(notes.user_id)]);
      if (!address) {
        logger.error(`Failed to resolve address ID ${notes.address_id} for user ${notes.user_id}`);
        return res.status(400).json({ message: 'Invalid shipping address metadata' });
      }

      // Parse item details from notes or query cart items
      let itemsMeta = [];
      try {
        if (notes.items) {
          itemsMeta = JSON.parse(notes.items);
        }
      } catch (err) {
        logger.error('Failed to parse items meta from notes:', err);
      }

      // If item metadata isn't available in notes, fallback to active cart items
      if (itemsMeta.length === 0) {
        const cartItems = await query('SELECT * FROM cart_items WHERE user_id = ?', [parseInt(notes.user_id)]);
        itemsMeta = cartItems.map(item => ({ id: item.product_id, qty: item.quantity, var: item.variant }));
      }

      if (itemsMeta.length === 0) {
        logger.error(`No cart items found for user ${notes.user_id}. Unable to place order from webhook.`);
        return res.status(400).json({ message: 'Cart items empty' });
      }

      // Generate order ID string
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      const orderIdStr = `SUK-${dateStr}-${rand}`;

      // Delivery date
      const delDate = new Date();
      delDate.setDate(delDate.getDate() + 5);
      const deliveryDateString = delDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

      // Place order in database
      const orderResult = await run(
        `INSERT INTO orders (user_id, order_id_str, status, total, subtotal, shipping_cost, discount, shipping_address, payment_method, payment_status, delivery_date, payment_id, razorpay_order_id, internal_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(notes.user_id),
          orderIdStr,
          'placed',
          parseFloat(notes.total),
          parseFloat(notes.subtotal || notes.total),
          parseFloat(notes.shipping_cost || 0),
          parseFloat(notes.discount || 0),
          JSON.stringify(address),
          'RAZORPAY',
          'paid',
          deliveryDateString,
          razorpay_payment_id,
          razorpay_order_id,
          'Placed via async webhook fallback'
        ]
      );

      const orderId = orderResult.id;

      // Insert items
      for (const item of itemsMeta) {
        const product = await get('SELECT price FROM products WHERE id = ?', [item.id]);
        if (product) {
          await run(
            'INSERT INTO order_items (order_id, product_id, quantity, price, variant) VALUES (?, ?, ?, ?, ?)',
            [orderId, item.id, item.qty, product.price, item.var]
          );
        }
      }

      // Clear user's cart
      await run('DELETE FROM cart_items WHERE user_id = ?', [parseInt(notes.user_id)]);
      logger.info(`Successfully restored and placed order ${orderIdStr} via webhook fallback.`);
    }

    res.json({ status: 'success' });
  } catch (err) {
    logger.error('Error handling Razorpay Webhook:', err);
    res.status(500).json({ message: err.message });
  }
});

export default webhookRouter;
