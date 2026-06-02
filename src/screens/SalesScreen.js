import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { Badge, EmptyState, ListRow, Screen, SectionTitle } from '../components/UI';
import { boolLabel, money, shortDate } from '../utils/format';

export function SalesScreen({ snapshot }) {
  const sales = useMemo(() => snapshot.sales || [], [snapshot.sales]);

  return (
    <Screen
      title="Ventas"
      subtitle="Historial de ventas creadas solo desde cotizaciones confirmadas."
    >
      <SectionTitle title="Historial" subtitle="No existe formulario manual para crear ventas." />
      {sales.length === 0 ? (
        <EmptyState
          title="Sin ventas"
          message="Confirma una cotización para generar una venta automáticamente."
        />
      ) : (
        sales.map((sale) => (
          <ListRow
            key={sale.id}
            title={`${sale.customer_name || 'Cliente manual'} · ${money(sale.total)}`}
            subtitle={`${shortDate(sale.sale_date)} · ${sale.description}`}
            trailing={<Badge label={boolLabel(sale.paid)} tone={sale.paid ? 'success' : 'warning'} />}
            footer={
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                Origen: {sale.quote_number} · Subtotal {money(sale.subtotal)}
              </Text>
            }
          />
        ))
      )}
    </Screen>
  );
}
