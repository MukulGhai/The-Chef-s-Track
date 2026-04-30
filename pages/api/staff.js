import { getDb, query, run } from '../../lib/db';

export default async function handler(req, res) {
  let db;
  try {
    db = await getDb();
  } catch (e) {
    return res.status(500).json({ error: 'Database unavailable' });
  }

  const { type } = req.query;

  // ── WAITERS ──────────────────────────────────────────────────────────────────
  if (type === 'waiters') {
    if (req.method === 'GET') {
      try {
        const waiters = query(db, `
          SELECT w.*, COALESCE(SUM(t.tips), 0) as total_tips
          FROM waiter w
          LEFT JOIN tips t ON w.waiter_id = t.waiter_id
          GROUP BY w.waiter_id
          ORDER BY w.waiter_fname
        `);
        return res.json(waiters);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch waiters' });
      }
    }

    if (req.method === 'POST') {
      const { waiter_fname, waiter_lname } = req.body || {};
      if (!waiter_fname || !waiter_fname.trim()) {
        return res.status(400).json({ error: 'Waiter first name is required' });
      }
      try {
        const id = run(db,
          'INSERT INTO waiter (waiter_fname, waiter_lname) VALUES (?,?)',
          [waiter_fname.trim(), (waiter_lname || '').trim()]);
        return res.status(201).json({ waiter_id: id });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to add waiter' });
      }
    }

    if (req.method === 'DELETE') {
      const { waiter_id } = req.body || {};
      if (!waiter_id) return res.status(400).json({ error: 'waiter_id is required' });

      try {
        // Verify waiter exists
        const existing = query(db, 'SELECT waiter_id FROM waiter WHERE waiter_id=?', [waiter_id])[0];
        if (!existing) return res.status(404).json({ error: 'Waiter not found' });

        // Check for active orders assigned to this waiter
        const activeOrders = query(db,
          "SELECT ord_no FROM ord WHERE waiter_id=? AND status='active'",
          [waiter_id]);
        if (activeOrders.length > 0) {
          return res.status(409).json({
            error: `Cannot delete: waiter has ${activeOrders.length} active order(s). Bill those orders first.`
          });
        }

        // Cascade delete tips for this waiter
        run(db, 'DELETE FROM tips WHERE waiter_id=?', [waiter_id]);
        run(db, 'DELETE FROM waiter WHERE waiter_id=?', [waiter_id]);
        return res.json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to delete waiter' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // ── CHEFS ─────────────────────────────────────────────────────────────────────
  if (type === 'chefs') {
    if (req.method === 'GET') {
      try {
        return res.json(query(db, 'SELECT * FROM chef ORDER BY chef_fname'));
      } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch chefs' });
      }
    }

    if (req.method === 'POST') {
      const { chef_fname, chef_lname, chef_type } = req.body || {};
      if (!chef_fname || !chef_fname.trim()) {
        return res.status(400).json({ error: 'Chef first name is required' });
      }
      if (!chef_type || !chef_type.trim()) {
        return res.status(400).json({ error: 'Chef type is required' });
      }
      try {
        const id = run(db,
          'INSERT INTO chef (chef_fname, chef_lname, chef_type) VALUES (?,?,?)',
          [chef_fname.trim(), (chef_lname || '').trim(), chef_type.trim()]);
        return res.status(201).json({ chef_id: id });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to add chef' });
      }
    }

    if (req.method === 'DELETE') {
      const { chef_id } = req.body || {};
      if (!chef_id) return res.status(400).json({ error: 'chef_id is required' });
      try {
        const existing = query(db, 'SELECT chef_id FROM chef WHERE chef_id=?', [chef_id])[0];
        if (!existing) return res.status(404).json({ error: 'Chef not found' });
        run(db, 'DELETE FROM chef WHERE chef_id=?', [chef_id]);
        return res.json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to delete chef' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // ── TIPS ──────────────────────────────────────────────────────────────────────
  if (type === 'tips') {
    if (req.method === 'POST') {
      const { waiter_id, cust_id, tips } = req.body || {};
      if (!waiter_id) return res.status(400).json({ error: 'waiter_id is required' });
      if (!cust_id) return res.status(400).json({ error: 'cust_id is required' });
      const tipAmount = parseFloat(tips);
      if (isNaN(tipAmount) || tipAmount < 0) {
        return res.status(400).json({ error: 'Tips must be a non-negative number' });
      }
      try {
        run(db,
          'INSERT INTO tips (waiter_id, cust_id, tips) VALUES (?,?,?)',
          [waiter_id, cust_id, tipAmount]);
        return res.status(201).json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to record tip' });
      }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // ── CUSTOMERS ─────────────────────────────────────────────────────────────────
  if (type === 'customers') {
    if (req.method === 'GET') {
      try {
        return res.json(query(db, 'SELECT * FROM customer ORDER BY cust_id DESC'));
      } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  return res.status(404).json({ error: `Unknown staff type: "${type}"` });
}
