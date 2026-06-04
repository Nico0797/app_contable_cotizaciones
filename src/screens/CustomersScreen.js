import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
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
import { createCustomer } from '../db/repository';
import { money } from '../utils/format';

export function CustomersScreen({ snapshot, onDataChanged, navigate, command }) {
  const customers = useMemo(() => snapshot.customers || [], [snapshot.customers]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    if (command?.route === 'customers' && command?.action === 'create') {
      setModalVisible(true);
    }
  }, [command]);

  const saveCustomer = async () => {
    try {
      await createCustomer(form);
      setForm({ name: '', phone: '', address: '' });
      setModalVisible(false);
      await onDataChanged();
      Alert.alert('Listo', 'Cliente creado correctamente.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo crear el cliente.');
    }
  };

  const customersWithDebt = customers.filter((customer) => Number(customer.pending_balance || 0) > 0);

  return (
    <>
      <Screen
        title="Clientes"
        subtitle="Tarjetas compactas para telefono, saldo y acciones utiles."
        floatingAction={<FloatingButton label="Nuevo" icon="person-add-outline" onPress={() => setModalVisible(true)} />}
      >
        <View style={uiStyles.rowWrap}>
          <MetricCard label="Clientes" value={String(customers.length)} />
          <MetricCard label="Con saldo" value={String(customersWithDebt.length)} tone="warning" />
        </View>

        <SectionTitle title="Listado" subtitle="Ver detalle rapido y pasar a cartera si deben." />
        {customers.length === 0 ? (
          <EmptyState
            title="Aun no hay clientes"
            message="Crea el primero para asociarlo a cotizaciones y ventas pendientes."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {customers.map((customer) => {
              const debt = Number(customer.pending_balance || 0);
              return (
                <ListRow
                  key={customer.id}
                  title={customer.name}
                  subtitle={customer.phone || 'Sin telefono registrado'}
                  trailing={<StatusChip label={debt > 0 ? 'Debe' : 'Al dia'} tone={debt > 0 ? 'warning' : 'success'} />}
                  footer={
                    <View style={{ gap: 10 }}>
                      <View>
                        <StatusChip label={`Saldo: ${money(debt)}`} tone={debt > 0 ? 'warning' : 'info'} />
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        <ActionButton label="Ver detalle" icon="eye-outline" onPress={() => {}} tone="secondary" compact />
                        {debt > 0 ? (
                          <ActionButton
                            label="Registrar pago"
                            icon="cash-outline"
                            onPress={() => navigate('ledger', 'create-payment', { customerId: String(customer.id) })}
                            tone="warning"
                            compact
                          />
                        ) : null}
                      </View>
                    </View>
                  }
                />
              );
            })}
          </View>
        )}
      </Screen>

      <AppModal
        visible={modalVisible}
        title="Nuevo cliente"
        subtitle="Formulario corto para uso diario."
        onClose={() => setModalVisible(false)}
      >
        <AppInput label="Nombre" value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Nombre del cliente" />
        <AppInput label="Telefono" value={form.phone} onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))} placeholder="3001234567" keyboardType="phone-pad" />
        <AppInput label="Direccion" value={form.address} onChangeText={(value) => setForm((current) => ({ ...current, address: value }))} placeholder="Direccion o referencia" />
        <ActionButton label="Guardar cliente" icon="save-outline" onPress={saveCustomer} />
      </AppModal>
    </>
  );
}
