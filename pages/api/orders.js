import { supabase } from '../../lib/db';

export default async function handler(req, res) {
  // ── GET ─────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { data: orders, error } = await supabase
        .from('ord')
        .select(`
          ord_no, ord_date, status, cust_id, waiter_id,
          customer:customer(cust_fname, cust_lname),
          waiter:waiter(waiter_fname, waiter_lname)
        `)
        .order('ord_no', { ascending: false });
      if (error) throw error;

      const { data: allItems } = await supabase
        .from('contains')
        .select('ord_no, item_no, food:food(item_name, item_price)');

      const byOrder = {};
      (allItems || []).forEach(i => {
        if (!byOrder[i.ord_no]) byOrder[i.ord_no] = [];
        byOrder[i.ord_no].push({
          ord_no: i.ord_no,
          item_no: i.item_no,
          item_name: i.food?.item_name,
          item_price: i.food?.item_price,
        });
      });

      const result = (orders || []).map(o => ({
        ...o,
        customer_name: o.customer
          ? `${o.customer.cust_fname} ${o.customer.cust_lname || ''}`.trim()
          : '',
        waiter_name: o.waiter
          ? `${o.waiter.waiter_fname} ${o.waiter.waiter_lname || ''}`.trim()
          : '',
        items: byOrder[o.ord_no] || [],
        customer: undefined,
        waiter: undefined,
      }));

      return res.json(result);
    } catch (e) {
      console.error('Orders GET error:', e.message);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { cust_fname, cust_lname, contact_no, waiter_id, items } = req.body || {};

    if (!cust_fname || !cust_fname.trim()) {
      return res.status(400).json({ error: 'Customer first name is required' });
    }
    if (!contact_no || !contact_no.trim()) {
      return res.status(400).json({ error: 'Contact number is required' });
    }
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
    const { data: waiter } = await supabase.from('waiter').select('waiter_id').eq('waiter_id', waiter_id).single();
    if (!waiter) {
      return res.status(400).json({ error: 'Selected waiter does not exist' });
    }

    try {
      // Count how many of each item in this order
      const itemCounts = {};
      for (const item_no of items) {
        itemCounts[item_no] = (itemCounts[item_no] || 0) + 1;
      }

      // Check stock for all items
      for (const [item_no, qty] of Object.entries(itemCounts)) {
        const { data: food } = await supabase.from('food').select('item_name, item_stock').eq('item_no', item_no).single();
        if (!food) {
          return res.status(400).json({ error: `Menu item #${item_no} does not exist` });
        }
        if (food.item_stock < qty) {
          return res.status(400).json({
            error: `"${food.item_name}" has only ${food.item_stock} left in stock (you ordered ${qty})`
          });
        }
      }

      // Find or create customer
      const { data: existingCust } = await supabase
        .from('customer')
        .select('*')
        .eq('cust_fname', cust_fname.trim())
        .eq('contact_no', contact_no.trim())
        .single();

      let cust_id;
      if (existingCust) {
        cust_id = existingCust.cust_id;
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from('customer')
          .insert({ cust_fname: cust_fname.trim(), cust_lname: (cust_lname || '').trim(), contact_no: contact_no.trim() })
          .select()
          .single();
        if (custErr) throw custErr;
        cust_id = newCust.cust_id;
      }

      // Create order
      const ord_date = new Date().toISOString().split('T')[0];
      const { data: newOrd, error: ordErr } = await supabase
        .from('ord')
        .insert({ ord_date, cust_id, waiter_id: parseInt(waiter_id, 10) })
        .select()
        .single();
      if (ordErr) throw ordErr;

      // Insert all items into contains and reduce stock
      const containsRows = items.map(item_no => ({ ord_no: newOrd.ord_no, item_no }));
      const { error: contErr } = await supabase.from('contains').insert(containsRows);
      if (contErr) throw contErr;

      // Reduce stock for each item
      for (const [item_no, qty] of Object.entries(itemCounts)) {
        const { data: cur } = await supabase.from('food').select('item_stock').eq('item_no', item_no).single();
        await supabase.from('food').update({ item_stock: cur.item_stock - qty }).eq('item_no', item_no);
      }

      return res.status(201).json({ ord_no: newOrd.ord_no, cust_id });
    } catch (e) {
      console.error('Orders POST error:', e.message);
      return res.status(500).json({ error: 'Failed to create order' });
    }
  }

  // ── 405 fallback ─────────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
