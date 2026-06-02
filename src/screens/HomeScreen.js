import React from 'react';
import { View } from 'react-native';
import { Card, Screen, SectionTitle, StatCard } from '../components/UI';
import { money } from '../utils/format';

export function HomeScreen({ snapshot }) {
  const home = snapshot.home || {};

  return (
    <Screen
      title="Inicio"
      subtitle="Resumen general de ventas, caja, inventario y cartera en modo offline."
    >
      <SectionTitle title="Resumen principal" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard label="Total vendido" value={money(home.totalSold || 0)} />
        <StatCard label="Total ingresado" value={money(home.totalIncome || 0)} success />
        <StatCard label="Total de gastos" value={money(home.totalExpense || 0)} danger />
        <StatCard
          label="Balance"
          value={money(home.balance || 0)}
          success={(home.balance || 0) >= 0}
          danger={(home.balance || 0) < 0}
        />
        <StatCard label="Pendiente por cobrar" value={money(home.pendingMoney || 0)} />
        <StatCard label="Valor inventario" value={money(home.inventoryValue || 0)} />
        <StatCard label="Cotizaciones pendientes" value={String(home.pendingQuotes || 0)} />
        <StatCard label="Ventas del mes" value={money(home.salesThisMonth || 0)} />
      </View>

      <SectionTitle title="Observaciones del día" />
      <Card>
        <SectionTitle
          title={`Bajo stock: ${home.lowStockItems || 0}`}
          subtitle="Revisa la pestaña Inventario para registrar entradas, salidas o ajustes."
        />
        <SectionTitle
          title={`Cartera abierta: ${money(home.pendingMoney || 0)}`}
          subtitle="Los abonos registrados reducen el saldo y completan ventas pendientes."
        />
      </Card>
    </Screen>
  );
}
