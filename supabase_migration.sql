-- ============================================================
-- The Chef's Track — Supabase PostgreSQL Migration
-- Run this ENTIRE script in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- 1. TABLES
CREATE TABLE IF NOT EXISTS waiter (
  waiter_id SERIAL PRIMARY KEY,
  waiter_fname TEXT NOT NULL,
  waiter_lname TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS customer (
  cust_id SERIAL PRIMARY KEY,
  cust_fname TEXT NOT NULL,
  cust_lname TEXT DEFAULT '',
  contact_no TEXT
);

CREATE TABLE IF NOT EXISTS chef (
  chef_id SERIAL PRIMARY KEY,
  chef_fname TEXT NOT NULL,
  chef_lname TEXT DEFAULT '',
  chef_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS food (
  item_no SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_price NUMERIC(10,2) NOT NULL,
  item_stock INTEGER DEFAULT 0,
  item_image TEXT DEFAULT '',
  item_description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS prepares (
  item_type TEXT PRIMARY KEY,
  chef_id INTEGER REFERENCES chef(chef_id)
);

CREATE TABLE IF NOT EXISTS ord (
  ord_no SERIAL PRIMARY KEY,
  ord_date TEXT NOT NULL,
  cust_id INTEGER REFERENCES customer(cust_id),
  waiter_id INTEGER REFERENCES waiter(waiter_id),
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS contains (
  id SERIAL PRIMARY KEY,
  ord_no INTEGER NOT NULL REFERENCES ord(ord_no),
  item_no INTEGER NOT NULL REFERENCES food(item_no)
);

CREATE TABLE IF NOT EXISTS bill (
  bill_no SERIAL PRIMARY KEY,
  tot_price NUMERIC(10,2) NOT NULL,
  tax NUMERIC(5,2) DEFAULT 5,
  discount NUMERIC(5,2) DEFAULT 0,
  net_payable NUMERIC(10,2),
  ord_no INTEGER UNIQUE REFERENCES ord(ord_no)
);

CREATE TABLE IF NOT EXISTS tips (
  tip_id SERIAL PRIMARY KEY,
  waiter_id INTEGER REFERENCES waiter(waiter_id),
  cust_id INTEGER REFERENCES customer(cust_id),
  tips NUMERIC(10,2) DEFAULT 0
);

-- 2. SEED DATA
INSERT INTO waiter (waiter_fname, waiter_lname) VALUES
  ('Arjun','Sharma'),('Priya','Mehta'),('Rahul','Singh'),('Kavita','Nair'),('Suresh','Patel');

INSERT INTO chef (chef_fname, chef_lname, chef_type) VALUES
  ('Vikram','Malhotra','Head_Chef'),('Anita','Desai','Sous_Chef'),
  ('Ravi','Kumar','Sous_Chef'),('Sunita','Rao','Pastry_Chef');

INSERT INTO prepares (item_type, chef_id) VALUES
  ('Main Course',1),('Appetizer',2),('Dessert',4),('Bread',3),('Beverage',2);

INSERT INTO food (item_name, item_type, item_price, item_stock, item_description) VALUES
  ('Samosa','Appetizer',60,120,'Hand-folded pastry shells filled with spiced potato and green peas, served with house-made mint chutney and aged tamarind reduction.'),
  ('Paneer Tikka','Appetizer',280,80,'Farm-fresh paneer marinated in hung curd and aromatic spices, char-grilled in our tandoor with seasonal bell peppers and onion petals.'),
  ('Chicken Tikka','Appetizer',320,80,'Tender free-range chicken marinated for 12 hours in a saffron and yogurt blend, kissed by the tandoor for a smoky, golden finish.'),
  ('Hara Bhara Kebab','Appetizer',240,60,'Delicate green patties of spinach, green peas and fresh herbs, pan-seared until golden, served with a cooling cucumber raita.'),
  ('Dahi Puri','Appetizer',140,90,'Crisp semolina shells filled with spiced potato, crowned with chilled sweetened yogurt, tamarind, and a dusting of chaat masala.'),
  ('Butter Chicken','Main Course',380,70,'Succulent tandoor-smoked chicken in a velvety tomato and cream sauce, slow-reduced with Kashmiri spices and finished with cultured butter.'),
  ('Paneer Butter Masala','Main Course',320,60,'Soft cottage cheese cubes simmered in a rich, aromatic tomato-cashew gravy with cream and a touch of dried fenugreek.'),
  ('Dal Makhani','Main Course',280,80,'Whole black lentils slow-cooked over 24 hours on a wood fire with aged butter, cream and a whisper of asafoetida.'),
  ('Palak Paneer','Main Course',300,50,'Baby spinach blanched and puréed with fresh spices, embracing cubes of house-made paneer — a classic of the Punjab kitchen.'),
  ('Malai Kofta','Main Course',340,50,'Delicate dumplings of paneer and potato in a saffron-laced cream and tomato gravy, perfumed with cardamom and mace.'),
  ('Mutton Rogan Josh','Main Course',480,40,'Slow-braised Kashmiri lamb in an aromatic blend of whole spices and dried cockscomb flower, a heritage recipe prepared with great care.'),
  ('Chicken Biryani','Main Course',420,60,'Long-grain Basmati rice layered with saffron-marinated chicken, slow-cooked dum-style in a sealed vessel with caramelised onions and whole spices.'),
  ('Veg Biryani','Main Course',340,70,'Fragrant Basmati steamed with seasonal vegetables, rose water and pure saffron strands, finished with fried shallots and fresh mint.'),
  ('Fish Curry','Main Course',440,35,'Coastal-style curry of fresh catch simmered in a coconut milk and tamarind base with mustard seeds, curry leaf and green chili.'),
  ('Lamb Korma','Main Course',520,30,'Tender slow-braised lamb shoulder in a Mughal-inspired korma of cashew, cream and rosewater — a dish of remarkable refinement.'),
  ('Garlic Naan','Bread',80,200,'Leavened bread baked against the walls of our clay tandoor, brushed with cultured garlic butter and hand-torn fresh coriander.'),
  ('Tandoori Roti','Bread',50,200,'Whole wheat flatbread, hand-rolled and baked in the tandoor — the perfect companion for any curry on our menu.'),
  ('Stuffed Paratha','Bread',120,100,'Layered whole wheat bread filled with seasoned potato and paneer, cooked on a griddle with pure desi ghee until crisp and golden.'),
  ('Peshwari Naan','Bread',120,150,'A soft, indulgent bread from the Afghan frontier, filled with a blend of almonds, coconut, sultanas and a hint of cardamom.'),
  ('Gulab Jamun','Dessert',160,100,'Milk-solid dumplings, gently fried to a deep amber, resting in a warm saffron and rose-water syrup, garnished with pistachio slivers.'),
  ('Rasgulla','Dessert',140,80,'Cloud-soft chenna cheese spheres, poached in a delicate light sugar syrup infused with rose water — a Bengal confectionery treasure.'),
  ('Kulfi Falooda','Dessert',220,60,'House-churned saffron and pistachio kulfi served over chilled vermicelli, rose syrup and basil seeds — a symphony of texture and flavour.'),
  ('Kheer','Dessert',180,70,'Slow-cooked rice pudding reduced in full-cream milk with green cardamom, saffron strands and topped with gold-dusted blanched almonds.'),
  ('Gajar Halwa','Dessert',200,60,'Slow-simmered winter carrots in full-cream milk and pure desi ghee, sweetened with jaggery and crowned with cashews and raisins.'),
  ('Mango Lassi','Beverage',160,120,'Hand-blended Alphonso mango with thick strained yogurt, a pinch of cardamom and pure saffron — the jewel of Indian refreshment.'),
  ('Masala Chai','Beverage',100,200,'A rich blend of Assam tea leaves simmered with fresh ginger, green cardamom, clove and cinnamon, served with full-cream milk.'),
  ('Sweet Lassi','Beverage',140,150,'Thick churned yogurt whisked with rose water and a touch of jaggery, garnished with dried rose petals and a pinch of cardamom.'),
  ('Fresh Lime Soda','Beverage',120,180,'Hand-pressed Himalayan lime with chilled sparkling water, served sweet, salted or with a house-made ginger and chili infusion.');

INSERT INTO customer (cust_fname, cust_lname, contact_no) VALUES
  ('Rohan','Verma','9876543210'),('Meera','Iyer','9123456789'),('Amit','Shah','9988776655');

-- 3. STORAGE BUCKET (run this separately in the SQL editor if needed, or create via Supabase Dashboard → Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', true);
