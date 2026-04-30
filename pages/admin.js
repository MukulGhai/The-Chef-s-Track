import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ADMIN_PASSWORD = 'admin123';

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [newItem, setNewItem] = useState({ item_name: '', item_type: 'Main Course', item_price: '', item_stock: '' });
  const [newWaiter, setNewWaiter] = useState({ waiter_fname: '', waiter_lname: '' });
  const [newChef, setNewChef] = useState({ chef_fname: '', chef_lname: '', chef_type: 'Head_Chef' });
  const [editItem, setEditItem] = useState(null);
  const [discountOrd, setDiscountOrd] = useState({});

  const loadAll = () => {
    fetch('/api/menu').then(r => r.json()).then(setMenu);
    fetch('/api/orders').then(r => r.json()).then(setOrders);
    fetch('/api/staff?type=waiters').then(r => r.json()).then(setWaiters);
    fetch('/api/staff?type=chefs').then(r => r.json()).then(setChefs);
    fetch('/api/staff?type=customers').then(r => r.json()).then(setCustomers);
    fetch('/api/bills').then(r => r.json()).then(setBills);
  };

  useEffect(() => { if (auth) loadAll(); }, [auth]);

  const stats = {
    totalOrders: orders.length,
    totalRevenue: bills.reduce((s, b) => s + (b.net_payable || 0), 0),
    menuItems: menu.length,
    activeOrders: orders.filter(o => o.status === 'active').length
  };

  const addMenuItem = async () => {
    await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    setNewItem({ item_name: '', item_type: 'Main Course', item_price: '', item_stock: '' });
    loadAll();
  };

  const deleteMenuItem = async (item_no) => {
    if (!confirm('Delete this item?')) return;
    await fetch('/api/menu', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_no }) });
    loadAll();
  };

  const saveEdit = async () => {
    await fetch('/api/menu', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editItem) });
    setEditItem(null);
    loadAll();
  };

  const addWaiter = async () => {
    await fetch('/api/staff?type=waiters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newWaiter) });
    setNewWaiter({ waiter_fname: '', waiter_lname: '' });
    loadAll();
  };

  const addChef = async () => {
    await fetch('/api/staff?type=chefs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newChef) });
    setNewChef({ chef_fname: '', chef_lname: '', chef_type: 'Head_Chef' });
    loadAll();
  };

  const generateBill = async (ord_no) => {
    const disc = discountOrd[ord_no] || 0;
    await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ord_no, discount: disc }) });
    loadAll();
  };

  if (!auth) return (
    <>
      <Head><title>Admin Login — The Chef's Track</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1208; font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .login-box { background: white; border-radius: 20px; padding: 3rem; width: min(400px, 90vw); text-align: center; }
        .login-box h1 { font-family: 'Playfair Display', serif; font-size: 2rem; color: #1a1208; margin-bottom: 0.5rem; }
        .login-box p { color: #8a7a65; margin-bottom: 2rem; }
        input { width: 100%; padding: 0.8rem 1rem; border: 1.5px solid #e0d8cc; border-radius: 10px; font-size: 1rem; font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 1rem; }
        input:focus { border-color: #c8963e; }
        button { width: 100%; background: #c8963e; color: #1a1208; border: none; padding: 1rem; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .hint { margin-top: 1rem; font-size: 0.8rem; color: #aaa; }
        .back-link { display: block; margin-top: 1rem; color: #c8963e; text-decoration: none; font-size: 0.9rem; }
      `}</style>
      <div className="login-box">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h1>Admin Panel</h1>
        <p>The Chef's Track Management</p>
        <input type="password" placeholder="Enter admin password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && password === ADMIN_PASSWORD && setAuth(true)} />
        <button onClick={() => password === ADMIN_PASSWORD ? setAuth(true) : alert('Wrong password!')}>Login</button>
        <p className="hint">Hint: admin123</p>
        <Link href="/" className="back-link">← Back to Restaurant</Link>
      </div>
    </>
  );

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'menu', label: '🍽 Menu' },
    { id: 'orders', label: '📋 Orders' },
    { id: 'bills', label: '💳 Bills' },
    { id: 'staff', label: '👥 Staff' },
    { id: 'customers', label: '👤 Customers' },
  ];

  return (
    <>
      <Head>
        <title>Admin — The Chef's Track</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --dark: #1a1208; --gold: #c8963e; --cream: #faf6f0; --text: #2d2010; --muted: #8a7a65; --rust: #8b3a1e; }
        body { font-family: 'DM Sans', sans-serif; background: #f4f0ea; min-height: 100vh; }
        .layout { display: flex; min-height: 100vh; }
        .sidebar { width: 240px; background: var(--dark); color: white; padding: 1.5rem 0; display: flex; flex-direction: column; position: fixed; top: 0; bottom: 0; left: 0; }
        .sidebar-logo { padding: 0 1.5rem 1.5rem; border-bottom: 1px solid rgba(200,150,62,0.3); margin-bottom: 1rem; }
        .sidebar-logo span { font-family: 'Playfair Display', serif; color: var(--gold); font-size: 1.2rem; font-weight: 900; }
        .sidebar-logo p { color: #8a7060; font-size: 0.75rem; margin-top: 0.2rem; }
        .nav-item { padding: 0.75rem 1.5rem; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: #c9b99a; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
        .nav-item:hover { background: rgba(200,150,62,0.1); color: var(--gold); }
        .nav-item.active { background: rgba(200,150,62,0.15); color: var(--gold); border-left: 3px solid var(--gold); }
        .sidebar-footer { margin-top: auto; padding: 1.5rem; border-top: 1px solid rgba(200,150,62,0.2); }
        .logout-btn { background: none; border: 1px solid rgba(200,150,62,0.3); color: #c9b99a; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; width: 100%; }
        .logout-btn:hover { border-color: var(--gold); color: var(--gold); }
        .main-content { margin-left: 240px; flex: 1; padding: 2rem; }
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--dark); }
        .page-header p { color: var(--muted); margin-top: 0.25rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
        .stat-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .stat-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .stat-value { font-size: 2rem; font-weight: 800; color: var(--dark); font-family: 'Playfair Display', serif; }
        .stat-label { color: var(--muted); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 0.25rem; }
        .card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 1.5rem; }
        .card h2 { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: var(--dark); margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 2px solid #f0ebe3; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--muted); background: #faf6f0; }
        td { padding: 0.75rem; font-size: 0.9rem; border-bottom: 1px solid #f0ebe3; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        .badge { padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; }
        .badge-active { background: #e8f5e9; color: #2e7d32; }
        .badge-billed { background: #e3f2fd; color: #1565c0; }
        .badge-gold { background: #fff8e1; color: #e65100; }
        .action-btn { padding: 0.4rem 0.9rem; border-radius: 8px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .btn-delete { background: #fce4e4; color: #c62828; }
        .btn-delete:hover { background: #ef9a9a; }
        .btn-edit { background: #e3f2fd; color: #1565c0; margin-right: 0.5rem; }
        .btn-edit:hover { background: #90caf9; }
        .btn-bill { background: #e8f5e9; color: #2e7d32; }
        .btn-bill:hover { background: #a5d6a7; }
        .btn-primary { background: var(--gold); color: var(--dark); }
        .btn-primary:hover { background: #e8b86d; }
        .form-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; align-items: end; }
        .form-field label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem; }
        .form-field input, .form-field select { width: 100%; padding: 0.65rem 0.85rem; border: 1.5px solid #e0d8cc; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; background: var(--cream); }
        .form-field input:focus, .form-field select:focus { border-color: var(--gold); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 300; display: flex; align-items: center; justify-content: center; }
        .modal { background: white; border-radius: 16px; padding: 2rem; width: min(480px, 90vw); }
        .modal h3 { font-family: 'Playfair Display', serif; font-size: 1.4rem; margin-bottom: 1.25rem; }
        .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: flex-end; }
        .disc-input { width: 60px; padding: 0.3rem 0.5rem; border: 1.5px solid #e0d8cc; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; }
        .view-site-btn { background: rgba(200,150,62,0.1); color: var(--gold); border: 1px solid rgba(200,150,62,0.3); padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600; }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span>🍽 The Chef's Track</span>
            <p>Admin Panel</p>
          </div>
          {tabs.map(t => (
            <div key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
          <div className="sidebar-footer">
            <Link href="/" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'center', color: '#c8963e', textDecoration: 'none', fontSize: '0.85rem' }}>← View Restaurant</Link>
            <button className="logout-btn" onClick={() => setAuth(false)}>Logout</button>
          </div>
        </aside>

        <main className="main-content">
          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <>
              <div className="page-header">
                <h1>Dashboard</h1>
                <p>Restaurant overview at a glance</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{stats.totalOrders}</div><div className="stat-label">Total Orders</div></div>
                <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-value">₹{stats.totalRevenue.toFixed(0)}</div><div className="stat-label">Total Revenue</div></div>
                <div className="stat-card"><div className="stat-icon">🍽</div><div className="stat-value">{stats.menuItems}</div><div className="stat-label">Menu Items</div></div>
                <div className="stat-card"><div className="stat-icon">🔥</div><div className="stat-value">{stats.activeOrders}</div><div className="stat-label">Active Orders</div></div>
                <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{customers.length}</div><div className="stat-label">Customers</div></div>
                <div className="stat-card"><div className="stat-icon">🧾</div><div className="stat-value">{bills.length}</div><div className="stat-label">Bills Generated</div></div>
              </div>
              <div className="card">
                <h2>Recent Orders</h2>
                <table>
                  <thead><tr><th>Order #</th><th>Customer</th><th>Waiter</th><th>Date</th><th>Items</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.ord_no}>
                        <td><strong>#{o.ord_no}</strong></td>
                        <td>{o.customer_name}</td>
                        <td>{o.waiter_name}</td>
                        <td>{o.ord_date}</td>
                        <td>{o.items?.length || 0}</td>
                        <td><span className={`badge ${o.status === 'active' ? 'badge-active' : 'badge-billed'}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* MENU */}
          {tab === 'menu' && (
            <>
              <div className="page-header"><h1>Menu Management</h1><p>Add, edit or remove menu items</p></div>
              <div className="card">
                <h2>Add New Item</h2>
                <div className="form-row">
                  <div className="form-field"><label>Item Name</label><input value={newItem.item_name} onChange={e => setNewItem(n => ({ ...n, item_name: e.target.value }))} placeholder="e.g. Paneer Tikka" /></div>
                  <div className="form-field"><label>Type</label>
                    <select value={newItem.item_type} onChange={e => setNewItem(n => ({ ...n, item_type: e.target.value }))}>
                      <option>Main Course</option><option>Appetizer</option><option>Dessert</option><option>Beverage</option>
                    </select>
                  </div>
                  <div className="form-field"><label>Price (₹)</label><input type="number" value={newItem.item_price} onChange={e => setNewItem(n => ({ ...n, item_price: e.target.value }))} placeholder="120" /></div>
                  <div className="form-field"><label>Stock</label><input type="number" value={newItem.item_stock} onChange={e => setNewItem(n => ({ ...n, item_stock: e.target.value }))} placeholder="50" /></div>
                  <div className="form-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="action-btn btn-primary" style={{ width: '100%', padding: '0.65rem' }} onClick={addMenuItem}>+ Add Item</button>
                  </div>
                </div>
              </div>
              <div className="card">
                <h2>All Menu Items ({menu.length})</h2>
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Type</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                  <tbody>
                    {menu.map(item => (
                      <tr key={item.item_no}>
                        <td>{item.item_no}</td>
                        <td><strong>{item.item_name}</strong></td>
                        <td><span className="badge badge-gold">{item.item_type}</span></td>
                        <td>₹{item.item_price}</td>
                        <td><span className={`badge ${item.item_stock > 10 ? 'badge-active' : item.item_stock > 0 ? 'badge-gold' : 'badge-billed'}`}>{item.item_stock}</span></td>
                        <td>
                          <button className="action-btn btn-edit" onClick={() => setEditItem({ ...item })}>Edit</button>
                          <button className="action-btn btn-delete" onClick={() => deleteMenuItem(item.item_no)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ORDERS */}
          {tab === 'orders' && (
            <>
              <div className="page-header"><h1>Orders</h1><p>Manage all customer orders</p></div>
              <div className="card">
                <h2>All Orders ({orders.length})</h2>
                <table>
                  <thead><tr><th>Order #</th><th>Customer</th><th>Waiter</th><th>Date</th><th>Items</th><th>Status</th><th>Discount %</th><th>Action</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.ord_no}>
                        <td><strong>#{o.ord_no}</strong></td>
                        <td>{o.customer_name}</td>
                        <td>{o.waiter_name}</td>
                        <td>{o.ord_date}</td>
                        <td>{o.items?.map(i => i.item_name).join(', ') || '-'}</td>
                        <td><span className={`badge ${o.status === 'active' ? 'badge-active' : 'badge-billed'}`}>{o.status}</span></td>
                        <td>
                          {o.status === 'active' && (
                            <input className="disc-input" type="number" min="0" max="100" placeholder="0"
                              value={discountOrd[o.ord_no] || ''}
                              onChange={e => setDiscountOrd(d => ({ ...d, [o.ord_no]: e.target.value }))} />
                          )}
                        </td>
                        <td>
                          {o.status === 'active' && (
                            <button className="action-btn btn-bill" onClick={() => generateBill(o.ord_no)}>Generate Bill</button>
                          )}
                          {o.status === 'billed' && <span style={{ color: '#888', fontSize: '0.8rem' }}>✓ Billed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* BILLS */}
          {tab === 'bills' && (
            <>
              <div className="page-header"><h1>Bills</h1><p>All generated bills</p></div>
              <div className="card">
                <h2>Bills ({bills.length}) — Total Revenue: ₹{bills.reduce((s, b) => s + (b.net_payable || 0), 0).toFixed(2)}</h2>
                <table>
                  <thead><tr><th>Bill #</th><th>Order #</th><th>Customer</th><th>Total</th><th>Tax (5%)</th><th>Discount</th><th>Net Payable</th></tr></thead>
                  <tbody>
                    {bills.map(b => (
                      <tr key={b.bill_no}>
                        <td><strong>#{b.bill_no}</strong></td>
                        <td>#{b.ord_no}</td>
                        <td>{b.customer_name}</td>
                        <td>₹{b.tot_price}</td>
                        <td>₹{(b.tot_price * 0.05).toFixed(2)}</td>
                        <td>{b.discount}%</td>
                        <td><strong style={{ color: 'var(--rust)' }}>₹{Number(b.net_payable).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* STAFF */}
          {tab === 'staff' && (
            <>
              <div className="page-header"><h1>Staff Management</h1><p>Manage waiters and chefs</p></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                  <h2>Waiters ({waiters.length})</h2>
                  <div className="form-row" style={{ marginBottom: '1rem' }}>
                    <div className="form-field"><label>First Name</label><input value={newWaiter.waiter_fname} onChange={e => setNewWaiter(w => ({ ...w, waiter_fname: e.target.value }))} /></div>
                    <div className="form-field"><label>Last Name</label><input value={newWaiter.waiter_lname} onChange={e => setNewWaiter(w => ({ ...w, waiter_lname: e.target.value }))} /></div>
                  </div>
                  <button className="action-btn btn-primary" style={{ marginBottom: '1rem', padding: '0.6rem 1rem' }} onClick={addWaiter}>+ Add Waiter</button>
                  <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Total Tips</th></tr></thead>
                    <tbody>
                      {waiters.map(w => (
                        <tr key={w.waiter_id}>
                          <td>{w.waiter_id}</td>
                          <td>{w.waiter_fname} {w.waiter_lname}</td>
                          <td style={{ color: 'var(--rust)', fontWeight: 600 }}>₹{w.total_tips || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="card">
                  <h2>Chefs ({chefs.length})</h2>
                  <div className="form-row" style={{ marginBottom: '1rem' }}>
                    <div className="form-field"><label>First Name</label><input value={newChef.chef_fname} onChange={e => setNewChef(c => ({ ...c, chef_fname: e.target.value }))} /></div>
                    <div className="form-field"><label>Last Name</label><input value={newChef.chef_lname} onChange={e => setNewChef(c => ({ ...c, chef_lname: e.target.value }))} /></div>
                    <div className="form-field"><label>Type</label>
                      <select value={newChef.chef_type} onChange={e => setNewChef(c => ({ ...c, chef_type: e.target.value }))}>
                        <option>Head_Chef</option><option>Sous_Chef</option><option>Pastry_Chef</option>
                      </select>
                    </div>
                  </div>
                  <button className="action-btn btn-primary" style={{ marginBottom: '1rem', padding: '0.6rem 1rem' }} onClick={addChef}>+ Add Chef</button>
                  <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Type</th></tr></thead>
                    <tbody>
                      {chefs.map(c => (
                        <tr key={c.chef_id}>
                          <td>{c.chef_id}</td>
                          <td>{c.chef_fname} {c.chef_lname}</td>
                          <td><span className="badge badge-gold">{c.chef_type}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* CUSTOMERS */}
          {tab === 'customers' && (
            <>
              <div className="page-header"><h1>Customers</h1><p>All registered customers</p></div>
              <div className="card">
                <h2>Customer Database ({customers.length})</h2>
                <table>
                  <thead><tr><th>ID</th><th>First Name</th><th>Last Name</th><th>Contact</th></tr></thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.cust_id}>
                        <td>{c.cust_id}</td>
                        <td>{c.cust_fname}</td>
                        <td>{c.cust_lname || '-'}</td>
                        <td>{c.contact_no}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Menu Item</h3>
            <div className="form-field" style={{ marginBottom: '1rem' }}><label>Name</label><input value={editItem.item_name} onChange={e => setEditItem(i => ({ ...i, item_name: e.target.value }))} /></div>
            <div className="form-field" style={{ marginBottom: '1rem' }}><label>Type</label>
              <select value={editItem.item_type} onChange={e => setEditItem(i => ({ ...i, item_type: e.target.value }))}>
                <option>Main Course</option><option>Appetizer</option><option>Dessert</option><option>Beverage</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: '1rem' }}><label>Price</label><input type="number" value={editItem.item_price} onChange={e => setEditItem(i => ({ ...i, item_price: e.target.value }))} /></div>
            <div className="form-field"><label>Stock</label><input type="number" value={editItem.item_stock} onChange={e => setEditItem(i => ({ ...i, item_stock: e.target.value }))} /></div>
            <div className="modal-actions">
              <button className="action-btn btn-delete" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="action-btn btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
