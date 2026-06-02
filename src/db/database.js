import * as SQLite from 'expo-sqlite';

const DB_NAME = 'app_contable_mobile.db';
let connection = null;

export async function getDatabase() {
  if (!connection) {
    connection = await SQLite.openDatabaseAsync(DB_NAME);
    await connection.execAsync('PRAGMA foreign_keys = ON;');
    await connection.execAsync('PRAGMA journal_mode = WAL;');
  }
  return connection;
}

async function ensureColumn(db, tableName, columnName, definition) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_name TEXT,
      quote_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      converted_sale_id INTEGER,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_date TEXT NOT NULL,
      quote_id INTEGER NOT NULL,
      customer_id INTEGER,
      customer_name TEXT,
      description TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paid INTEGER NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE RESTRICT,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      entry_type TEXT NOT NULL CHECK(entry_type IN ('charge', 'payment')),
      amount REAL NOT NULL,
      entry_date TEXT NOT NULL,
      note TEXT DEFAULT '',
      ref_type TEXT DEFAULT '',
      ref_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      supplier TEXT DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('in', 'out', 'adjustment')),
      qty REAL NOT NULL,
      unit_cost REAL,
      movement_date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK(kind IN ('income', 'expense')),
      amount REAL NOT NULL,
      tx_date TEXT NOT NULL,
      category TEXT NOT NULL,
      note TEXT DEFAULT '',
      ref_type TEXT DEFAULT '',
      ref_id INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(tx_date);
    CREATE INDEX IF NOT EXISTS idx_ledger_customer ON ledger(customer_id);
  `);

  await ensureColumn(db, 'sales', 'paid_amount', 'REAL NOT NULL DEFAULT 0');

  const sequence = await db.getFirstAsync(`SELECT value FROM app_meta WHERE key = 'quote_sequence'`);
  if (!sequence) {
    await db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES (?, ?)`,
      ['quote_sequence', '0']
    );
  }
}
