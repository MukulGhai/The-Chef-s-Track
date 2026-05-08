import { supabase } from '../../lib/db';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req, res) {
  // ── GET ─────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('food')
        .select('*')
        .order('item_type')
        .order('item_name');
      if (error) throw error;
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch menu' });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { item_name, item_type, item_price, item_stock, item_image, item_description } = req.body || {};

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
      const { data, error } = await supabase
        .from('food')
        .insert({
          item_name: item_name.trim(),
          item_type: item_type.trim(),
          item_price: price,
          item_stock: stock,
          item_image: (item_image || '').trim(),
          item_description: (item_description || '').trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ item_no: data.item_no });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to add menu item' });
    }
  }

  // ── PUT ──────────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { item_no, item_name, item_type, item_price, item_stock, item_image, item_description } = req.body || {};

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
      const { data: existing } = await supabase.from('food').select('item_no').eq('item_no', item_no).single();
      if (!existing) return res.status(404).json({ error: 'Menu item not found' });

      const updates = {
        item_name: item_name.trim(),
        item_type: item_type.trim(),
        item_price: price,
        item_stock: stock,
      };
      if (item_image !== undefined) updates.item_image = (item_image || '').trim();
      if (item_description !== undefined) updates.item_description = (item_description || '').trim();

      const { error } = await supabase.from('food').update(updates).eq('item_no', item_no);
      if (error) throw error;
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
      // Check if this item is part of any active order
      const { data: activeContains } = await supabase
        .from('contains')
        .select('ord_no, ord!inner(status)')
        .eq('item_no', item_no)
        .eq('ord.status', 'active');

      if (activeContains && activeContains.length > 0) {
        return res.status(409).json({
          error: `Cannot delete: this item is in ${activeContains.length} active order(s). Bill those orders first.`
        });
      }

      const { error } = await supabase.from('food').delete().eq('item_no', item_no);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete menu item' });
    }
  }

  // ── 405 fallback ─────────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
