import { getDb, query, run } from '../../lib/db';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === 'GET') {
    const items = query(db, 'SELECT * FROM food ORDER BY item_type, item_name');
    return res.json(items);
  }
  if (req.method === 'POST') {
    const { item_name, item_type, item_price, item_stock } = req.body;
    if (!item_name || !item_type || !item_price) return res.status(400).json({ error: 'Missing fields' });
    const id = run(db, 'INSERT INTO food (item_name, item_type, item_price, item_stock) VALUES (?,?,?,?)', [item_name, item_type, item_price, item_stock || 0]);
    return res.json({ item_no: id });
  }
  if (req.method === 'PUT') {
    const { item_no, item_name, item_type, item_price, item_stock } = req.body;
    run(db, 'UPDATE food SET item_name=?, item_type=?, item_price=?, item_stock=? WHERE item_no=?', [item_name, item_type, item_price, item_stock, item_no]);
    return res.json({ success: true });
  }
  if (req.method === 'DELETE') {
    const { item_no } = req.body;
    run(db, 'DELETE FROM food WHERE item_no=?', [item_no]);
    return res.json({ success: true });
  }
}
