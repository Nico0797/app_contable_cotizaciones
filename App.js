import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getDatabase, money, today } from './src/db';

const tabs = ['Inicio', 'Cotizaciones', 'Ventas', 'Inventario', 'Movimientos'];

export default function App() {
  const [tab, setTab] = useState('Inicio');
  const [ready, setReady] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [quote, setQuote] = useState({ customer: '', description: '', qty: '1', price: '' });
  const [item, setItem] = useState({ name: '', unit: 'unidad', stock: '', min: '', cost: '' });
  const [tx, setTx] = useState({ kind: 'expense', amount: '', category: '', note: '' });

  async function init() {
    const db = await getDatabase();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quotes (id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT NOT NULL, description TEXT NOT NULL, total REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT NOT NULL, description TEXT NOT NULL, total REAL NOT NULL, paid INTEGER NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, unit TEXT NOT NULL, stock REAL NOT NULL, min_stock REAL NOT NULL, cost REAL NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, amount REAL NOT NULL, category TEXT, note TEXT, created_at TEXT NOT NULL);
    `);
    await refresh();
    setReady(true);
  }

  async function refresh() {
    const db = await getDatabase();
    setQuotes(await db.getAllAsync('SELECT * FROM quotes ORDER BY id DESC'));
    setSales(await db.getAllAsync('SELECT * FROM sales ORDER BY id DESC'));
    setInventory(await db.getAllAsync('SELECT * FROM inventory ORDER BY name ASC'));
    setTransactions(await db.getAllAsync('SELECT * FROM transactions ORDER BY id DESC'));
  }

  useEffect(() => { init().catch(e => Alert.alert('Error', e.message)); }, []);

  function number(value) {
    const n = Number(String(value || '0').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  async function saveQuote() {
    const db = await getDatabase();
    const total = number(quote.qty) * number(quote.price);
    if (!quote.customer.trim() || !quote.description.trim() || total <= 0) return Alert.alert('Revisa', 'Completa cliente, descripcion, cantidad y precio.');
    await db.runAsync('INSERT INTO quotes(customer, description, total, status, created_at) VALUES(?,?,?,?,?)', quote.customer.trim(), quote.description.trim(), total, 'draft', new Date().toISOString());
    setQuote({ customer: '', description: '', qty: '1', price: '' });
    await refresh();
  }

  async function confirmQuote(q, paid) {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('INSERT INTO sales(customer, description, total, paid, created_at) VALUES(?,?,?,?,?)', q.customer, q.description, q.total, paid ? 1 : 0, new Date().toISOString());
      await db.runAsync('UPDATE quotes SET status=? WHERE id=?', 'converted', q.id);
      if (paid) await db.runAsync('INSERT INTO transactions(kind, amount, category, note, created_at) VALUES(?,?,?,?,?)', 'income', q.total, 'Ventas', 'Venta desde cotizacion', new Date().toISOString());
    });
    await refresh();
    setTab('Ventas');
  }

  async function saveInventory() {
    const db = await getDatabase();
    if (!item.name.trim()) return Alert.alert('Revisa', 'Escribe el nombre del insumo.');
    await db.runAsync('INSERT INTO inventory(name, unit, stock, min_stock, cost, created_at) VALUES(?,?,?,?,?,?)', item.name.trim(), item.unit || 'unidad', number(item.stock), number(item.min), number(item.cost), new Date().toISOString());
    setItem({ name: '', unit: 'unidad', stock: '', min: '', cost: '' });
    await refresh();
  }

  async function saveTx() {
    const db = await getDatabase();
    const amount = number(tx.amount);
    if (amount <= 0) return Alert.alert('Revisa', 'El monto debe ser mayor a cero.');
    await db.runAsync('INSERT INTO transactions(kind, amount, category, note, created_at) VALUES(?,?,?,?,?)', tx.kind, amount, tx.category, tx.note, new Date().toISOString());
    setTx({ kind: 'expense', amount: '', category: '', note: '' });
    await refresh();
  }

  const income = transactions.filter(x => x.kind === 'income').reduce((a, b) => a + Number(b.amount), 0);
  const expense = transactions.filter(x => x.kind === 'expense').reduce((a, b) => a + Number(b.amount), 0);
  const inventoryValue = inventory.reduce((a, b) => a + Number(b.stock) * Number(b.cost), 0);

  if (!ready) return <SafeAreaView style={styles.safe}><Text style={styles.title}>Preparando app offline...</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    <View style={styles.header}><Text style={styles.title}>Cotizaciones Offline</Text><Text style={styles.muted}>Datos locales en este celular</Text></View>
    <ScrollView horizontal style={styles.tabs}>{tabs.map(t => <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.active]}><Text style={styles.tabText}>{t}</Text></Pressable>)}</ScrollView>
    <ScrollView style={styles.body}>
      {tab === 'Inicio' && <View><Metric label="Ingresos" value={money(income)} /><Metric label="Gastos" value={money(expense)} /><Metric label="Balance" value={money(income - expense)} /><Metric label="Inventario" value={money(inventoryValue)} /></View>}
      {tab === 'Cotizaciones' && <View><Card><Input placeholder="Cliente" value={quote.customer} onChangeText={v => setQuote({...quote, customer: v})} /><Input placeholder="Descripcion" value={quote.description} onChangeText={v => setQuote({...quote, description: v})} /><Input placeholder="Cantidad" value={quote.qty} onChangeText={v => setQuote({...quote, qty: v})} /><Input placeholder="Precio" value={quote.price} onChangeText={v => setQuote({...quote, price: v})} /><Button label="Guardar cotizacion" onPress={saveQuote} /></Card>{quotes.map(q => <Card key={q.id}><Text style={styles.cardTitle}>{q.customer}</Text><Text style={styles.muted}>{q.description}</Text><Text style={styles.total}>{money(q.total)}</Text><Text style={styles.muted}>{q.status}</Text>{q.status !== 'converted' && <View style={styles.row}><Button label="Pagada" onPress={() => confirmQuote(q, true)} /><Button label="Pendiente" onPress={() => confirmQuote(q, false)} /></View>}</Card>)}</View>}
      {tab === 'Ventas' && sales.map(s => <Card key={s.id}><Text style={styles.cardTitle}>{s.customer}</Text><Text style={styles.muted}>{s.description}</Text><Text style={styles.total}>{money(s.total)}</Text><Text style={styles.muted}>{s.paid ? 'Pagada' : 'Pendiente'}</Text></Card>)}
      {tab === 'Inventario' && <View><Card><Input placeholder="Insumo" value={item.name} onChangeText={v => setItem({...item, name: v})} /><Input placeholder="Unidad" value={item.unit} onChangeText={v => setItem({...item, unit: v})} /><Input placeholder="Stock" value={item.stock} onChangeText={v => setItem({...item, stock: v})} /><Input placeholder="Stock minimo" value={item.min} onChangeText={v => setItem({...item, min: v})} /><Input placeholder="Costo unitario" value={item.cost} onChangeText={v => setItem({...item, cost: v})} /><Button label="Guardar insumo" onPress={saveInventory} /></Card>{inventory.map(i => <Card key={i.id}><Text style={styles.cardTitle}>{i.name}</Text><Text style={styles.total}>{i.stock} {i.unit}</Text><Text style={styles.muted}>Valor: {money(Number(i.stock) * Number(i.cost))}</Text></Card>)}</View>}
      {tab === 'Movimientos' && <View><Card><View style={styles.row}><Button label="Gasto" onPress={() => setTx({...tx, kind: 'expense'})} /><Button label="Ingreso" onPress={() => setTx({...tx, kind: 'income'})} /></View><Input placeholder="Monto" value={tx.amount} onChangeText={v => setTx({...tx, amount: v})} /><Input placeholder="Categoria" value={tx.category} onChangeText={v => setTx({...tx, category: v})} /><Input placeholder="Nota" value={tx.note} onChangeText={v => setTx({...tx, note: v})} /><Button label="Guardar movimiento" onPress={saveTx} /></Card>{transactions.map(x => <Card key={x.id}><Text style={styles.cardTitle}>{x.kind === 'income' ? 'Ingreso' : 'Gasto'} {money(x.amount)}</Text><Text style={styles.muted}>{x.category}</Text><Text style={styles.muted}>{x.note}</Text></Card>)}</View>}
    </ScrollView>
  </SafeAreaView>;
}

function Input(props) { return <TextInput {...props} placeholderTextColor="#94a3b8" style={styles.input} />; }
function Button({ label, onPress }) { return <Pressable onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></Pressable>; }
function Card({ children }) { return <View style={styles.card}>{children}</View>; }
function Metric({ label, value }) { return <Card><Text style={styles.muted}>{label}</Text><Text style={styles.total}>{value}</Text></Card>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#08111f' },
  header: { padding: 18 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  muted: { color: '#94a3b8', marginTop: 4 },
  tabs: { maxHeight: 58, paddingHorizontal: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 999, marginRight: 8 },
  active: { backgroundColor: '#2563eb' },
  tabText: { color: '#fff', fontWeight: '800' },
  body: { padding: 14 },
  card: { backgroundColor: '#111827', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#243244' },
  input: { backgroundColor: '#020617', color: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#263244' },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 14, alignItems: 'center', marginVertical: 4, flex: 1 },
  buttonText: { color: '#fff', fontWeight: '900' },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  total: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 6 },
  row: { flexDirection: 'row', gap: 8 }
});
