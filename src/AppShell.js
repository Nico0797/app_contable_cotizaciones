import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initializeDatabase } from './db/database';
import {
  getHomeSummary,
  listCustomers,
  listInventoryItems,
  listInventoryMovements,
  listLedgerEntries,
  listPendingSales,
  listQuotes,
  listSales,
  listTransactions,
} from './db/repository';
import { TabBar } from './components/UI';
import { HomeScreen } from './screens/HomeScreen';
import { QuotesScreen } from './screens/QuotesScreen';
import { SalesScreen } from './screens/SalesScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { MovementsScreen } from './screens/MovementsScreen';
import { LedgerScreen } from './screens/LedgerScreen';

const TABS = [
  { key: 'home', label: 'Inicio', icon: 'home-outline' },
  { key: 'quotes', label: 'Cotiz.', icon: 'document-text-outline' },
  { key: 'sales', label: 'Ventas', icon: 'receipt-outline' },
  { key: 'customers', label: 'Clientes', icon: 'people-outline' },
  { key: 'inventory', label: 'Invent.', icon: 'cube-outline' },
  { key: 'movements', label: 'Movs', icon: 'swap-horizontal-outline' },
  { key: 'ledger', label: 'Cartera', icon: 'wallet-outline' },
];

export function AppShell() {
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [snapshot, setSnapshot] = useState({
    home: null,
    customers: [],
    quotes: [],
    sales: [],
    inventoryItems: [],
    inventoryMovements: [],
    transactions: [],
    ledgerEntries: [],
    pendingSales: [],
  });

  const refreshAll = async () => {
    const [
      home,
      customers,
      quotes,
      sales,
      inventoryItems,
      inventoryMovements,
      transactions,
      ledgerEntries,
      pendingSales,
    ] = await Promise.all([
      getHomeSummary(),
      listCustomers(),
      listQuotes(),
      listSales(),
      listInventoryItems(),
      listInventoryMovements(20),
      listTransactions(),
      listLedgerEntries(),
      listPendingSales(),
    ]);

    setSnapshot({
      home,
      customers,
      quotes,
      sales,
      inventoryItems,
      inventoryMovements,
      transactions,
      ledgerEntries,
      pendingSales,
    });
  };

  useEffect(() => {
    (async () => {
      try {
        await initializeDatabase();
        await refreshAll();
        setReady(true);
      } catch (error) {
        setErrorMessage(error?.message || 'No se pudo iniciar la aplicación.');
      }
    })();
  }, []);

  const onDataChanged = async (nextTab) => {
    try {
      await refreshAll();
      if (nextTab) {
        setActiveTab(nextTab);
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo actualizar la información.');
    }
  };

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.errorTitle}>Error de inicio</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Preparando app offline...</Text>
      </SafeAreaView>
    );
  }

  let CurrentScreen = HomeScreen;
  if (activeTab === 'quotes') CurrentScreen = QuotesScreen;
  if (activeTab === 'sales') CurrentScreen = SalesScreen;
  if (activeTab === 'customers') CurrentScreen = CustomersScreen;
  if (activeTab === 'inventory') CurrentScreen = InventoryScreen;
  if (activeTab === 'movements') CurrentScreen = MovementsScreen;
  if (activeTab === 'ledger') CurrentScreen = LedgerScreen;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Offline · SQLite local</Text>
        <Text style={styles.title}>App Contable Cotizaciones</Text>
        <Text style={styles.subtitle}>
          Sin backend, sin WebView, sin internet obligatoria.
        </Text>
      </View>

      <View style={styles.body}>
        <CurrentScreen
          snapshot={snapshot}
          onDataChanged={onDataChanged}
          openTab={setActiveTab}
        />
      </View>

      <View style={styles.footer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  body: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#475569',
    fontSize: 15,
  },
  errorTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
  },
  errorText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
