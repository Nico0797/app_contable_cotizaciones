import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  ActionButton,
  AppInput,
  AppModal,
  EmptyState,
  FloatingButton,
  ListRow,
  MetricCard,
  Screen,
  SectionTitle,
  StatusChip,
  uiStyles,
} from '../components/UI';
import { registerLedgerPayment } from '../db/repository';
import { money, shortDate } from '../utils/format';

export function LedgerScreen({ snapshot, onDataChanged, command }) {
  const customers = useMemo(() => snapshot.customers || [], [snapshot.customers]);
  const entries = useMemo(() => snapshot.ledgerEntries || [], [snapshot.ledgerEntries]);
  const pendingSales = useMemo(() => snapshot.pendingSales || [], [snapshot.pendingSales]);
  const totalPending = pendingSales.reduce((sum, sale) => sum + Number(sale.remaining_amount || 0), 0);
  const customersWithBalance = customers.filter((customer) => Number(customer.pending_balance || 0) > 0).length;

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    customer_id: '',
    amount: '',
    entry_date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  useEffect(() => {
    if (command?.route === 'ledger' && command?.action === 'create-payment') {
      setModalVisible(true);
      if (command?.payload?.customerId) {
        setForm((current) => ({ ...current, customer_id: command.payload.customerId }));
      }
    }
  }, [command]);

  const savePayment = async () => {
    try {
      await registerLedgerPayment(form);
      setForm({
        customer_id: '',
        amount: '',
        entry_date: new Date().toISOString().slice(0, 10),
        note: '',
      });
      setModalVisible(false);
      await onDataChanged();
      Alert.alert('Listo', 'Abono registrado y aplicado a las ventas pendientes.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo registrar el abono.');
    }
  };

  return (
    <>
      <Screen
        title="Cartera"
        subtitle="Saldos pendientes, ventas abiertas y abonos desde modal."
        floatingAction={<FloatingButton label="Abono" icon="cash-outline" onPress={() => setModalVisible(true)} />}
      >
        <View style={uiStyles.rowWrap}>
          <MetricCard label="Total pendiente" value={money(totalPending)} tone="warning" />
          <MetricCard label="Clientes con saldo" value={String(customersWithBalance)} />
          <MetricCard label="Ventas pendientes" value={String(pendingSales.length)} />
        </View>

        <SectionTitle title="Ventas pendientes" subtitle="El abono completo marca la venta como pagada." />
        {pendingSales.length === 0 ? (
          <EmptyState title="Sin cartera pendiente" message="Cuando una venta quede pendiente aparecera aqui." />
        ) : (
          <View style={{ gap: 12 }}>
            {pendingSales.map((sale) => (
              <ListRow
                key={sale.id}
                title={sale.customer_name || 'Cliente manual'}
                subtitle={`${shortDate(sale.sale_date)} · ${sale.description}`}
                trailing={<StatusChip label={money(sale.remaining_amount)} tone="warning" />}
                footer={
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <ActionButton
                      label="Registrar abono"
                      icon="cash-outline"
                      onPress={() => {
                        setModalVisible(true);
                        setForm((current) => ({
                          ...current,
                          customer_id: String(sale.customer_id || ''),
                        }));
                      }}
                      tone="warning"
                      compact
                    />
                    <StatusChip label={sale.quote_number} tone="info" />
                  </View>
                }
              />
            ))}
          </View>
        )}

        <SectionTitle title="Historial de cartera" subtitle="Cargos y pagos registrados." />
        {entries.length === 0 ? (
          <EmptyState title="Sin movimientos" message="Los cargos y abonos se veran en este historial." />
        ) : (
          <View style={{ gap: 12 }}>
            {entries.map((entry) => (
              <ListRow
                key={entry.id}
                title={`${entry.customer_name} · ${money(entry.amount)}`}
                subtitle={`${shortDate(entry.entry_date)} · ${entry.note || 'Sin nota'}`}
                trailing={<StatusChip label={entry.entry_type === 'charge' ? 'Cargo' : 'Pago'} tone={entry.entry_type === 'charge' ? 'warning' : 'success'} />}
                footer={<Text style={{ color: '#93a8c7', fontSize: 12 }}>Referencia: {entry.ref_type || 'manual'}</Text>}
              />
            ))}
          </View>
        )}
      </Screen>

      <AppModal
        visible={modalVisible}
        title="Registrar abono"
        subtitle="Usa el ID del cliente y el monto a aplicar."
        onClose={() => setModalVisible(false)}
      >
        <AppInput label="ID del cliente" value={form.customer_id} onChangeText={(value) => setForm((current) => ({ ...current, customer_id: value }))} placeholder="ID del cliente" keyboardType="numeric" />
        <AppInput label="Monto" value={form.amount} onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))} placeholder="0" keyboardType="numeric" />
        <AppInput label="Fecha" value={form.entry_date} onChangeText={(value) => setForm((current) => ({ ...current, entry_date: value }))} placeholder="YYYY-MM-DD" />
        <AppInput label="Nota" value={form.note} onChangeText={(value) => setForm((current) => ({ ...current, note: value }))} placeholder="Observacion del pago" />
        <ActionButton label="Guardar abono" icon="save-outline" onPress={savePayment} />
      </AppModal>
    </>
  );
}
