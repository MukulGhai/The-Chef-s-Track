import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Menu item descriptions & image mapping
const ITEM_META = {
  // Appetizers
  'Samosa':           { desc: 'Hand-folded pastry shells filled with spiced potato and green peas, served with house-made mint chutney and aged tamarind reduction.', img: '/food/samosa.png' },
  'Paneer Tikka':     { desc: 'Farm-fresh paneer marinated in hung curd and aromatic spices, char-grilled in our tandoor with seasonal bell peppers and onion petals.', img: '/food/paneer-tikka.png' },
  'Chicken Tikka':    { desc: 'Tender free-range chicken marinated for 12 hours in a saffron and yogurt blend, kissed by the tandoor for a smoky, golden finish.', img: '/food/chicken-biryani.png' },
  'Hara Bhara Kebab': { desc: 'Delicate green patties of spinach, green peas and fresh herbs, pan-seared until golden, served with a cooling cucumber raita.', img: '/food/paneer-tikka.png' },
  'Dahi Puri':        { desc: 'Crisp semolina shells filled with spiced potato, crowned with chilled sweetened yogurt, tamarind, and a dusting of chaat masala.', img: '/food/samosa.png' },
  // Main Course
  'Butter Chicken':        { desc: 'Succulent tandoor-smoked chicken in a velvety tomato and cream sauce, slow-reduced with Kashmiri spices and finished with cultured butter.', img: '/food/butter-chicken.png' },
  'Paneer Butter Masala':  { desc: 'Soft cottage cheese cubes simmered in a rich, aromatic tomato-cashew gravy with cream and a touch of dried fenugreek.', img: '/food/paneer-butter-masala.png' },
  'Dal Makhani':           { desc: 'Whole black lentils slow-cooked over 24 hours on a wood fire with aged butter, cream and a whisper of asafoetida.', img: '/food/dal-makhani.png' },
  'Palak Paneer':          { desc: 'Baby spinach blanched and puréed with fresh spices, embracing cubes of house-made paneer — a classic of the Punjab kitchen.', img: '/food/paneer-butter-masala.png' },
  'Malai Kofta':           { desc: 'Delicate dumplings of paneer and potato in a saffron-laced cream and tomato gravy, perfumed with cardamom and mace.', img: '/food/paneer-butter-masala.png' },
  'Mutton Rogan Josh':     { desc: 'Slow-braised Kashmiri lamb in an aromatic blend of whole spices and dried cockscomb flower, a heritage recipe prepared with great care.', img: '/food/butter-chicken.png' },
  'Chicken Biryani':       { desc: 'Long-grain Basmati rice layered with saffron-marinated chicken, slow-cooked dum-style in a sealed vessel with caramelised onions and whole spices.', img: '/food/chicken-biryani.png' },
  'Veg Biryani':           { desc: 'Fragrant Basmati steamed with seasonal vegetables, rose water and pure saffron strands, finished with fried shallots and fresh mint.', img: '/food/chicken-biryani.png' },
  'Fish Curry':            { desc: 'Coastal-style curry of fresh catch simmered in a coconut milk and tamarind base with mustard seeds, curry leaf and green chili.', img: '/food/butter-chicken.png' },
  'Lamb Korma':            { desc: 'Tender slow-braised lamb shoulder in a Mughal-inspired korma of cashew, cream and rosewater — a dish of remarkable refinement.', img: '/food/butter-chicken.png' },
  // Bread
  'Garlic Naan':      { desc: 'Leavened bread baked against the walls of our clay tandoor, brushed with cultured garlic butter and hand-torn fresh coriander.', img: '/food/garlic-naan.png' },
  'Tandoori Roti':    { desc: 'Whole wheat flatbread, hand-rolled and baked in the tandoor — the perfect companion for any curry on our menu.', img: '/food/garlic-naan.png' },
  'Stuffed Paratha':  { desc: 'Layered whole wheat bread filled with seasoned potato and paneer, cooked on a griddle with pure desi ghee until crisp and golden.', img: '/food/garlic-naan.png' },
  'Peshwari Naan':    { desc: 'A soft, indulgent bread from the Afghan frontier, filled with a blend of almonds, coconut, sultanas and a hint of cardamom.', img: '/food/garlic-naan.png' },
  // Desserts
  'Gulab Jamun':    { desc: 'Milk-solid dumplings, gently fried to a deep amber, resting in a warm saffron and rose-water syrup, garnished with pistachio slivers.', img: '/food/gulab-jamun.png' },
  'Rasgulla':       { desc: 'Cloud-soft chenna cheese spheres, poached in a delicate light sugar syrup infused with rose water — a Bengal confectionery treasure.', img: '/food/gulab-jamun.png' },
  'Kulfi Falooda':  { desc: 'House-churned saffron and pistachio kulfi served over chilled vermicelli, rose syrup and basil seeds — a symphony of texture and flavour.', img: '/food/kulfi.png' },
  'Kheer':          { desc: 'Slow-cooked rice pudding reduced in full-cream milk with green cardamom, saffron strands and topped with gold-dusted blanched almonds.', img: '/food/gulab-jamun.png' },
  'Gajar Halwa':    { desc: 'Slow-simmered winter carrots in full-cream milk and pure desi ghee, sweetened with jaggery and crowned with cashews and raisins.', img: '/food/gulab-jamun.png' },
  // Beverages
  'Mango Lassi':       { desc: 'Hand-blended Alphonso mango with thick strained yogurt, a pinch of cardamom and pure saffron — the jewel of Indian refreshment.', img: '/food/mango-lassi.png' },
  'Masala Chai':       { desc: 'A rich blend of Assam tea leaves simmered with fresh ginger, green cardamom, clove and cinnamon, served with full-cream milk.', img: '/food/mango-lassi.png' },
  'Sweet Lassi':       { desc: 'Thick churned yogurt whisked with rose water and a touch of jaggery, garnished with dried rose petals and a pinch of cardamom.', img: '/food/mango-lassi.png' },
  'Fresh Lime Soda':   { desc: 'Hand-pressed Himalayan lime with chilled sparkling water, served sweet, salted or with a house-made ginger and chili infusion.', img: '/food/mango-lassi.png' },
};


const DEFAULT_META = { desc: 'A masterfully prepared dish using only the finest seasonal ingredients, curated by our executive chef.', img: '/food/hero.png' };

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
      const r2 = await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ord_no: d1.ord_no, discount: 0 }) });
      const d2 = await r2.json();
      if (!r2.ok) { showToast(d2.error || 'Billing failed', 'error'); return; }
      setBill({ ...d2, ord_no: d1.ord_no });
      setStep('bill');
    } catch { showToast('Network error. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  const reset = () => {
    setCart([]); setStep('menu'); setBill(null);
    setForm({ cust_fname: '', cust_lname: '', contact_no: '', waiter_id: '' });
    fetch('/api/menu').then(r => r.json()).then(setMenu);
  };

  const getMeta = name => ITEM_META[name] || DEFAULT_META;

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
                  const meta = getMeta(item.item_name);
                  const avail = item.item_stock - cartCountFor(item.item_no);
                  return (
                    <div key={item.item_no} className="menu-card">
                      <div className="card-image-wrap">
                        <img src={meta.img} alt={item.item_name} />
                        <span className="card-category-tag">{item.item_type}</span>
                        <span className={`stock-tag ${avail > 10 ? 'stock-ok' : avail > 0 ? 'stock-low' : 'stock-out'}`}>
                          {avail > 0 ? `${avail} Available` : 'Sold Out'}
                        </span>
                      </div>
                      <div className="card-body">
                        <h3 className="card-name">{item.item_name}</h3>
                        <p className="card-desc">{meta.desc}</p>
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
            <br />
            <button className="btn-primary" onClick={reset}>Begin a New Order</button>
          </div>
        </div>
      )}
    </>
  );
}
