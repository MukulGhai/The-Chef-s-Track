import { supabase } from '../../lib/db';

export default async function handler(req, res) {
  // ── POST — Generate bill for an order ────────────────────────────────────────
  if (req.method === 'POST') {
    const { ord_no, discount = 0 } = req.body || {};

    if (!ord_no) return res.status(400).json({ error: 'ord_no is required' });

    const discountPct = parseFloat(discount);
    if (isNaN(discountPct) || discountPct < 0 || discountPct > 100) {
      return res.status(400).json({ error: 'Discount must be between 0 and 100' });
    }

    try {
      // Verify the order exists
      const { data: order } = await supabase.from('ord').select('*').eq('ord_no', ord_no).single();
      if (!order) return res.status(404).json({ error: 'Order not found' });

      // If bill already exists, return it
      const { data: existing } = await supabase.from('bill').select('*').eq('ord_no', ord_no).single();
      if (existing) {
        const { data: items } = await supabase
          .from('contains')
          .select('food:food(item_name, item_price)')
          .eq('ord_no', ord_no);
        const flatItems = (items || []).map(i => ({ item_name: i.food?.item_name, item_price: i.food?.item_price }));
        return res.json({ ...existing, items: flatItems });
      }

      if (order.status !== 'active') {
        return res.status(400).json({ error: 'Order is not active (may already be billed)' });
      }

      // Get order items
      const { data: itemRows } = await supabase
        .from('contains')
        .select('food:food(item_name, item_price)')
        .eq('ord_no', ord_no);
      const items = (itemRows || []).map(i => ({ item_name: i.food?.item_name, item_price: i.food?.item_price }));

      if (items.length === 0) {
        return res.status(400).json({ error: 'Cannot bill an empty order' });
      }

      const tot_price = items.reduce((s, i) => s + Number(i.item_price), 0);
      const tax = 5;
      const discountAmount = tot_price * discountPct / 100;
      const discountedSubtotal = tot_price - discountAmount;
      const net_payable = parseFloat((discountedSubtotal * (1 + tax / 100)).toFixed(2));

      const { data: newBill, error: billErr } = await supabase
        .from('bill')
        .insert({ tot_price, tax, discount: discountPct, net_payable, ord_no })
        .select()
        .single();
      if (billErr) throw billErr;

      await supabase.from('ord').update({ status: 'billed' }).eq('ord_no', ord_no);

      return res.status(201).json({
        bill_no: newBill.bill_no, tot_price, tax,
        discount: discountPct, net_payable, items, ord_no
      });
    } catch (e) {
      console.error('Bills POST error:', e.message);
      return res.status(500).json({ error: 'Failed to generate bill' });
    }
  }

  // ── GET — Fetch one bill by ord_no, or all bills ─────────────────────────────
  if (req.method === 'GET') {
    try {
      const { ord_no } = req.query;
      if (ord_no) {
        const { data: bill } = await supabase.from('bill').select('*').eq('ord_no', ord_no).single();
        if (!bill) return res.json(null);
        const { data: itemRows } = await supabase
          .from('contains')
          .select('food:food(item_name, item_price)')
          .eq('ord_no', ord_no);
        const items = (itemRows || []).map(i => ({ item_name: i.food?.item_name, item_price: i.food?.item_price }));
        return res.json({ ...bill, items });
      }

      // All bills with customer names
      const { data: bills, error } = await supabase
        .from('bill')
        .select(`
          *,
          ord:ord(cust_id, customer:customer(cust_fname, cust_lname))
        `)
        .order('bill_no', { ascending: false });
      if (error) throw error;

      const result = (bills || []).map(b => ({
        ...b,
        customer_name: b.ord?.customer
          ? `${b.ord.customer.cust_fname} ${b.ord.customer.cust_lname || ''}`.trim()
          : '',
        ord: undefined,
      }));

      return res.json(result);
    } catch (e) {
      console.error('Bills GET error:', e.message);
      return res.status(500).json({ error: 'Failed to fetch bills' });
    }
  }

  // ── 405 fallback ─────────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
