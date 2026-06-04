import React from 'react';
import { View } from 'react-native';
import {
  ActionButton,
  Card,
  MetricCard,
  Screen,
  SectionTitle,
  StatusChip,
  uiStyles,
} from '../components/UI';
import { money } from '../utils/format';
import { theme } from '../theme';

export function HomeScreen({ snapshot, navigate }) {
  const home = snapshot.home || {};

  return (
    <Screen
      title="Inicio"
      subtitle="Dashboard compacto para caja, ventas, cartera e inventario."
    >
      <View style={uiStyles.rowWrap}>
        <MetricCard label="Total vendido" value={money(home.totalSold || 0)} />
        <MetricCard label="Ingresos" value={money(home.totalIncome || 0)} tone="success" />
        <MetricCard label="Gastos" value={money(home.totalExpense || 0)} tone="danger" />
        <MetricCard
          label="Balance"
          value={money(home.balance || 0)}
          tone={(home.balance || 0) >= 0 ? 'primary' : 'warning'}
        />
        <MetricCard label="Pendiente" value={money(home.pendingMoney || 0)} tone="warning" />
        <MetricCard label="Inventario" value={money(home.inventoryValue || 0)} />
        <MetricCard label="Cotiz. pendientes" value={String(home.pendingQuotes || 0)} />
        <MetricCard label="Ventas del mes" value={money(home.salesThisMonth || 0)} />
      </View>

      <SectionTitle title="Acciones rapidas" subtitle="Navega directo a las tareas mas usadas." />
      <View style={uiStyles.rowWrap}>
        <View style={{ flex: 1, minWidth: 145 }}>
          <ActionButton label="Nueva cotiz." icon="add-circle-outline" onPress={() => navigate('quotes', 'create')} />
        </View>
        <View style={{ flex: 1, minWidth: 145 }}>
          <ActionButton label="Nuevo cliente" icon="person-add-outline" onPress={() => navigate('customers', 'create')} tone="secondary" />
        </View>
        <View style={{ flex: 1, minWidth: 145 }}>
          <ActionButton label="Movimiento" icon="swap-horizontal-outline" onPress={() => navigate('movements', 'create')} tone="secondary" />
        </View>
        <View style={{ flex: 1, minWidth: 145 }}>
          <ActionButton label="Inventario" icon="cube-outline" onPress={() => navigate('inventory', 'create-item')} tone="secondary" />
        </View>
      </View>

      <SectionTitle title="Pulso del negocio" subtitle="Alertas suaves para revisar sin saturarte." />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <StatusChip label={`Bajo stock: ${home.lowStockItems || 0}`} tone={(home.lowStockItems || 0) > 0 ? 'warning' : 'success'} />
          </View>
          <View style={{ flex: 1 }}>
            <StatusChip label={`Pendiente: ${money(home.pendingMoney || 0)}`} tone={(home.pendingMoney || 0) > 0 ? 'warning' : 'info'} />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
