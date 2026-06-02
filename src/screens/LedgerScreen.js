import React, { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Badge, Button, EmptyState, Field, ListRow, Screen, SectionTitle } from '../components/UI';
import { registerLedgerPayment } from '../db/repository';
import { money, shortDate } from '../utils/format';

export function LedgerScreen({ snapshot, onDataChanged }) {
  const customers = useMemo(() => snapshot.customers || [], [snapshot.customers]);
  const entries = useMemo(() => snapshot.ledgerEntries || [], [snapshot.ledgerEntries]);
  const pendingSales = useMemo(() => snapshot.pendingSales || [], [snapshot.pendingSales]);
  const [form, setForm] = useState({
    customer_id: '',
    amount: '',
    entry_date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const savePayment = async () => {
    try {
      await registerLedgerPayment(form);
      setForm({
        customer_id: '',
        amount: '',
        entry_date: new Date().toISOString().slice(0, 10),
        note: '',
      });
      await onDataChanged();
      Alert.alert('Listo', 'Abono registrado y aplicado a ventas pendientes.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo registrar el abono.');
    }
  };

  return (
    <Screen
      title="Cartera / Pendientes"
      subtitle="Ventas pendientes de pago y registro de abonos."
    >
      <SectionTitle title="Ventas pendientes" />
      {pendingSales.length === 0 ? (
        <EmptyState title="Sin cartera pendiente" message="Las ventas pendientes aparecerán aquí." />
      ) : (
        pendingSales.map((sale) => (
          <ListRow
            key={sale.id}
            title={`${sale.customer_name || 'Cliente manual'} · ${money(sale.remaining_amount)}`}
            subtitle={`${shortDate(sale.sale_date)} · ${sale.description}`}
            trailing={<Badge label={sale.quote_number} tone="warning" />}
            footer={<Text style={{ color: '#64748b', fontSize: 12 }}>Total venta: {money(sale.total)}</Text>}
          />
        ))
      )}

      <SectionTitle title="Registrar abono" subtitle="Usa el ID del cliente del listado inferior." />
      <Field label="ID del cliente" value={form.customer_id} onChangeText={(value) => setForm((current) => ({ ...current, customer_id: value }))} placeholder="ID del cliente" keyboardType="numeric" />
      <Field label="Monto" value={form.amount} onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))} placeholder="0" keyboardType="numeric" />
      <Field label="Fecha" value={form.entry_date} onChangeText={(value) => setForm((current) => ({ ...current, entry_date: value }))} placeholder="YYYY-MM-DD" />
      <Field label="Nota" value={form.note} onChangeText={(value) => setForm((current) => ({ ...current, note: value }))} placeholder="Observación del abono" />
      <Button label="Guardar abono" onPress={savePayment} icon="cash-outline" />

      <SectionTitle title="Movimientos de cartera" />
      {entries.length === 0 ? (
        <EmptyState title="Sin movimientos" message="Los cargos y abonos se verán en este historial." />
      ) : (
        entries.map((entry) => (
          <ListRow
            key={entry.id}
            title={`${entry.customer_name} · ${money(entry.amount)}`}
            subtitle={`${shortDate(entry.entry_date)} · ${entry.note || 'Sin nota'}`}
            trailing={<Badge label={entry.entry_type === 'charge' ? 'Cargo' : 'Pago'} tone={entry.entry_type === 'charge' ? 'warning' : 'success'} />}
            footer={<Text style={{ color: '#64748b', fontSize: 12 }}>Referencia: {entry.ref_type || 'manual'}</Text>}
          />
        ))
      )}

      <SectionTitle title="Clientes disponibles" />
      {customers.map((customer) => (
        <ListRow
          key={customer.id}
          title={`${customer.id}. ${customer.name}`}
          subtitle={`Saldo pendiente: ${money(customer.pending_balance || 0)}`}
        />
      ))}
    </Screen>
  );
}
