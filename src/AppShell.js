import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { QuotesScreen } from './screens/QuotesScreen';
import { SalesScreen } from './screens/SalesScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { MovementsScreen } from './screens/MovementsScreen';
import { LedgerScreen } from './screens/LedgerScreen';
import { MoreScreen } from './screens/MoreScreen';
import { theme } from './theme';

const MAIN_TABS = [
  { key: 'home', label: 'Inicio', icon: 'home-outline' },
  { key: 'quotes', label: 'Cotiz.', icon: 'document-text-outline' },
  { key: 'sales', label: 'Ventas', icon: 'receipt-outline' },
  { key: 'inventory', label: 'Invent.', icon: 'cube-outline' },
  { key: 'more', label: 'Más', icon: 'ellipsis-horizontal-circle-outline' },
];

const HIDDEN_ROUTES = ['customers', 'movements', 'ledger', 'settings'];

export function AppShell() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <AppShellInner />
    </SafeAreaProvider>
  );
}

function AppShellInner() {
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentRoute, setCurrentRoute] = useState('home');
  const [command, setCommand] = useState(null);
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
        setErrorMessage(error?.message || 'No se pudo iniciar la aplicacion.');
      }
    })();
  }, []);

  const navigate = (route, action = null, payload = null) => {
    setCurrentRoute(route);
    if (action) {
      setCommand({ route, action, payload, token: Date.now() });
    }
  };

  const onDataChanged = async (nextRoute, nextAction = null, payload = null) => {
    try {
      await refreshAll();
      if (nextRoute) {
        navigate(nextRoute, nextAction, payload);
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo actualizar la informacion.');
    }
  };

  if (errorMessage) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.errorRoot}>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={34} color={theme.colors.danger} />
          </View>
          <Text style={styles.errorTitle}>No se pudo abrir la app</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!ready) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.errorRoot}>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Preparando la app offline...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  let CurrentScreen = HomeScreen;
  if (currentRoute === 'quotes') CurrentScreen = QuotesScreen;
  if (currentRoute === 'sales') CurrentScreen = SalesScreen;
  if (currentRoute === 'inventory') CurrentScreen = InventoryScreen;
  if (currentRoute === 'customers') CurrentScreen = CustomersScreen;
  if (currentRoute === 'movements') CurrentScreen = MovementsScreen;
  if (currentRoute === 'ledger') CurrentScreen = LedgerScreen;
  if (currentRoute === 'more') CurrentScreen = MoreScreen;

  const activeBottomTab = HIDDEN_ROUTES.includes(currentRoute) ? 'more' : currentRoute;

  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.root}>
      <SafeAreaView style={styles.safeRoot} edges={['top']}>
        <View style={styles.body}>
          <CurrentScreen
            snapshot={snapshot}
            navigate={navigate}
            command={command}
            onDataChanged={onDataChanged}
          />
        </View>

        <BottomNav tabs={MAIN_TABS} activeTab={activeBottomTab} onChange={(tab) => navigate(tab)} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeRoot: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  errorRoot: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  errorIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.14)',
  },
  errorTitle: {
    color: theme.colors.textStrong,
    fontSize: 22,
    fontWeight: '900',
  },
  errorText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loadingText: {
    color: theme.colors.muted,
    fontSize: 15,
  },
});
