// In-memory database using sql.js (pure JS, works on Vercel & all platforms)
// Data persists for the lifetime of the server process

let db = null;
let SQL = null;
// Initialization lock to prevent race conditions on concurrent requests
let initPromise = null;

async function initSql() {
  if (SQL) return SQL;
  const initSqlJs = (await import('sql.js')).default;
  SQL = await initSqlJs();
  return SQL;
}

export async function getDb() {
  // If already initialized, return immediately
  if (db) return db;

  // If initialization is in progress, wait for it (prevents race condition)
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSql();
    db = new SQL.Database();

    db.run(`
      CREATE TABLE IF NOT EXISTS waiter (
        waiter_id INTEGER PRIMARY KEY AUTOINCREMENT,
        waiter_fname TEXT NOT NULL,
        waiter_lname TEXT
      );
      CREATE TABLE IF NOT EXISTS customer (
        cust_id INTEGER PRIMARY KEY AUTOINCREMENT,
        cust_fname TEXT NOT NULL,
        cust_lname TEXT,
        contact_no TEXT
      );
      CREATE TABLE IF NOT EXISTS chef (
        chef_id INTEGER PRIMARY KEY AUTOINCREMENT,
        chef_fname TEXT NOT NULL,
        chef_lname TEXT,
        chef_type TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS food (
        item_no INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_price REAL NOT NULL,
        item_stock INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS prepares (
        item_type TEXT PRIMARY KEY,
        chef_id INTEGER,
        FOREIGN KEY (chef_id) REFERENCES chef(chef_id)
      );
      CREATE TABLE IF NOT EXISTS ord (
        ord_no INTEGER PRIMARY KEY AUTOINCREMENT,
        ord_date TEXT NOT NULL,
        cust_id INTEGER,
        waiter_id INTEGER,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (cust_id) REFERENCES customer(cust_id),
        FOREIGN KEY (waiter_id) REFERENCES waiter(waiter_id)
      );
      CREATE TABLE IF NOT EXISTS contains (
        ord_no INTEGER NOT NULL,
        item_no INTEGER NOT NULL,
        FOREIGN KEY (ord_no) REFERENCES ord(ord_no),
        FOREIGN KEY (item_no) REFERENCES food(item_no)
      );
      CREATE TABLE IF NOT EXISTS bill (
        bill_no INTEGER PRIMARY KEY AUTOINCREMENT,
        tot_price REAL NOT NULL,
        tax REAL DEFAULT 5,
        discount REAL DEFAULT 0,
        net_payable REAL,
        ord_no INTEGER UNIQUE,
        FOREIGN KEY (ord_no) REFERENCES ord(ord_no)
      );
      CREATE TABLE IF NOT EXISTS tips (
        tip_id INTEGER PRIMARY KEY AUTOINCREMENT,
        waiter_id INTEGER,
        cust_id INTEGER,
        tips REAL DEFAULT 0,
        FOREIGN KEY (waiter_id) REFERENCES waiter(waiter_id),
        FOREIGN KEY (cust_id) REFERENCES customer(cust_id)
      );
    `);

    // Seed data only if tables are empty (guard prevents duplicate seeds on hot-reload)
    const waiterCount = db.exec('SELECT COUNT(*) as n FROM waiter')[0]?.values[0]?.[0] || 0;
    if (waiterCount === 0) {
      db.run(`
        INSERT INTO waiter (waiter_fname, waiter_lname) VALUES
          ('Arjun','Sharma'),('Priya','Mehta'),('Rahul','Singh'),('Kavita','Nair'),('Suresh','Patel');
        INSERT INTO chef (chef_fname, chef_lname, chef_type) VALUES
          ('Vikram','Malhotra','Head_Chef'),('Anita','Desai','Sous_Chef'),
          ('Ravi','Kumar','Sous_Chef'),('Sunita','Rao','Pastry_Chef');
        INSERT INTO prepares (item_type, chef_id) VALUES
          ('Main Course',1),('Appetizer',2),('Dessert',4),('Bread',3),('Beverage',2);
        INSERT INTO food (item_name, item_type, item_price, item_stock) VALUES
          ('Samosa','Appetizer',60,120),
          ('Paneer Tikka','Appetizer',280,80),
          ('Chicken Tikka','Appetizer',320,80),
          ('Hara Bhara Kebab','Appetizer',240,60),
          ('Dahi Puri','Appetizer',140,90),
          ('Butter Chicken','Main Course',380,70),
          ('Paneer Butter Masala','Main Course',320,60),
          ('Dal Makhani','Main Course',280,80),
          ('Palak Paneer','Main Course',300,50),
          ('Malai Kofta','Main Course',340,50),
          ('Mutton Rogan Josh','Main Course',480,40),
          ('Chicken Biryani','Main Course',420,60),
          ('Veg Biryani','Main Course',340,70),
          ('Fish Curry','Main Course',440,35),
          ('Lamb Korma','Main Course',520,30),
          ('Garlic Naan','Bread',80,200),
          ('Tandoori Roti','Bread',50,200),
          ('Stuffed Paratha','Bread',120,100),
          ('Peshwari Naan','Bread',120,150),
          ('Gulab Jamun','Dessert',160,100),
          ('Rasgulla','Dessert',140,80),
          ('Kulfi Falooda','Dessert',220,60),
          ('Kheer','Dessert',180,70),
          ('Gajar Halwa','Dessert',200,60),
          ('Mango Lassi','Beverage',160,120),
          ('Masala Chai','Beverage',100,200),
          ('Sweet Lassi','Beverage',140,150),
          ('Fresh Lime Soda','Beverage',120,180);
        INSERT INTO customer (cust_fname, cust_lname, contact_no) VALUES
          ('Rohan','Verma','9876543210'),('Meera','Iyer','9123456789'),('Amit','Shah','9988776655');
      `);
    }

    return db;
  })();

  return initPromise;
}

// Helper to run SELECT queries and return all rows as objects
export function query(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('Query error:', sql, e.message);
    // Re-throw so API handlers can return a proper 500 error
    throw e;
  }
}

// Helper to run INSERT/UPDATE/DELETE and return lastInsertRowid
export function run(db, sql, params = []) {
  try {
    db.run(sql, params);
    const result = db.exec('SELECT last_insert_rowid() as id');
    return result[0]?.values[0]?.[0] || null;
  } catch (e) {
    console.error('Run error:', sql, e.message);
    throw e;
  }
}
