import { getDb, query, run } from '../../lib/db';

export default async function handler(req, res) {
  let db;
  try {
    db = await getDb();
  } catch (e) {
    return res.status(500).json({ error: 'Database unavailable' });
  }

  // ── GET ─────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const orders = query(db, `
        SELECT o.ord_no, o.ord_date, o.status, o.cust_id, o.waiter_id,
          TRIM(c.cust_fname || ' ' || COALESCE(c.cust_lname,'')) as customer_name,
          TRIM(w.waiter_fname || ' ' || COALESCE(w.waiter_lname,'')) as waiter_name
        FROM ord o
        LEFT JOIN customer c ON o.cust_id = c.cust_id
        LEFT JOIN waiter w ON o.waiter_id = w.waiter_id
        ORDER BY o.ord_no DESC
      `);
      const allItems = query(db, `
        SELECT c.ord_no, f.item_no, f.item_name, f.item_price
        FROM contains c
        JOIN food f ON c.item_no = f.item_no
      `);
      // Group items by order number
      const byOrder = {};
      allItems.forEach(i => {
        if (!byOrder[i.ord_no]) byOrder[i.ord_no] = [];
        byOrder[i.ord_no].push(i);
      });
      orders.forEach(o => { o.items = byOrder[o.ord_no] || []; });
      return res.json(orders);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { cust_fname, cust_lname, contact_no, waiter_id, items } = req.body || {};

    // Validate required fields
    if (!cust_fname || !cust_fname.trim()) {
      return res.status(400).json({ error: 'Customer first name is required' });
    }
    if (!contact_no || !contact_no.trim()) {
      return res.status(400).json({ error: 'Contact number is required' });
    }
    // Validate contact number (10 digits)
    if (!/^\d{10}$/.test(contact_no.trim())) {
      return res.status(400).json({ error: 'Contact number must be exactly 10 digits' });
    }
    if (!waiter_id) {
      return res.status(400).json({ error: 'A waiter must be assigned' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items selected' });
    }

    // Validate waiter exists
    const waiter = query(db, 'SELECT waiter_id FROM waiter WHERE waiter_id=?', [waiter_id])[0];
    if (!waiter) {
      return res.status(400).json({ error: 'Selected waiter does not exist' });
    }

    try {
      // Count how many of each item is in this order to handle duplicates correctly
      const itemCounts = {};
      for (const item_no of items) {
        itemCounts[item_no] = (itemCounts[item_no] || 0) + 1;
      }

      // Check stock for all items, accounting for quantities in the same order
      for (const [item_no, qty] of Object.entries(itemCounts)) {
        const food = query(db, 'SELECT item_name, item_stock FROM food WHERE item_no=?', [item_no])[0];
        if (!food) {
          return res.status(400).json({ error: `Menu item #${item_no} does not exist` });
        }
        if (food.item_stock < qty) {
          return res.status(400).json({
            error: `"${food.item_name}" has only ${food.item_stock} left in stock (you ordered ${qty})`
          });
        }
      }

      // Find or create customer (match by name + contact)
      let customer = query(db,
        'SELECT * FROM customer WHERE cust_fname=? AND contact_no=?',
        [cust_fname.trim(), contact_no.trim()])[0];
      if (!customer) {
        const cid = run(db,
          'INSERT INTO customer (cust_fname, cust_lname, contact_no) VALUES (?,?,?)',
          [cust_fname.trim(), (cust_lname || '').trim(), contact_no.trim()]);
        customer = { cust_id: cid };
      }

      // Create order
      const ord_date = new Date().toISOString().split('T')[0];
      const ord_no = run(db,
        'INSERT INTO ord (ord_date, cust_id, waiter_id) VALUES (?,?,?)',
        [ord_date, customer.cust_id, parseInt(waiter_id, 10)]);

      // Insert all items and reduce stock
      for (const item_no of items) {
        run(db, 'INSERT INTO contains (ord_no, item_no) VALUES (?,?)', [ord_no, item_no]);
        run(db, 'UPDATE food SET item_stock = item_stock - 1 WHERE item_no=?', [item_no]);
      }

      return res.status(201).json({ ord_no, cust_id: customer.cust_id });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to create order' });
    }
  }

  // ── 405 fallback ─────────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
