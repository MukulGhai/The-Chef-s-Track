import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [step, setStep] = useState('menu'); // menu | checkout | bill
  const [form, setForm] = useState({ cust_fname: '', cust_lname: '', contact_no: '', waiter_id: '' });
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(setMenu);
    fetch('/api/staff?type=waiters').then(r => r.json()).then(setWaiters);
  }, []);

  const categories = ['All', ...new Set(menu.map(i => i.item_type))];
  const filtered = filter === 'All' ? menu : menu.filter(i => i.item_type === filter);

  const addToCart = (item) => {
    setCart(c => [...c, item]);
  };

  const removeFromCart = (idx) => {
    setCart(c => c.filter((_, i) => i !== idx));
  };

  const cartTotal = cart.reduce((s, i) => s + i.item_price, 0);

  const placeOrder = async () => {
    if (!form.cust_fname || !form.contact_no || !form.waiter_id) return alert('Please fill all fields');
    setLoading(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: cart.map(i => i.item_no) })
    });
    const data = await res.json();
    if (data.error) { alert(data.error); setLoading(false); return; }

    const billRes = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ord_no: data.ord_no, discount: 0 })
    });
    const billData = await billRes.json();
    setBill({ ...billData, ord_no: data.ord_no });
    setStep('bill');
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>The Chef's Track</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream: #faf6f0;
          --dark: #1a1208;
          --gold: #c8963e;
          --gold-light: #e8b86d;
          --rust: #8b3a1e;
          --sage: #5a6e4e;
          --text: #2d2010;
          --muted: #8a7a65;
        }
        body { background: var(--cream); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .nav {
          background: var(--dark);
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky; top: 0; z-index: 100;
          border-bottom: 2px solid var(--gold);
        }
        .nav-logo { font-family: 'Playfair Display', serif; color: var(--gold); font-size: 1.5rem; font-weight: 900; letter-spacing: 1px; }
        .nav-links { display: flex; gap: 1.5rem; align-items: center; }
        .nav-links a { color: #c9b99a; text-decoration: none; font-size: 0.875rem; font-weight: 500; letter-spacing: 0.5px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--gold); }
        .cart-btn {
          background: var(--gold);
          color: var(--dark);
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: 2rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          transition: background 0.2s;
        }
        .cart-btn:hover { background: var(--gold-light); }
        .hero {
          background: linear-gradient(135deg, var(--dark) 0%, #2d1a08 50%, #1a0f04 100%);
          color: white;
          padding: 4rem 2rem 3rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(200,150,62,0.15) 0%, transparent 70%);
        }
        .hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 900; line-height: 1.1; position: relative; }
        .hero h1 span { color: var(--gold); }
        .hero p { color: #c9b99a; margin-top: 1rem; font-size: 1.1rem; position: relative; }
        .main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .filters { display: flex; gap: 0.75rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .filter-btn {
          padding: 0.5rem 1.25rem;
          border-radius: 2rem;
          border: 1.5px solid var(--gold);
          background: transparent;
          color: var(--gold);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        .filter-btn.active, .filter-btn:hover { background: var(--gold); color: var(--dark); }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .menu-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(26,18,8,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid rgba(200,150,62,0.1);
        }
        .menu-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(26,18,8,0.14); }
        .card-img {
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3.5rem;
        }
        .card-body { padding: 1.25rem; }
        .card-type { font-size: 0.7rem; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 0.35rem; }
        .card-name { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: var(--dark); margin-bottom: 0.5rem; }
        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
        .card-price { font-size: 1.25rem; font-weight: 700; color: var(--rust); }
        .stock-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 1rem;
          font-weight: 600;
        }
        .stock-ok { background: #eaf5e9; color: var(--sage); }
        .stock-low { background: #fff3e0; color: #e65100; }
        .stock-out { background: #fce4e4; color: #c62828; }
        .add-btn {
          background: var(--dark);
          color: var(--gold);
          border: none;
          width: 36px; height: 36px;
          border-radius: 50%;
          font-size: 1.25rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .add-btn:hover { background: var(--gold); color: var(--dark); }
        .add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        /* Cart Sidebar */
        .cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: none; }
        .cart-overlay.open { display: block; }
        .cart-sidebar {
          position: fixed; right: 0; top: 0; bottom: 0;
          width: min(420px, 100vw);
          background: white;
          z-index: 201;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          display: flex; flex-direction: column;
          box-shadow: -4px 0 24px rgba(0,0,0,0.15);
        }
        .cart-sidebar.open { transform: translateX(0); }
        .cart-header {
          background: var(--dark);
          color: white;
          padding: 1.5rem;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 2px solid var(--gold);
        }
        .cart-header h2 { font-family: 'Playfair Display', serif; color: var(--gold); font-size: 1.4rem; }
        .close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        .cart-items { flex: 1; overflow-y: auto; padding: 1rem; }
        .cart-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f0ebe3;
        }
        .cart-item-name { font-weight: 500; font-size: 0.9rem; }
        .cart-item-price { color: var(--rust); font-weight: 600; }
        .remove-btn { background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.1rem; margin-left: 0.75rem; }
        .remove-btn:hover { color: var(--rust); }
        .cart-footer { padding: 1.5rem; border-top: 2px solid #f0ebe3; background: #faf6f0; }
        .total-row { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; }
        .checkout-btn {
          width: 100%;
          background: var(--gold);
          color: var(--dark);
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.2s;
        }
        .checkout-btn:hover { background: var(--gold-light); }
        /* Checkout form */
        .checkout-container { max-width: 600px; margin: 3rem auto; padding: 2rem; background: white; border-radius: 20px; box-shadow: 0 4px 24px rgba(26,18,8,0.1); }
        .checkout-container h2 { font-family: 'Playfair Display', serif; font-size: 2rem; color: var(--dark); margin-bottom: 1.5rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 0.4rem; }
        .form-group input, .form-group select {
          width: 100%; padding: 0.8rem 1rem;
          border: 1.5px solid #e0d8cc;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          color: var(--text);
          background: var(--cream);
          transition: border-color 0.2s;
          outline: none;
        }
        .form-group input:focus, .form-group select:focus { border-color: var(--gold); }
        .order-summary { background: #faf6f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .order-summary h3 { font-family: 'Playfair Display', serif; font-size: 1.1rem; margin-bottom: 0.75rem; color: var(--dark); }
        .summary-item { display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.9rem; }
        .summary-total { display: flex; justify-content: space-between; font-weight: 700; padding-top: 0.75rem; margin-top: 0.5rem; border-top: 1px solid #e0d8cc; font-size: 1rem; }
        .back-btn { background: transparent; border: 1.5px solid var(--gold); color: var(--gold); padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 600; margin-right: 1rem; transition: all 0.2s; }
        .back-btn:hover { background: var(--gold); color: var(--dark); }
        /* Bill */
        .bill-container { max-width: 500px; margin: 3rem auto; padding: 2rem; background: white; border-radius: 20px; box-shadow: 0 4px 24px rgba(26,18,8,0.12); text-align: center; }
        .bill-header { background: var(--dark); color: var(--gold); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
        .bill-header h2 { font-family: 'Playfair Display', serif; font-size: 1.8rem; }
        .bill-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px dashed #e0d8cc; font-size: 0.95rem; }
        .bill-total { display: flex; justify-content: space-between; padding: 1rem 0 0; font-weight: 800; font-size: 1.3rem; color: var(--rust); }
        .success-icon { font-size: 4rem; margin-bottom: 1rem; }
        .new-order-btn { background: var(--dark); color: var(--gold); border: none; padding: 1rem 2rem; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-top: 1.5rem; transition: background 0.2s; }
        .new-order-btn:hover { background: #2d1a08; }
        .empty-cart { text-align: center; padding: 3rem 1rem; color: var(--muted); }
        .empty-cart span { font-size: 3rem; display: block; margin-bottom: 1rem; }
      `}</style>

      <nav className="nav">
        <span className="nav-logo">🍽 The Chef's Track</span>
        <div className="nav-links">
          <a href="/">Menu</a>
          <Link href="/admin">Admin Panel</Link>
          {step === 'menu' && (
            <button className="cart-btn" onClick={() => setStep('cart')}>
              🛒 Cart ({cart.length})
            </button>
          )}
        </div>
      </nav>

      {step === 'menu' && (
        <>
          <div className="hero">
            <h1>Welcome to<br /><span>The Chef's Track</span></h1>
            <p>Fresh ingredients. Timeless recipes. Unforgettable experience.</p>
          </div>
          <main className="main">
            <div className="filters">
              {categories.map(c => (
                <button key={c} className={`filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>
            <div className="menu-grid">
              {filtered.map(item => {
                const emoji = item.item_type === 'Main Course' ? '🍔' : item.item_type === 'Appetizer' ? '🥗' : item.item_type === 'Dessert' ? '🍰' : '🍽';
                const inCart = cart.filter(c => c.item_no === item.item_no).length;
                return (
                  <div key={item.item_no} className="menu-card">
                    <div className="card-img" style={{ background: item.item_type === 'Dessert' ? '#fff3e0' : item.item_type === 'Appetizer' ? '#e8f5e9' : '#fce4e4' }}>
                      {emoji}
                    </div>
                    <div className="card-body">
                      <div className="card-type">{item.item_type}</div>
                      <div className="card-name">{item.item_name}</div>
                      <div className="card-footer">
                        <span className="card-price">₹{item.item_price}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`stock-badge ${item.item_stock > 10 ? 'stock-ok' : item.item_stock > 0 ? 'stock-low' : 'stock-out'}`}>
                            {item.item_stock > 0 ? `${item.item_stock} left` : 'Out'}
                          </span>
                          <button className="add-btn" onClick={() => addToCart(item)} disabled={item.item_stock <= 0}>+</button>
                        </div>
                      </div>
                      {inCart > 0 && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--sage)', fontWeight: 600 }}>✓ {inCart} in cart</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Floating cart button */}
          {cart.length > 0 && (
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
              <button className="cart-btn" style={{ padding: '1rem 1.5rem', fontSize: '1rem', boxShadow: '0 4px 20px rgba(200,150,62,0.4)' }} onClick={() => setStep('cart')}>
                🛒 {cart.length} items — ₹{cartTotal}
              </button>
            </div>
          )}
        </>
      )}

      {step === 'cart' && (
        <div className="main">
          <div className="checkout-container">
            <h2>Your Order</h2>
            {cart.length === 0 ? (
              <div className="empty-cart"><span>🛒</span>Your cart is empty</div>
            ) : (
              <>
                <div className="order-summary">
                  <h3>Items</h3>
                  {cart.map((item, idx) => (
                    <div key={idx} className="summary-item">
                      <span>{item.item_name} <button className="remove-btn" onClick={() => removeFromCart(idx)}>✕</button></span>
                      <span>₹{item.item_price}</span>
                    </div>
                  ))}
                  <div className="summary-total"><span>Subtotal</span><span>₹{cartTotal}</span></div>
                </div>
                <button className="checkout-btn" onClick={() => setStep('checkout')}>Proceed to Checkout →</button>
              </>
            )}
            <br /><br />
            <button className="back-btn" onClick={() => setStep('menu')}>← Back to Menu</button>
          </div>
        </div>
      )}

      {step === 'checkout' && (
        <div className="main">
          <div className="checkout-container">
            <h2>Complete Your Order</h2>
            <div className="order-summary">
              <h3>Order Summary ({cart.length} items)</h3>
              {cart.map((item, idx) => (
                <div key={idx} className="summary-item">
                  <span>{item.item_name}</span><span>₹{item.item_price}</span>
                </div>
              ))}
              <div className="summary-total"><span>Total</span><span>₹{cartTotal}</span></div>
            </div>
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.cust_fname} onChange={e => setForm(f => ({ ...f, cust_fname: e.target.value }))} placeholder="Your first name" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={form.cust_lname} onChange={e => setForm(f => ({ ...f, cust_lname: e.target.value }))} placeholder="Your last name" />
            </div>
            <div className="form-group">
              <label>Contact Number *</label>
              <input value={form.contact_no} onChange={e => setForm(f => ({ ...f, contact_no: e.target.value }))} placeholder="10-digit number" />
            </div>
            <div className="form-group">
              <label>Assign Waiter *</label>
              <select value={form.waiter_id} onChange={e => setForm(f => ({ ...f, waiter_id: e.target.value }))}>
                <option value="">Select a waiter</option>
                {waiters.map(w => <option key={w.waiter_id} value={w.waiter_id}>{w.waiter_fname} {w.waiter_lname}</option>)}
              </select>
            </div>
            <div>
              <button className="back-btn" onClick={() => setStep('cart')}>← Back</button>
              <button className="checkout-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={placeOrder} disabled={loading}>
                {loading ? 'Processing...' : '✓ Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'bill' && bill && (
        <div className="main">
          <div className="bill-container">
            <div className="success-icon">🎉</div>
            <div className="bill-header">
              <h2>The Chef's Track</h2>
              <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>Bill #{bill.bill_no} • Order #{bill.ord_no}</p>
            </div>
            {bill.items?.map((item, i) => (
              <div key={i} className="bill-row">
                <span>{item.item_name}</span><span>₹{item.item_price}</span>
              </div>
            ))}
            <div className="bill-row"><span>Subtotal</span><span>₹{bill.tot_price}</span></div>
            <div className="bill-row"><span>Tax (5%)</span><span>₹{(bill.tot_price * 0.05).toFixed(2)}</span></div>
            <div className="bill-row"><span>Discount</span><span>-₹{(bill.tot_price * bill.discount / 100).toFixed(2)}</span></div>
            <div className="bill-total"><span>Net Payable</span><span>₹{Number(bill.net_payable).toFixed(2)}</span></div>
            <p style={{ marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Thank you for dining with us! 🙏</p>
            <button className="new-order-btn" onClick={() => { setCart([]); setStep('menu'); setBill(null); setForm({ cust_fname: '', cust_lname: '', contact_no: '', waiter_id: '' }); }}>
              New Order
            </button>
          </div>
        </div>
      )}
    </>
  );
}
