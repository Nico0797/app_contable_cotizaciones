import React, { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Badge, Button, EmptyState, Field, ListRow, Screen, SectionTitle } from '../components/UI';
import { createManualTransaction } from '../db/repository';
import { money, shortDate } from '../utils/format';

export function MovementsScreen({ snapshot, onDataChanged }) {
  const transactions = useMemo(() => snapshot.transactions || [], [snapshot.transactions]);
  const [form, setForm] = useState({
    kind: 'expense',
    amount: '',
    tx_date: new Date().toISOString().slice(0, 10),
    category: '',
    note: '',
  });

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
      await onDataChanged();
      Alert.alert('Listo', 'Movimiento registrado correctamente.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el movimiento.');
    }
  };

  return (
    <Screen
      title="Movimientos"
      subtitle="Ingresos y gastos manuales independientes de la confirmación de cotizaciones."
    >
      <SectionTitle title="Nuevo movimiento" />
      <Field
        label="Tipo"
        value={form.kind}
        onChangeText={(value) => setForm((current) => ({ ...current, kind: value }))}
        placeholder="income o expense"
      />
      <Field
        label="Monto"
        value={form.amount}
        onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))}
        placeholder="0"
        keyboardType="numeric"
      />
      <Field
        label="Fecha"
        value={form.tx_date}
        onChangeText={(value) => setForm((current) => ({ ...current, tx_date: value }))}
        placeholder="YYYY-MM-DD"
      />
      <Field
        label="Categoría"
        value={form.category}
        onChangeText={(value) => setForm((current) => ({ ...current, category: value }))}
        placeholder="Ej. Arriendo, nómina, caja menor"
      />
      <Field
        label="Nota"
        value={form.note}
        onChangeText={(value) => setForm((current) => ({ ...current, note: value }))}
        placeholder="Detalle opcional"
      />
      <Button label="Guardar movimiento" onPress={saveMovement} icon="save-outline" />

      <SectionTitle title="Historial" />
      {transactions.length === 0 ? (
        <EmptyState title="Sin movimientos" message="Los ingresos y gastos aparecerán aquí." />
      ) : (
        transactions.map((tx) => (
          <ListRow
            key={tx.id}
            title={`${money(tx.amount)} · ${tx.category}`}
            subtitle={`${shortDate(tx.tx_date)} · ${tx.note || 'Sin nota'}`}
            trailing={<Badge label={tx.kind === 'income' ? 'Ingreso' : 'Gasto'} tone={tx.kind === 'income' ? 'success' : 'danger'} />}
            footer={<Text style={{ color: '#64748b', fontSize: 12 }}>Referencia: {tx.ref_type || 'manual'}</Text>}
          />
        ))
      )}
    </Screen>
  );
}
