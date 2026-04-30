import { getDb, query, run } from '../../lib/db';

export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === 'POST') {
    const { ord_no, discount = 0 } = req.body;
    const existing = query(db, 'SELECT * FROM bill WHERE ord_no=?', [ord_no])[0];
    if (existing) {
      const items = query(db, 'SELECT f.item_name, f.item_price FROM contains c JOIN food f ON c.item_no=f.item_no WHERE c.ord_no=?', [ord_no]);
      return res.json({ ...existing, items });
    }
    const items = query(db, 'SELECT f.item_name, f.item_price FROM contains c JOIN food f ON c.item_no=f.item_no WHERE c.ord_no=?', [ord_no]);
    const tot_price = items.reduce((s, i) => s + i.item_price, 0);
    const tax = 5;
    const net_payable = tot_price + (tot_price * tax / 100) - (tot_price * discount / 100);
    const bill_no = run(db, 'INSERT INTO bill (tot_price, tax, discount, net_payable, ord_no) VALUES (?,?,?,?,?)', [tot_price, tax, discount, net_payable, ord_no]);
    run(db, "UPDATE ord SET status='billed' WHERE ord_no=?", [ord_no]);
    return res.json({ bill_no, tot_price, tax, discount, net_payable, items, ord_no });
  }

  if (req.method === 'GET') {
    const { ord_no } = req.query;
    if (ord_no) {
      const bill = query(db, 'SELECT * FROM bill WHERE ord_no=?', [ord_no])[0];
      if (!bill) return res.json(null);
      const items = query(db, 'SELECT f.item_name, f.item_price FROM contains c JOIN food f ON c.item_no=f.item_no WHERE c.ord_no=?', [ord_no]);
      return res.json({ ...bill, items });
    }
    const bills = query(db, `SELECT b.*, c.cust_fname || ' ' || COALESCE(c.cust_lname,'') as customer_name FROM bill b JOIN ord o ON b.ord_no=o.ord_no LEFT JOIN customer c ON o.cust_id=c.cust_id ORDER BY b.bill_no DESC`);
    return res.json(bills);
  }
}
