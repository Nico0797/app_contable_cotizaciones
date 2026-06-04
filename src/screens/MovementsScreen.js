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
import { createManualTransaction } from '../db/repository';
import { money, shortDate } from '../utils/format';

export function MovementsScreen({ snapshot, onDataChanged, command }) {
  const transactions = useMemo(() => snapshot.transactions || [], [snapshot.transactions]);
  const incomes = transactions
    .filter((transaction) => transaction.kind === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const expenses = transactions
    .filter((transaction) => transaction.kind === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    kind: 'expense',
    amount: '',
    tx_date: new Date().toISOString().slice(0, 10),
    category: '',
    note: '',
  });

  useEffect(() => {
    if (command?.route === 'movements' && command?.action === 'create') {
      setModalVisible(true);
    }
  }, [command]);

  const saveMovement = async () => {
    try {
      await createManualTransaction(form);
      setForm({
        kind: 'expense',
        amount: '',
        tx_date: new Date().toISOString().slice(0, 10),
        category: '',
        note: '',
      });
      setModalVisible(false);
      await onDataChanged();
      Alert.alert('Listo', 'Movimiento registrado correctamente.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el movimiento.');
    }
  };

  return (
    <>
      <Screen
        title="Movimientos"
        subtitle="Ingresos y gastos manuales en una vista mas limpia y practica."
        floatingAction={<FloatingButton label="Nuevo" icon="add" onPress={() => setModalVisible(true)} />}
      >
        <View style={uiStyles.rowWrap}>
          <MetricCard label="Ingresos" value={money(incomes)} tone="success" />
          <MetricCard label="Gastos" value={money(expenses)} tone="warning" />
        </View>

        <SectionTitle title="Historial" subtitle="Todos los movimientos con su referencia y fecha." />
        {transactions.length === 0 ? (
          <EmptyState title="Sin movimientos" message="Los ingresos y gastos apareceran aqui." />
        ) : (
          <View style={{ gap: 12 }}>
            {transactions.map((tx) => (
              <ListRow
                key={tx.id}
                title={`${money(tx.amount)} · ${tx.category}`}
                subtitle={`${shortDate(tx.tx_date)} · ${tx.note || 'Sin nota'}`}
                trailing={<StatusChip label={tx.kind === 'income' ? 'Ingreso' : 'Gasto'} tone={tx.kind === 'income' ? 'success' : 'warning'} />}
                footer={<Text style={{ color: '#93a8c7', fontSize: 12 }}>Referencia: {tx.ref_type || 'manual'}</Text>}
              />
            ))}
          </View>
        )}
      </Screen>

      <AppModal
        visible={modalVisible}
        title="Nuevo movimiento"
        subtitle="Usa ingreso o gasto y agrega solo lo esencial."
        onClose={() => setModalVisible(false)}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <ActionButton
              label="Ingreso"
              icon="arrow-up-circle-outline"
              onPress={() => setForm((current) => ({ ...current, kind: 'income' }))}
              tone={form.kind === 'income' ? 'success' : 'secondary'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton
              label="Gasto"
              icon="arrow-down-circle-outline"
              onPress={() => setForm((current) => ({ ...current, kind: 'expense' }))}
              tone={form.kind === 'expense' ? 'warning' : 'secondary'}
            />
          </View>
        </View>
        <AppInput label="Monto" value={form.amount} onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))} placeholder="0" keyboardType="numeric" />
        <AppInput label="Fecha" value={form.tx_date} onChangeText={(value) => setForm((current) => ({ ...current, tx_date: value }))} placeholder="YYYY-MM-DD" />
        <AppInput label="Categoria" value={form.category} onChangeText={(value) => setForm((current) => ({ ...current, category: value }))} placeholder="Ej. arriendo, caja menor, servicios" />
        <AppInput label="Nota" value={form.note} onChangeText={(value) => setForm((current) => ({ ...current, note: value }))} placeholder="Detalle opcional" multiline />
        <ActionButton label="Guardar movimiento" icon="save-outline" onPress={saveMovement} />
      </AppModal>
    </>
  );
}
