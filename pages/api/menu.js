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
      const items = query(db, 'SELECT * FROM food ORDER BY item_type, item_name');
      return res.json(items);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch menu' });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { item_name, item_type, item_price, item_stock } = req.body || {};

    // Validate required fields
    if (!item_name || !item_name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    if (!item_type || !item_type.trim()) {
      return res.status(400).json({ error: 'Item type is required' });
    }
    const price = parseFloat(item_price);
    if (!item_price || isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'A valid positive price is required' });
    }
    const stock = parseInt(item_stock, 10);
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock must be a non-negative number' });
    }

    try {
      const id = run(db, 'INSERT INTO food (item_name, item_type, item_price, item_stock) VALUES (?,?,?,?)',
        [item_name.trim(), item_type.trim(), price, stock]);
      return res.status(201).json({ item_no: id });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to add menu item' });
    }
  }

  // ── PUT ──────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { item_no, item_name, item_type, item_price, item_stock } = req.body || {};

    if (!item_no) return res.status(400).json({ error: 'item_no is required' });
    if (!item_name || !item_name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    if (!item_type || !item_type.trim()) {
      return res.status(400).json({ error: 'Item type is required' });
    }
    const price = parseFloat(item_price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'A valid positive price is required' });
    }
    const stock = parseInt(item_stock, 10);
    if (isNaN(stock) || stock < 0) {
      return res.status(400).json({ error: 'Stock must be a non-negative number' });
    }

    try {
      // Verify item exists
      const existing = query(db, 'SELECT item_no FROM food WHERE item_no=?', [item_no]);
      if (!existing.length) return res.status(404).json({ error: 'Menu item not found' });

      run(db, 'UPDATE food SET item_name=?, item_type=?, item_price=?, item_stock=? WHERE item_no=?',
        [item_name.trim(), item_type.trim(), price, stock, item_no]);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to update menu item' });
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { item_no } = req.body || {};
    if (!item_no) return res.status(400).json({ error: 'item_no is required' });

    try {
      // Check if this item is part of any active order — prevent orphan data
      const activeOrders = query(db,
        `SELECT o.ord_no FROM contains c
         JOIN ord o ON c.ord_no = o.ord_no
         WHERE c.item_no = ? AND o.status = 'active'`,
        [item_no]);
      if (activeOrders.length > 0) {
        return res.status(409).json({
          error: `Cannot delete: this item is in ${activeOrders.length} active order(s). Bill those orders first.`
        });
      }

      run(db, 'DELETE FROM food WHERE item_no=?', [item_no]);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete menu item' });
    }
  }

  // ── 405 fallback ─────────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
