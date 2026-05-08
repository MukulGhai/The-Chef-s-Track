import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Fallback images for items that don't have a custom uploaded image
const FALLBACK_IMAGES = {
  'Appetizer': '/food/samosa.png',
  'Main Course': '/food/butter-chicken.png',
  'Bread': '/food/garlic-naan.png',
  'Dessert': '/food/gulab-jamun.png',
  'Beverage': '/food/mango-lassi.png',
};

const DEFAULT_IMAGE = '/food/hero.png';
const DEFAULT_DESC = 'A masterfully prepared dish using only the finest seasonal ingredients, curated by our executive chef.';

const getItemImage = (item) => item.item_image || FALLBACK_IMAGES[item.item_type] || DEFAULT_IMAGE;
const getItemDesc = (item) => item.item_description || DEFAULT_DESC;


export default function Home() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [step, setStep] = useState('menu');
  const [form, setForm] = useState({ cust_fname: '', cust_lname: '', contact_no: '', waiter_id: '' });
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [tipAmount, setTipAmount] = useState('');
  const [tipSent, setTipSent] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/menu').then(r => r.json()),
      fetch('/api/staff?type=waiters').then(r => r.json()),
    ]).then(([m, w]) => { setMenu(m); setWaiters(w); setMenuLoading(false); })
      .catch(() => setMenuLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const categories = ['All', ...new Set(menu.map(i => i.item_type))];
  const filtered = filter === 'All' ? menu : menu.filter(i => i.item_type === filter);
  const cartCountFor = id => cart.filter(c => c.item_no === id).length;

  const addToCart = (item) => {
    if (cartCountFor(item.item_no) >= item.item_stock) {
      showToast('No more stock available', 'error'); return;
    }
    setCart(c => [...c, item]);
    showToast(`${item.item_name} added to your order`);
  };

  const removeFromCart = idx => setCart(c => c.filter((_, i) => i !== idx));
  const cartTotal = cart.reduce((s, i) => s + i.item_price, 0);

  const validate = () => {
    const e = {};
    if (!form.cust_fname.trim()) e.cust_fname = 'Required';
    if (!form.contact_no.trim()) e.contact_no = 'Required';
    else if (!/^\d{10}$/.test(form.contact_no.trim())) e.contact_no = 'Must be 10 digits';
    if (!form.waiter_id) e.waiter_id = 'Please select';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r1 = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items: cart.map(i => i.item_no) }) });
      const d1 = await r1.json();
      if (!r1.ok) { showToast(d1.error || 'Order failed', 'error'); return; }
      setOrderId(d1.ord_no);
      const r2 = await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ord_no: d1.ord_no, discount: 0 }) });
      const d2 = await r2.json();
      if (!r2.ok) { showToast(d2.error || 'Billing failed', 'error'); return; }
      setBill({ ...d2, ord_no: d1.ord_no, cust_id: d1.cust_id });
      setStep('bill');
    } catch { showToast('Network error. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  const sendTip = async () => {
    const amt = parseFloat(tipAmount);
    if (isNaN(amt) || amt <= 0) { showToast('Enter a valid tip amount', 'error'); return; }
    try {
      const res = await fetch('/api/staff?type=tips', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waiter_id: form.waiter_id, cust_id: bill.cust_id, tips: amt })
      });
      const data = await res.json();
      if (!res.ok || data.error) { showToast(data.error || 'Failed to send tip', 'error'); return; }
      setTipSent(true);
      showToast(`₹${amt} tip sent! Thank you for your generosity.`);
    } catch { showToast('Failed to send tip', 'error'); }
  };

  const reset = () => {
    setCart([]); setStep('menu'); setBill(null); setTipAmount(''); setTipSent(false); setOrderId(null);
    setForm({ cust_fname: '', cust_lname: '', contact_no: '', waiter_id: '' });
    fetch('/api/menu').then(r => r.json()).then(setMenu);
  };

  return (
    <>
      <Head>
        <title>The Chef's Track — Fine Dining</title>
        <meta name="description" content="Experience culinary excellence at The Chef's Track. Reserve your table or order online." />
      </Head>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* NAV */}
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-brand-name">The Chef's Track</span>
          <span className="nav-brand-tagline">Fine Dining &amp; Culinary Arts</span>
        </div>
        <div className="nav-links">
          <a href="/">Menu</a>
          <Link href="/admin">Management</Link>
          {step === 'menu' && cart.length > 0 && (
            <button className="nav-cart-btn" onClick={() => setStep('cart')}>
              View Order &nbsp;({cart.length})
            </button>
          )}
        </div>
      </nav>

      {/* ── MENU ── */}
      {step === 'menu' && (
        <>
          {/* Hero */}
          <section className="hero">
            <div className="hero-img" style={{ backgroundImage: 'url(/food/hero.png)' }} />
            <div className="hero-content">
              <span className="hero-label">Est. 2024 — Culinary Excellence</span>
              <h1 className="hero-title">
                An <em>extraordinary</em><br />dining experience
              </h1>
              <p className="hero-desc">Seasonal ingredients &middot; Masterful technique &middot; Unforgettable flavour</p>
              <button className="hero-cta" onClick={() => document.getElementById('menu-anchor').scrollIntoView({ behavior: 'smooth' })}>
                Explore the Menu
              </button>
            </div>
            <div className="hero-scroll">
              <span>Scroll</span>
              <div className="scroll-line" />
            </div>
          </section>

          {/* Menu Grid */}
          <section className="menu-section" id="menu-anchor">
            <div className="section-header">
              <span className="section-label">Curated Selection</span>
              <h2 className="section-title">Our Menu</h2>
              <div className="section-divider">
                <div className="divider-line" />
                <div className="divider-diamond" />
                <div className="divider-line" />
              </div>
            </div>

            <div className="filters">
              {categories.map(c => (
                <button key={c} className={`filter-btn${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>

            {menuLoading ? (
              <div className="skeleton-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card shimmer" />)}
              </div>
            ) : (
              <div className="menu-grid">
                {filtered.map(item => {
                  const avail = item.item_stock - cartCountFor(item.item_no);
                  return (
                    <div key={item.item_no} className="menu-card">
                      <div className="card-image-wrap">
                        <img src={getItemImage(item)} alt={item.item_name} />
                        <span className="card-category-tag">{item.item_type}</span>
                        <span className={`stock-tag ${avail > 10 ? 'stock-ok' : avail > 0 ? 'stock-low' : 'stock-out'}`}>
                          {avail > 0 ? `${avail} Available` : 'Sold Out'}
                        </span>
                      </div>
                      <div className="card-body">
                        <h3 className="card-name">{item.item_name}</h3>
                        <p className="card-desc">{getItemDesc(item)}</p>
                        <div className="card-footer">
                          <div className="card-price"><span>INR</span>&#8377;{item.item_price}</div>
                          <button className="add-btn" onClick={() => addToCart(item)} disabled={avail <= 0}>
                            {avail > 0 ? 'Add to Order' : 'Unavailable'}
                          </button>
                        </div>
                        {cartCountFor(item.item_no) > 0 && (
                          <div className="in-cart-label">{cartCountFor(item.item_no)} in your order</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {cart.length > 0 && (
            <div className="float-cart">
              <button className="float-cart-btn" onClick={() => setStep('cart')}>
                <span>View Order</span>
                <div className="float-cart-count">{cart.length}</div>
                <span>&#8377;{cartTotal}</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ── CART ── */}
      {step === 'cart' && (
        <div className="page-container">
          <div className="cart-container">
            <h1 className="page-title">Your Order</h1>
            <p className="page-subtitle">{cart.length} {cart.length === 1 ? 'item' : 'items'} selected</p>
            {cart.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">Your order is empty</div>
                <div className="empty-state-sub">Return to the menu to make a selection</div>
              </div>
            ) : (
              <>
                <div className="order-lines">
                  {cart.map((item, idx) => (
                    <div key={idx} className="order-line">
                      <span className="order-line-name">{item.item_name}</span>
                      <div className="order-line-right">
                        <span className="order-line-price">&#8377;{item.item_price}</span>
                        <button className="remove-btn" onClick={() => removeFromCart(idx)} title="Remove">&#10005;</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <span className="order-total-label">Subtotal</span>
                  <span className="order-total-value">&#8377;{cartTotal}</span>
                </div>
                <button className="btn-primary" onClick={() => setStep('checkout')}>Proceed to Checkout</button>
              </>
            )}
            <button className="btn-secondary" onClick={() => setStep('menu')}>Return to Menu</button>
          </div>
        </div>
      )}

      {/* ── CHECKOUT ── */}
      {step === 'checkout' && (
        <div className="page-container">
          <div className="cart-container">
            <h1 className="page-title">Guest Details</h1>
            <p className="page-subtitle">Complete your reservation</p>

            <div className="form-section">
              <div className="form-section-title">Personal Information</div>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className={`form-input${errors.cust_fname ? ' err' : ''}`} value={form.cust_fname} onChange={e => setForm(f => ({ ...f, cust_fname: e.target.value }))} placeholder="Your first name" />
                {errors.cust_fname && <div className="field-err">{errors.cust_fname}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={form.cust_lname} onChange={e => setForm(f => ({ ...f, cust_lname: e.target.value }))} placeholder="Your last name" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number * (10 digits)</label>
                <input className={`form-input${errors.contact_no ? ' err' : ''}`} value={form.contact_no} onChange={e => setForm(f => ({ ...f, contact_no: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9XXXXXXXXX" inputMode="numeric" />
                {errors.contact_no && <div className="field-err">{errors.contact_no}</div>}
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Service Preference</div>
              <div className="form-group">
                <label className="form-label">Attending Waiter *</label>
                <select className={`form-select${errors.waiter_id ? ' err' : ''}`} value={form.waiter_id} onChange={e => setForm(f => ({ ...f, waiter_id: e.target.value }))}>
                  <option value="">Select your waiter</option>
                  {waiters.map(w => <option key={w.waiter_id} value={w.waiter_id}>{w.waiter_fname} {w.waiter_lname}</option>)}
                </select>
                {errors.waiter_id && <div className="field-err">{errors.waiter_id}</div>}
              </div>
            </div>

            <div className="order-total">
              <span className="order-total-label">Total ({cart.length} items)</span>
              <span className="order-total-value">&#8377;{cartTotal}</span>
            </div>
            <button className="btn-primary" onClick={placeOrder} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Order'}
            </button>
            <button className="btn-secondary" onClick={() => setStep('cart')}>Back to Order</button>
          </div>
        </div>
      )}

      {/* ── BILL ── */}
      {step === 'bill' && bill && (
        <div className="page-container">
          <div className="bill-container">
            <div className="bill-receipt">
              <div className="bill-logo">The Chef's Track</div>
              <div className="bill-meta">Order #{bill.ord_no} &nbsp;&middot;&nbsp; Bill #{bill.bill_no}</div>
              <hr className="bill-divider" />
              {bill.items?.map((item, i) => (
                <div key={i} className="bill-row">
                  <span>{item.item_name}</span>
                  <span>&#8377;{item.item_price}</span>
                </div>
              ))}
              <hr className="bill-divider" />
              <div className="bill-row meta"><span>Subtotal</span><span>&#8377;{bill.tot_price}</span></div>
              {bill.discount > 0 && (
                <div className="bill-row meta"><span>Discount ({bill.discount}%)</span><span>&#8377;{(bill.tot_price * bill.discount / 100).toFixed(2)}</span></div>
              )}
              <div className="bill-row meta"><span>GST (5%)</span><span>&#8377;{((bill.tot_price - bill.tot_price * (bill.discount || 0) / 100) * 0.05).toFixed(2)}</span></div>
              <div className="bill-total-row">
                <span className="bill-total-label">Net Payable</span>
                <span className="bill-total-value">&#8377;{Number(bill.net_payable).toFixed(2)}</span>
              </div>
              <div className="bill-thank">Thank you for dining with us</div>
            </div>
            <div className="tip-section">
              <div className="tip-title">Show Your Appreciation</div>
              <p className="tip-desc">Leave a tip for your waiter to brighten their day</p>
              {!tipSent ? (
                <div className="tip-form">
                  <div className="tip-presets">
                    {[50, 100, 200, 500].map(amt => (
                      <button key={amt} className={`tip-preset-btn${tipAmount === String(amt) ? ' active' : ''}`}
                        onClick={() => setTipAmount(String(amt))}>₹{amt}</button>
                    ))}
                  </div>
                  <div className="tip-custom">
                    <input className="tip-custom-input" type="number" min="1" placeholder="Custom amount"
                      value={tipAmount} onChange={e => setTipAmount(e.target.value)} />
                    <button className="tip-send-btn" onClick={sendTip} disabled={!tipAmount}>Send Tip</button>
                  </div>
                </div>
              ) : (
                <div className="tip-thanks">✓ Tip sent! Your waiter appreciates it.</div>
              )}
            </div>
            <br />
            <button className="btn-primary" onClick={reset}>Begin a New Order</button>
          </div>
        </div>
      )}
    </>
  );
}
