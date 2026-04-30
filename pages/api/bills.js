import { getDb, query, run } from '../../lib/db';

export default async function handler(req, res) {
  let db;
  try {
    db = await getDb();
  } catch (e) {
    return res.status(500).json({ error: 'Database unavailable' });
  }

  // ── POST — Generate bill for an order ────────────────────────────────────────
  if (req.method === 'POST') {
    const { ord_no, discount = 0 } = req.body || {};

    if (!ord_no) return res.status(400).json({ error: 'ord_no is required' });

    const discountPct = parseFloat(discount);
    if (isNaN(discountPct) || discountPct < 0 || discountPct > 100) {
      return res.status(400).json({ error: 'Discount must be between 0 and 100' });
    }

    try {
      // Verify the order exists and is active
      const order = query(db, 'SELECT * FROM ord WHERE ord_no=?', [ord_no])[0];
      if (!order) return res.status(404).json({ error: 'Order not found' });

      // If bill already exists for this order, return it
      const existing = query(db, 'SELECT * FROM bill WHERE ord_no=?', [ord_no])[0];
      if (existing) {
        const items = query(db,
          'SELECT f.item_name, f.item_price FROM contains c JOIN food f ON c.item_no=f.item_no WHERE c.ord_no=?',
          [ord_no]);
        return res.json({ ...existing, items });
      }

      if (order.status !== 'active') {
        return res.status(400).json({ error: 'Order is not active (may already be billed)' });
      }

      const items = query(db,
        'SELECT f.item_name, f.item_price FROM contains c JOIN food f ON c.item_no=f.item_no WHERE c.ord_no=?',
        [ord_no]);

      if (items.length === 0) {
        return res.status(400).json({ error: 'Cannot bill an empty order' });
      }

      const tot_price = items.reduce((s, i) => s + i.item_price, 0);
      const tax = 5; // 5% GST

      // Correct billing formula:
      // 1. Apply discount on subtotal first
      // 2. Then apply tax on the discounted subtotal
      const discountAmount = tot_price * discountPct / 100;
      const discountedSubtotal = tot_price - discountAmount;
      const net_payable = parseFloat((discountedSubtotal * (1 + tax / 100)).toFixed(2));

      const bill_no = run(db,
        'INSERT INTO bill (tot_price, tax, discount, net_payable, ord_no) VALUES (?,?,?,?,?)',
        [tot_price, tax, discountPct, net_payable, ord_no]);

      run(db, "UPDATE ord SET status='billed' WHERE ord_no=?", [ord_no]);

      return res.status(201).json({ bill_no, tot_price, tax, discount: discountPct, net_payable, items, ord_no });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate bill' });
    }
  }

  // ── GET — Fetch one bill by ord_no, or all bills ─────────────────────────────
  if (req.method === 'GET') {
    try {
      const { ord_no } = req.query;
      if (ord_no) {
        const bill = query(db, 'SELECT * FROM bill WHERE ord_no=?', [ord_no])[0];
        if (!bill) return res.json(null);
        const items = query(db,
          'SELECT f.item_name, f.item_price FROM contains c JOIN food f ON c.item_no=f.item_no WHERE c.ord_no=?',
          [ord_no]);
        return res.json({ ...bill, items });
      }

      const bills = query(db, `
        SELECT b.*,
          TRIM(c.cust_fname || ' ' || COALESCE(c.cust_lname,'')) as customer_name
        FROM bill b
        JOIN ord o ON b.ord_no = o.ord_no
        LEFT JOIN customer c ON o.cust_id = c.cust_id
        ORDER BY b.bill_no DESC
      `);
      return res.json(bills);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch bills' });
    }
  }

  // ── 405 fallback ─────────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
