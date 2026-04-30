import { getDb, query, run } from '../../lib/db';

export default async function handler(req, res) {
  const db = await getDb();
  const { type } = req.query;

  if (type === 'waiters') {
    if (req.method === 'GET') {
      const waiters = query(db, `SELECT w.*, COALESCE(SUM(t.tips),0) as total_tips FROM waiter w LEFT JOIN tips t ON w.waiter_id=t.waiter_id GROUP BY w.waiter_id`);
      return res.json(waiters);
    }
    if (req.method === 'POST') {
      const { waiter_fname, waiter_lname } = req.body;
      const id = run(db, 'INSERT INTO waiter (waiter_fname, waiter_lname) VALUES (?,?)', [waiter_fname, waiter_lname]);
      return res.json({ waiter_id: id });
    }
    if (req.method === 'DELETE') {
      run(db, 'DELETE FROM waiter WHERE waiter_id=?', [req.body.waiter_id]);
      return res.json({ success: true });
    }
  }
  if (type === 'chefs') {
    if (req.method === 'GET') return res.json(query(db, 'SELECT * FROM chef'));
    if (req.method === 'POST') {
      const { chef_fname, chef_lname, chef_type } = req.body;
      const id = run(db, 'INSERT INTO chef (chef_fname, chef_lname, chef_type) VALUES (?,?,?)', [chef_fname, chef_lname, chef_type]);
      return res.json({ chef_id: id });
    }
  }
  if (type === 'tips') {
    if (req.method === 'POST') {
      const { waiter_id, cust_id, tips } = req.body;
      run(db, 'INSERT INTO tips (waiter_id, cust_id, tips) VALUES (?,?,?)', [waiter_id, cust_id, tips]);
      return res.json({ success: true });
    }
  }
  if (type === 'customers') {
    return res.json(query(db, 'SELECT * FROM customer ORDER BY cust_id DESC'));
  }
  res.status(404).json({ error: 'Not found' });
}
