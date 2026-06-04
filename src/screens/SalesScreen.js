import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { EmptyState, ListRow, MetricCard, Screen, SectionTitle, StatusChip, uiStyles } from '../components/UI';
import { boolLabel, money, shortDate } from '../utils/format';

export function SalesScreen({ snapshot }) {
  const sales = useMemo(() => snapshot.sales || [], [snapshot.sales]);
  const paidCount = sales.filter((sale) => Boolean(sale.paid)).length;
  const pendingCount = sales.length - paidCount;
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

  return (
    <Screen
      title="Ventas"
      subtitle="Solo historial de ventas nacidas desde cotizaciones confirmadas."
    >
      <View style={uiStyles.rowWrap}>
        <MetricCard label="Total ventas" value={String(sales.length)} />
        <MetricCard label="Pagadas" value={String(paidCount)} tone="success" />
        <MetricCard label="Pendientes" value={String(pendingCount)} tone="warning" />
        <MetricCard label="Total vendido" value={money(totalSales)} />
      </View>

      <SectionTitle title="Historial" subtitle="Sin formulario manual de venta." />
      {sales.length === 0 ? (
        <EmptyState
          title="Sin ventas"
          message="Confirma una cotizacion para que la venta aparezca aqui automaticamente."
        />
      ) : (
        <View style={{ gap: 12 }}>
          {sales.map((sale) => (
            <ListRow
              key={sale.id}
              title={sale.customer_name || 'Cliente manual'}
              subtitle={`${shortDate(sale.sale_date)} · ${sale.description}`}
              trailing={<StatusChip label={boolLabel(sale.paid)} tone={sale.paid ? 'success' : 'warning'} />}
              footer={
                <View style={{ gap: 6 }}>
                  <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900' }}>{money(sale.total)}</Text>
                  <Text style={{ color: '#93a8c7', fontSize: 12 }}>
                    Origen: {sale.quote_number} · Subtotal {money(sale.subtotal)}
                  </Text>
                </View>
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
