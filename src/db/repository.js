import { getDatabase } from './database';

function nowIso() {
  return new Date().toISOString();
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function requiredText(value, fieldName) {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new Error(`El campo "${fieldName}" es obligatorio.`);
  }
  return text;
}

function optionalText(value) {
  return String(value ?? '').trim();
}

function numberValue(value, fieldName) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    throw new Error(`El campo "${fieldName}" debe ser numérico.`);
  }
  return parsed;
}

function validateDate(value, fieldName) {
  const text = requiredText(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`El campo "${fieldName}" debe usar el formato YYYY-MM-DD.`);
  }
  return text;
}

async function nextQuoteNumber(db) {
  const row = await db.getFirstAsync(`SELECT value FROM app_meta WHERE key = 'quote_sequence'`);
  const next = Number(row?.value ?? 0) + 1;
  await db.runAsync(`UPDATE app_meta SET value = ? WHERE key = 'quote_sequence'`, [String(next)]);
  return `COT-${String(next).padStart(5, '0')}`;
}

function normalizeQuoteItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La cotización debe incluir al menos un ítem.');
  }

  return items.map((item, index) => {
    const description = requiredText(item.description, `Descripción del ítem ${index + 1}`);
    const qty = numberValue(item.qty, `Cantidad del ítem ${index + 1}`);
    const unitPrice = numberValue(item.unit_price, `Precio del ítem ${index + 1}`);
    if (qty <= 0) throw new Error(`La cantidad del ítem ${index + 1} debe ser mayor a cero.`);
    if (unitPrice < 0) throw new Error(`El precio del ítem ${index + 1} no puede ser negativo.`);
    return {
      description,
      qty,
      unit_price: unitPrice,
      total: Number((qty * unitPrice).toFixed(2)),
    };
  });
}

export async function listCustomers() {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT
      c.*,
      COALESCE((
        SELECT SUM(CASE WHEN l.entry_type = 'charge' THEN l.amount ELSE -l.amount END)
        FROM ledger l
        WHERE l.customer_id = c.id
      ), 0) AS pending_balance
    FROM customers c
    ORDER BY c.name ASC
  `);
}

export async function createCustomer(input) {
  const db = await getDatabase();
  const name = requiredText(input.name, 'Nombre');
  const phone = optionalText(input.phone);
  const address = optionalText(input.address);
  await db.runAsync(
    `INSERT INTO customers (name, phone, address, created_at) VALUES (?, ?, ?, ?)`,
    [name, phone, address, nowIso()]
  );
}

export async function createQuote(input) {
  const db = await getDatabase();
  const customerId = input.customer_id ? Number(input.customer_id) : null;
  const manualName = optionalText(input.customer_name);
  const quoteDate = validateDate(input.quote_date || todayDate(), 'Fecha');
  const note = optionalText(input.note);
  const discount = Math.max(0, numberValue(input.discount || 0, 'Descuento'));
  const items = normalizeQuoteItems(input.items);
  const subtotal = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
  const total = Number(Math.max(0, subtotal - discount).toFixed(2));

  let customerName = manualName;
  if (customerId) {
    const customer = await db.getFirstAsync(`SELECT * FROM customers WHERE id = ?`, [customerId]);
    if (!customer) throw new Error('El cliente seleccionado no existe.');
    customerName = customer.name;
  }

  await db.withTransactionAsync(async () => {
    const quoteNumber = await nextQuoteNumber(db);
    const createdAt = nowIso();
    const insert = await db.runAsync(
      `
        INSERT INTO quotes (
          quote_number, customer_id, customer_name, quote_date, status,
          subtotal, discount, total, note, created_at, converted_sale_id
        )
        VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, NULL)
      `,
      [quoteNumber, customerId, customerName, quoteDate, subtotal, discount, total, note, createdAt]
    );
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO quote_items (quote_id, description, qty, unit_price, total) VALUES (?, ?, ?, ?, ?)`,
        [insert.lastInsertRowId, item.description, item.qty, item.unit_price, item.total]
      );
    }
  });
}

export async function listQuotes() {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT
      q.*,
      (SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id = q.id) AS items_count
    FROM quotes q
    ORDER BY q.id DESC
  `);
}

export async function getQuoteDetail(quoteId) {
  const db = await getDatabase();
  const quote = await db.getFirstAsync(`SELECT * FROM quotes WHERE id = ?`, [quoteId]);
  if (!quote) throw new Error('La cotización no existe.');
  const items = await db.getAllAsync(`SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id ASC`, [quoteId]);
  return { ...quote, items };
}

export async function rejectQuote(quoteId) {
  const db = await getDatabase();
  const quote = await db.getFirstAsync(`SELECT * FROM quotes WHERE id = ?`, [quoteId]);
  if (!quote) throw new Error('La cotización no existe.');
  if (quote.status === 'converted') {
    throw new Error('Una cotización convertida no puede rechazarse.');
  }
  await db.runAsync(`UPDATE quotes SET status = 'rejected' WHERE id = ?`, [quoteId]);
}

export async function confirmQuoteAsSale(quoteId, input) {
  const db = await getDatabase();
  const quote = await getQuoteDetail(quoteId);
  if (quote.status === 'converted') {
    throw new Error('La cotización ya fue confirmada.');
  }

  const paid = Boolean(input.paid);
  const saleDate = validateDate(input.sale_date || todayDate(), 'Fecha de venta');
  const note = optionalText(input.note) || quote.note;
  if (!paid && !quote.customer_id && !optionalText(quote.customer_name)) {
    throw new Error('Si la venta queda pendiente, debes tener cliente asociado o nombre manual.');
  }

  const description = quote.items.slice(0, 3).map((item) => item.description).join(', ');
  const saleDescription =
    quote.items.length > 3 ? `${description} +${quote.items.length - 3} ítems` : description;

  await db.withTransactionAsync(async () => {
    const createdAt = nowIso();
    const paidAmount = paid ? Number(quote.total) : 0;
    const saleInsert = await db.runAsync(
      `
        INSERT INTO sales (
          sale_date, quote_id, customer_id, customer_name, description,
          subtotal, total, paid, paid_amount, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        saleDate,
        quote.id,
        quote.customer_id ?? null,
        quote.customer_name,
        saleDescription,
        quote.subtotal,
        quote.total,
        paid ? 1 : 0,
        paidAmount,
        createdAt,
      ]
    );
    const saleId = saleInsert.lastInsertRowId;

    if (paid) {
      await db.runAsync(
        `
          INSERT INTO transactions (kind, amount, tx_date, category, note, ref_type, ref_id, created_at)
          VALUES ('income', ?, ?, 'Venta confirmada', ?, 'sale', ?, ?)
        `,
        [quote.total, saleDate, note || `Ingreso automático ${quote.quote_number}`, saleId, createdAt]
      );
    } else {
      await db.runAsync(
        `
          INSERT INTO ledger (customer_id, customer_name, entry_type, amount, entry_date, note, ref_type, ref_id, created_at)
          VALUES (?, ?, 'charge', ?, ?, ?, 'sale', ?, ?)
        `,
        [
          quote.customer_id ?? null,
          quote.customer_name || 'Cliente pendiente',
          quote.total,
          saleDate,
          note || `Cargo por ${quote.quote_number}`,
          saleId,
          createdAt,
        ]
      );
    }

    await db.runAsync(
      `UPDATE quotes SET status = 'converted', converted_sale_id = ? WHERE id = ?`,
      [saleId, quote.id]
    );
  });
}

export async function listSales() {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT s.*, q.quote_number
    FROM sales s
    INNER JOIN quotes q ON q.id = s.quote_id
    ORDER BY s.sale_date DESC, s.id DESC
  `);
}

export async function listPendingSales() {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT
      s.*,
      q.quote_number,
      (s.total - s.paid_amount) AS remaining_amount
    FROM sales s
    INNER JOIN quotes q ON q.id = s.quote_id
    WHERE s.paid = 0
    ORDER BY s.sale_date ASC, s.id ASC
  `);
}

export async function listLedgerEntries() {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT * FROM ledger ORDER BY entry_date DESC, id DESC`);
}

export async function registerLedgerPayment(input) {
  const db = await getDatabase();
  const customerId = Number(input.customer_id);
  const amount = numberValue(input.amount, 'Monto');
  const entryDate = validateDate(input.entry_date || todayDate(), 'Fecha');
  const note = optionalText(input.note);
  if (amount <= 0) throw new Error('El abono debe ser mayor a cero.');

  const customer = await db.getFirstAsync(`SELECT * FROM customers WHERE id = ?`, [customerId]);
  if (!customer) throw new Error('El cliente seleccionado no existe.');

  const pendingSales = await db.getAllAsync(
    `SELECT * FROM sales WHERE customer_id = ? AND paid = 0 ORDER BY sale_date ASC, id ASC`,
    [customerId]
  );
  const totalPending = pendingSales.reduce(
    (sum, sale) => sum + (Number(sale.total) - Number(sale.paid_amount || 0)),
    0
  );
  if (pendingSales.length === 0 || totalPending <= 0) {
    throw new Error('Ese cliente no tiene saldo pendiente.');
  }
  if (amount - totalPending > 0.001) {
    throw new Error('El abono no puede ser mayor al saldo pendiente.');
  }

  await db.withTransactionAsync(async () => {
    const createdAt = nowIso();
    await db.runAsync(
      `
        INSERT INTO ledger (customer_id, customer_name, entry_type, amount, entry_date, note, ref_type, ref_id, created_at)
        VALUES (?, ?, 'payment', ?, ?, ?, 'customer', ?, ?)
      `,
      [customerId, customer.name, amount, entryDate, note || 'Abono manual', customerId, createdAt]
    );
    await db.runAsync(
      `
        INSERT INTO transactions (kind, amount, tx_date, category, note, ref_type, ref_id, created_at)
        VALUES ('income', ?, ?, 'Cobro cartera', ?, 'customer', ?, ?)
      `,
      [amount, entryDate, note || `Abono de ${customer.name}`, customerId, createdAt]
    );

    let remaining = amount;
    for (const sale of pendingSales) {
      if (remaining <= 0) break;
      const salePending = Number(sale.total) - Number(sale.paid_amount || 0);
      const applied = Math.min(remaining, salePending);
      const nextPaidAmount = Number(sale.paid_amount || 0) + applied;
      const fullyPaid = nextPaidAmount + 0.001 >= Number(sale.total);
      await db.runAsync(
        `UPDATE sales SET paid_amount = ?, paid = ? WHERE id = ?`,
        [nextPaidAmount, fullyPaid ? 1 : 0, sale.id]
      );
      remaining -= applied;
    }
  });
}

export async function createInventoryItem(input) {
  const db = await getDatabase();
  const name = requiredText(input.name, 'Nombre del insumo');
  const unit = requiredText(input.unit, 'Unidad');
  const currentStock = Math.max(0, numberValue(input.current_stock || 0, 'Stock inicial'));
  const minStock = Math.max(0, numberValue(input.min_stock || 0, 'Stock mínimo'));
  const unitCost = Math.max(0, numberValue(input.unit_cost || 0, 'Costo unitario'));
  const supplier = optionalText(input.supplier);

  await db.runAsync(
    `
      INSERT INTO inventory_items (name, unit, current_stock, min_stock, unit_cost, supplier, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `,
    [name, unit, currentStock, minStock, unitCost, supplier, nowIso()]
  );
}

export async function listInventoryItems() {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT
      *,
      (current_stock * unit_cost) AS inventory_value,
      CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END AS low_stock
    FROM inventory_items
    WHERE active = 1
    ORDER BY name ASC
  `);
}

export async function createInventoryMovement(input) {
  const db = await getDatabase();
  const itemId = Number(input.item_id);
  const movementType = requiredText(input.movement_type, 'Tipo');
  const qty = numberValue(input.qty, 'Cantidad');
  const movementDate = validateDate(input.movement_date || todayDate(), 'Fecha');
  const note = optionalText(input.note);
  const unitCost =
    input.unit_cost === '' || input.unit_cost == null
      ? null
      : Math.max(0, numberValue(input.unit_cost, 'Costo unitario'));

  if (!['in', 'out', 'adjustment'].includes(movementType)) {
    throw new Error('El tipo de movimiento debe ser in, out o adjustment.');
  }
  if (qty <= 0) throw new Error('La cantidad debe ser mayor a cero.');

  const item = await db.getFirstAsync(`SELECT * FROM inventory_items WHERE id = ?`, [itemId]);
  if (!item) throw new Error('El insumo seleccionado no existe.');

  const currentStock = Number(item.current_stock);
  let nextStock = currentStock;
  if (movementType === 'in') nextStock = currentStock + qty;
  if (movementType === 'out') nextStock = currentStock - qty;
  if (movementType === 'adjustment') nextStock = qty;
  if (movementType === 'out' && nextStock < -0.001) {
    throw new Error('No se puede registrar una salida mayor al stock disponible.');
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `
        INSERT INTO inventory_movements (item_id, movement_type, qty, unit_cost, movement_date, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [itemId, movementType, qty, unitCost, movementDate, note, nowIso()]
    );
    await db.runAsync(
      `UPDATE inventory_items SET current_stock = ?, unit_cost = ? WHERE id = ?`,
      [Number(nextStock.toFixed(2)), unitCost == null ? Number(item.unit_cost) : unitCost, itemId]
    );
  });
}

export async function listInventoryMovements(limit = 50) {
  const db = await getDatabase();
  return db.getAllAsync(
    `
      SELECT
        m.*,
        i.name AS item_name,
        i.unit AS item_unit
      FROM inventory_movements m
      INNER JOIN inventory_items i ON i.id = m.item_id
      ORDER BY m.movement_date DESC, m.id DESC
      LIMIT ?
    `,
    [limit]
  );
}

export async function createManualTransaction(input) {
  const db = await getDatabase();
  const kind = requiredText(input.kind, 'Tipo');
  const amount = numberValue(input.amount, 'Monto');
  const txDate = validateDate(input.tx_date || todayDate(), 'Fecha');
  const category = requiredText(input.category, 'Categoría');
  const note = optionalText(input.note);
  if (!['income', 'expense'].includes(kind)) {
    throw new Error('El tipo debe ser income o expense.');
  }
  if (amount <= 0) throw new Error('El monto debe ser mayor a cero.');

  await db.runAsync(
    `
      INSERT INTO transactions (kind, amount, tx_date, category, note, ref_type, ref_id, created_at)
      VALUES (?, ?, ?, ?, ?, '', NULL, ?)
    `,
    [kind, amount, txDate, category, note, nowIso()]
  );
}

export async function listTransactions() {
  const db = await getDatabase();
  return db.getAllAsync(`SELECT * FROM transactions ORDER BY tx_date DESC, id DESC`);
}

export async function getHomeSummary() {
  const db = await getDatabase();
  const monthPrefix = todayDate().slice(0, 7);
  const [totals, pendingRow, inventoryRow, quotesRow, salesMonthRow, lowStockRow] =
    await Promise.all([
      db.getFirstAsync(`
        SELECT
          COALESCE((SELECT SUM(total) FROM sales), 0) AS total_sold,
          COALESCE((SELECT SUM(CASE WHEN kind = 'income' THEN amount ELSE 0 END) FROM transactions), 0) AS total_income,
          COALESCE((SELECT SUM(CASE WHEN kind = 'expense' THEN amount ELSE 0 END) FROM transactions), 0) AS total_expense
      `),
      db.getFirstAsync(`
        SELECT COALESCE(SUM(CASE WHEN entry_type = 'charge' THEN amount ELSE -amount END), 0) AS pending_money
        FROM ledger
      `),
      db.getFirstAsync(`
        SELECT COALESCE(SUM(current_stock * unit_cost), 0) AS inventory_value
        FROM inventory_items
        WHERE active = 1
      `),
      db.getFirstAsync(`SELECT COUNT(*) AS pending_quotes FROM quotes WHERE status = 'draft'`),
      db.getFirstAsync(
        `SELECT COALESCE(SUM(total), 0) AS sales_this_month FROM sales WHERE substr(sale_date, 1, 7) = ?`,
        [monthPrefix]
      ),
      db.getFirstAsync(`
        SELECT COUNT(*) AS low_stock_items
        FROM inventory_items
        WHERE active = 1 AND current_stock <= min_stock
      `),
    ]);

  return {
    totalSold: Number(totals.total_sold || 0),
    totalIncome: Number(totals.total_income || 0),
    totalExpense: Number(totals.total_expense || 0),
    balance: Number(totals.total_income || 0) - Number(totals.total_expense || 0),
    pendingMoney: Number(pendingRow.pending_money || 0),
    inventoryValue: Number(inventoryRow.inventory_value || 0),
    pendingQuotes: Number(quotesRow.pending_quotes || 0),
    salesThisMonth: Number(salesMonthRow.sales_this_month || 0),
    lowStockItems: Number(lowStockRow.low_stock_items || 0),
  };
}
