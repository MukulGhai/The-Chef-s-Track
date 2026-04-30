// In-memory database using sql.js (pure JS, works on Vercel & all platforms)
// Data persists for the lifetime of the server process

let db = null;
let SQL = null;

async function initSql() {
  if (SQL) return SQL;
  const initSqlJs = (await import('sql.js')).default;
  SQL = await initSqlJs();
  return SQL;
}

export async function getDb() {
  if (db) return db;
  
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
      item_price INTEGER NOT NULL,
      item_stock INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS prepares (
      item_type TEXT PRIMARY KEY,
      chef_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS ord (
      ord_no INTEGER PRIMARY KEY AUTOINCREMENT,
      ord_date TEXT NOT NULL,
      cust_id INTEGER,
      waiter_id INTEGER,
      status TEXT DEFAULT 'active'
    );
    CREATE TABLE IF NOT EXISTS contains (
      ord_no INTEGER,
      item_no INTEGER
    );
    CREATE TABLE IF NOT EXISTS bill (
      bill_no INTEGER PRIMARY KEY AUTOINCREMENT,
      tot_price INTEGER NOT NULL,
      tax REAL DEFAULT 5,
      discount INTEGER DEFAULT 0,
      net_payable REAL,
      ord_no INTEGER
    );
    CREATE TABLE IF NOT EXISTS tips (
      waiter_id INTEGER,
      cust_id INTEGER,
      tips INTEGER
    );
  `);

  // Seed data
  db.run(`
    INSERT INTO waiter (waiter_fname, waiter_lname) VALUES ('John','Doe'),('Jane','Smith'),('Bob','Johnson');
    INSERT INTO chef (chef_fname, chef_lname, chef_type) VALUES ('John','Wick','Head_Chef'),('Sarah','Curry','Sous_Chef'),('Robert','Gun','Sous_Chef');
    INSERT INTO prepares (item_type, chef_id) VALUES ('Main Course',1),('Appetizer',2),('Dessert',3);
    INSERT INTO food (item_name, item_type, item_price, item_stock) VALUES 
      ('Cheeseburger','Main Course',100,50),
      ('French Fries','Appetizer',50,100),
      ('Chocolate Cake','Dessert',80,30),
      ('Grilled Chicken','Main Course',150,40),
      ('Spring Rolls','Appetizer',60,80),
      ('Ice Cream Sundae','Dessert',70,50);
    INSERT INTO customer (cust_fname, cust_lname, contact_no) VALUES ('Alice','Brown','900000001'),('Bob','Green','900000002'),('Charlie','Blue','900000003');
  `);

  return db;
}

// Helper to run queries and return all rows as objects
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
    return [];
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
