import { getDb, query, run } from '../../lib/db';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === 'GET') {
    const orders = query(db, `
      SELECT o.ord_no, o.ord_date, o.status, o.cust_id, o.waiter_id,
        c.cust_fname || ' ' || COALESCE(c.cust_lname,'') as customer_name,
        w.waiter_fname || ' ' || COALESCE(w.waiter_lname,'') as waiter_name
      FROM ord o
      LEFT JOIN customer c ON o.cust_id = c.cust_id
      LEFT JOIN waiter w ON o.waiter_id = w.waiter_id
      ORDER BY o.ord_no DESC
    `);
    const allItems = query(db, `SELECT c.ord_no, f.item_no, f.item_name, f.item_price FROM contains c JOIN food f ON c.item_no = f.item_no`);
    const byOrder = {};
    allItems.forEach(i => { if (!byOrder[i.ord_no]) byOrder[i.ord_no] = []; byOrder[i.ord_no].push(i); });
    orders.forEach(o => { o.items = byOrder[o.ord_no] || []; });
    return res.json(orders);
  }

  if (req.method === 'POST') {
    const { cust_fname, cust_lname, contact_no, waiter_id, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items selected' });

    let customer = query(db, 'SELECT * FROM customer WHERE cust_fname=? AND contact_no=?', [cust_fname, contact_no])[0];
    if (!customer) {
      const cid = run(db, 'INSERT INTO customer (cust_fname, cust_lname, contact_no) VALUES (?,?,?)', [cust_fname, cust_lname || '', contact_no]);
      customer = { cust_id: cid };
    }

    for (const item_no of items) {
      const food = query(db, 'SELECT item_stock FROM food WHERE item_no=?', [item_no])[0];
      if (!food || food.item_stock <= 0) return res.status(400).json({ error: `Item ${item_no} is out of stock` });
    }

    const ord_date = new Date().toISOString().split('T')[0];
    const ord_no = run(db, 'INSERT INTO ord (ord_date, cust_id, waiter_id) VALUES (?,?,?)', [ord_date, customer.cust_id, waiter_id]);

    for (const item_no of items) {
      run(db, 'INSERT INTO contains (ord_no, item_no) VALUES (?,?)', [ord_no, item_no]);
      run(db, 'UPDATE food SET item_stock = item_stock - 1 WHERE item_no=?', [item_no]);
    }

    return res.json({ ord_no, cust_id: customer.cust_id });
  }
}
