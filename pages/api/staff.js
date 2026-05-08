import { supabase } from '../../lib/db';

export default async function handler(req, res) {
  const { type } = req.query;

  // ── WAITERS ──────────────────────────────────────────────────────────────────
  if (type === 'waiters') {
    if (req.method === 'GET') {
      try {
        const { data: waiters, error } = await supabase
          .from('waiter')
          .select('*')
          .order('waiter_fname');
        if (error) throw error;

        // Get total tips per waiter
        const { data: tipRows } = await supabase.from('tips').select('waiter_id, tips');
        const tipMap = {};
        (tipRows || []).forEach(t => {
          tipMap[t.waiter_id] = (tipMap[t.waiter_id] || 0) + Number(t.tips);
        });

        const result = (waiters || []).map(w => ({
          ...w,
          total_tips: tipMap[w.waiter_id] || 0,
        }));

        return res.json(result);
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
        const { data, error } = await supabase
          .from('waiter')
          .insert({ waiter_fname: waiter_fname.trim(), waiter_lname: (waiter_lname || '').trim() })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json({ waiter_id: data.waiter_id });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to add waiter' });
      }
    }

    if (req.method === 'DELETE') {
      const { waiter_id } = req.body || {};
      if (!waiter_id) return res.status(400).json({ error: 'waiter_id is required' });

      try {
        const { data: existing } = await supabase.from('waiter').select('waiter_id').eq('waiter_id', waiter_id).single();
        if (!existing) return res.status(404).json({ error: 'Waiter not found' });

        const { data: activeOrders } = await supabase
          .from('ord')
          .select('ord_no')
          .eq('waiter_id', waiter_id)
          .eq('status', 'active');

        if (activeOrders && activeOrders.length > 0) {
          return res.status(409).json({
            error: `Cannot delete: waiter has ${activeOrders.length} active order(s). Bill those orders first.`
          });
        }

        await supabase.from('tips').delete().eq('waiter_id', waiter_id);
        await supabase.from('waiter').delete().eq('waiter_id', waiter_id);
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
        const { data, error } = await supabase.from('chef').select('*').order('chef_fname');
        if (error) throw error;
        return res.json(data);
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
        const { data, error } = await supabase
          .from('chef')
          .insert({ chef_fname: chef_fname.trim(), chef_lname: (chef_lname || '').trim(), chef_type: chef_type.trim() })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json({ chef_id: data.chef_id });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to add chef' });
      }
    }

    if (req.method === 'DELETE') {
      const { chef_id } = req.body || {};
      if (!chef_id) return res.status(400).json({ error: 'chef_id is required' });
      try {
        const { data: existing } = await supabase.from('chef').select('chef_id').eq('chef_id', chef_id).single();
        if (!existing) return res.status(404).json({ error: 'Chef not found' });
        await supabase.from('chef').delete().eq('chef_id', chef_id);
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
        const { error } = await supabase
          .from('tips')
          .insert({ waiter_id, cust_id, tips: tipAmount });
        if (error) throw error;
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
        const { data, error } = await supabase.from('customer').select('*').order('cust_id', { ascending: false });
        if (error) throw error;
        return res.json(data);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to fetch customers' });
      }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  return res.status(404).json({ error: `Unknown staff type: "${type}"` });
}
