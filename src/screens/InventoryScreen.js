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
import { createInventoryItem, createInventoryMovement } from '../db/repository';
import { money, movementLabel, shortDate } from '../utils/format';

const ITEM_INITIAL = {
  name: '',
  unit: 'unidad',
  current_stock: '',
  min_stock: '',
  unit_cost: '',
  supplier: '',
};

const MOVEMENT_INITIAL = {
  item_id: '',
  movement_type: 'in',
  qty: '',
  unit_cost: '',
  movement_date: new Date().toISOString().slice(0, 10),
  note: '',
};

export function InventoryScreen({ snapshot, onDataChanged, command }) {
  const items = useMemo(() => snapshot.inventoryItems || [], [snapshot.inventoryItems]);
  const movements = useMemo(() => snapshot.inventoryMovements || [], [snapshot.inventoryMovements]);
  const inventoryValue = items.reduce((sum, item) => sum + Number(item.inventory_value || 0), 0);
  const lowStockItems = items.filter((item) => Number(item.low_stock) === 1).length;

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [itemForm, setItemForm] = useState(ITEM_INITIAL);
  const [movementForm, setMovementForm] = useState(MOVEMENT_INITIAL);

  useEffect(() => {
    if (command?.route === 'inventory' && command?.action === 'create-item') {
      setItemModalVisible(true);
    }
  }, [command]);

  const saveItem = async () => {
    try {
      await createInventoryItem(itemForm);
      setItemForm(ITEM_INITIAL);
      setItemModalVisible(false);
      await onDataChanged();
      Alert.alert('Listo', 'Insumo creado correctamente.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el insumo.');
    }
  };

  const openMovement = (movementType) => {
    setMovementForm({
      ...MOVEMENT_INITIAL,
      movement_type: movementType,
      movement_date: new Date().toISOString().slice(0, 10),
    });
    setMovementModalVisible(true);
  };

  const saveMovement = async () => {
    try {
      await createInventoryMovement(movementForm);
      setMovementForm(MOVEMENT_INITIAL);
      setMovementModalVisible(false);
      await onDataChanged();
      Alert.alert('Listo', 'Movimiento de inventario registrado.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo registrar el movimiento.');
    }
  };

  return (
    <>
      <Screen
        title="Inventario"
        subtitle="Insumos, bajo stock, costo unitario y movimientos recientes."
        floatingAction={<FloatingButton label="Nuevo insumo" icon="add" onPress={() => setItemModalVisible(true)} />}
      >
        <View style={uiStyles.rowWrap}>
          <MetricCard label="Valor inventario" value={money(inventoryValue)} />
          <MetricCard label="Insumos activos" value={String(items.length)} />
          <MetricCard label="Bajo stock" value={String(lowStockItems)} tone="warning" />
          <MetricCard label="Movimientos" value={String(movements.length)} />
        </View>

        <SectionTitle title="Acciones" subtitle="Abre modales cortos segun la tarea." />
        <View style={uiStyles.rowWrap}>
          <View style={{ flex: 1, minWidth: 145 }}>
            <ActionButton label="Nuevo insumo" icon="cube-outline" onPress={() => setItemModalVisible(true)} />
          </View>
          <View style={{ flex: 1, minWidth: 145 }}>
            <ActionButton label="Entrada" icon="arrow-down-circle-outline" onPress={() => openMovement('in')} tone="success" />
          </View>
          <View style={{ flex: 1, minWidth: 145 }}>
            <ActionButton label="Salida" icon="arrow-up-circle-outline" onPress={() => openMovement('out')} tone="warning" />
          </View>
          <View style={{ flex: 1, minWidth: 145 }}>
            <ActionButton label="Ajuste" icon="options-outline" onPress={() => openMovement('adjustment')} tone="secondary" />
          </View>
        </View>

        <SectionTitle title="Insumos" subtitle="Nombre, stock actual, unidad y estado." />
        {items.length === 0 ? (
          <EmptyState title="Sin insumos" message="Agrega el primero para comenzar a controlar inventario." />
        ) : (
          <View style={{ gap: 12 }}>
            {items.map((item) => (
              <ListRow
                key={item.id}
                title={item.name}
                subtitle={`${item.current_stock} ${item.unit} · ${money(item.unit_cost)} c/u`}
                trailing={<StatusChip label={item.low_stock ? 'Bajo stock' : 'OK'} tone={item.low_stock ? 'warning' : 'success'} />}
                footer={<Text style={{ color: '#93a8c7', fontSize: 12 }}>Valor: {money(item.inventory_value)} · ID {item.id}</Text>}
              />
            ))}
          </View>
        )}

        <SectionTitle title="Ultimos movimientos" subtitle="Solo lo mas reciente para no hacer scroll infinito." />
        {movements.length === 0 ? (
          <EmptyState title="Sin movimientos" message="Aqui apareceran entradas, salidas y ajustes." />
        ) : (
          <View style={{ gap: 12 }}>
            {movements.slice(0, 6).map((movement) => (
              <ListRow
                key={movement.id}
                title={`${movement.item_name} · ${movementLabel(movement.movement_type)}`}
                subtitle={`${movement.qty} ${movement.item_unit} · ${shortDate(movement.movement_date)}`}
                trailing={<StatusChip label={movement.movement_type.toUpperCase()} tone={movement.movement_type === 'out' ? 'warning' : movement.movement_type === 'adjustment' ? 'info' : 'success'} />}
                footer={<Text style={{ color: '#93a8c7', fontSize: 12 }}>{movement.note || 'Sin nota'}</Text>}
              />
            ))}
          </View>
        )}
      </Screen>

      <AppModal
        visible={itemModalVisible}
        title="Nuevo insumo"
        subtitle="Formulario corto para agregar materias primas o insumos."
        onClose={() => setItemModalVisible(false)}
      >
        <AppInput label="Nombre" value={itemForm.name} onChangeText={(value) => setItemForm((current) => ({ ...current, name: value }))} placeholder="Nombre del insumo" />
        <AppInput label="Unidad" value={itemForm.unit} onChangeText={(value) => setItemForm((current) => ({ ...current, unit: value }))} placeholder="ml, litro, kilo, unidad..." />
        <AppInput label="Stock inicial" value={itemForm.current_stock} onChangeText={(value) => setItemForm((current) => ({ ...current, current_stock: value }))} placeholder="0" keyboardType="numeric" />
        <AppInput label="Stock minimo" value={itemForm.min_stock} onChangeText={(value) => setItemForm((current) => ({ ...current, min_stock: value }))} placeholder="0" keyboardType="numeric" />
        <AppInput label="Costo unitario" value={itemForm.unit_cost} onChangeText={(value) => setItemForm((current) => ({ ...current, unit_cost: value }))} placeholder="0" keyboardType="numeric" />
        <AppInput label="Proveedor" value={itemForm.supplier} onChangeText={(value) => setItemForm((current) => ({ ...current, supplier: value }))} placeholder="Proveedor opcional" />
        <ActionButton label="Guardar insumo" icon="save-outline" onPress={saveItem} />
      </AppModal>

      <AppModal
        visible={movementModalVisible}
        title="Movimiento de inventario"
        subtitle="Entrada, salida o ajuste en un solo flujo corto."
        onClose={() => setMovementModalVisible(false)}
      >
        <AppInput label="ID del insumo" value={movementForm.item_id} onChangeText={(value) => setMovementForm((current) => ({ ...current, item_id: value }))} placeholder="Usa el ID del listado" keyboardType="numeric" />
        <AppInput label="Tipo" value={movementForm.movement_type} onChangeText={(value) => setMovementForm((current) => ({ ...current, movement_type: value }))} placeholder="in, out o adjustment" />
        <AppInput label="Cantidad" value={movementForm.qty} onChangeText={(value) => setMovementForm((current) => ({ ...current, qty: value }))} placeholder="0" keyboardType="numeric" />
        <AppInput label="Costo unitario" value={movementForm.unit_cost} onChangeText={(value) => setMovementForm((current) => ({ ...current, unit_cost: value }))} placeholder="Opcional" keyboardType="numeric" />
        <AppInput label="Fecha" value={movementForm.movement_date} onChangeText={(value) => setMovementForm((current) => ({ ...current, movement_date: value }))} placeholder="YYYY-MM-DD" />
        <AppInput label="Nota" value={movementForm.note} onChangeText={(value) => setMovementForm((current) => ({ ...current, note: value }))} placeholder="Detalle del movimiento" multiline />
        <ActionButton label="Guardar movimiento" icon="save-outline" onPress={saveMovement} />
      </AppModal>
    </>
  );
}
