import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Button, EmptyState, Field, ListRow, Screen, SectionTitle } from '../components/UI';
import { createCustomer } from '../db/repository';
import { money } from '../utils/format';

export function CustomersScreen({ snapshot, onDataChanged }) {
  const customers = useMemo(() => snapshot.customers || [], [snapshot.customers]);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const saveCustomer = async () => {
    try {
      await createCustomer(form);
      setForm({ name: '', phone: '', address: '' });
      await onDataChanged();
      Alert.alert('Listo', 'Cliente creado correctamente.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo crear el cliente.');
    }
  };

  return (
    <Screen
      title="Clientes"
      subtitle="Crea clientes y personas para usarlos en cotizaciones y cartera."
    >
      <SectionTitle title="Nuevo cliente" />
      <Field
        label="Nombre"
        value={form.name}
        onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        placeholder="Nombre del cliente"
      />
      <Field
        label="Teléfono"
        value={form.phone}
        onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
        placeholder="3001234567"
        keyboardType="phone-pad"
      />
      <Field
        label="Dirección"
        value={form.address}
        onChangeText={(value) => setForm((current) => ({ ...current, address: value }))}
        placeholder="Dirección o referencia"
      />
      <Button label="Guardar cliente" onPress={saveCustomer} icon="person-add-outline" />

      <SectionTitle title="Listado" subtitle="Nombre, teléfono y saldo pendiente." />
      {customers.length === 0 ? (
        <EmptyState
          title="Aún no hay clientes"
          message="Crea el primero para asociarlo a una cotización o a una venta pendiente."
        />
      ) : (
        customers.map((customer) => (
          <ListRow
            key={customer.id}
            title={`${customer.id}. ${customer.name}`}
            subtitle={`${customer.phone || 'Sin teléfono'}${customer.address ? ` · ${customer.address}` : ''}`}
            footer={<SectionTitle title={`Saldo pendiente: ${money(customer.pending_balance || 0)}`} />}
          />
        ))
      )}
    </Screen>
  );
}
