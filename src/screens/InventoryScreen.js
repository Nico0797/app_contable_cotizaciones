import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Badge, Button, EmptyState, Field, ListRow, Screen, SectionTitle } from '../components/UI';
import { createInventoryItem, createInventoryMovement } from '../db/repository';
import { money, movementLabel, shortDate } from '../utils/format';

export function InventoryScreen({ snapshot, onDataChanged }) {
  const items = useMemo(() => snapshot.inventoryItems || [], [snapshot.inventoryItems]);
  const movements = useMemo(() => snapshot.inventoryMovements || [], [snapshot.inventoryMovements]);
  const inventoryValue = items.reduce((sum, item) => sum + Number(item.inventory_value || 0), 0);
  const lowStockItems = items.filter((item) => Number(item.low_stock) === 1).length;

  const [itemForm, setItemForm] = useState({
    name: '',
    unit: 'unidad',
    current_stock: '',
    min_stock: '',
    unit_cost: '',
    supplier: '',
  });
  const [movementForm, setMovementForm] = useState({
    item_id: '',
    movement_type: 'in',
    qty: '',
    unit_cost: '',
    movement_date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const saveItem = async () => {
    try {
      await createInventoryItem(itemForm);
      setItemForm({
        name: '',
        unit: 'unidad',
        current_stock: '',
        min_stock: '',
        unit_cost: '',
        supplier: '',
      });
      await onDataChanged();
      Alert.alert('Listo', 'Insumo creado correctamente.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el insumo.');
    }
  };

  const saveMovement = async () => {
    try {
      await createInventoryMovement(movementForm);
      setMovementForm((current) => ({
        ...current,
        qty: '',
        unit_cost: '',
        note: '',
        movement_date: new Date().toISOString().slice(0, 10),
      }));
      await onDataChanged();
      Alert.alert('Listo', 'Movimiento de inventario registrado.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo registrar el movimiento.');
    }
  };

  return (
    <Screen
      title="Inventario"
      subtitle="Control profesional de insumos, stock, costo unitario y alertas."
    >
      <SectionTitle title="Resumen" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <ListRow title="Total de insumos" subtitle={String(items.length)} />
        <ListRow title="Valor estimado" subtitle={money(inventoryValue)} />
        <ListRow title="Bajo stock" subtitle={String(lowStockItems)} />
      </View>

      <SectionTitle title="Nuevo insumo" />
      <Field label="Nombre" value={itemForm.name} onChangeText={(value) => setItemForm((current) => ({ ...current, name: value }))} placeholder="Nombre del insumo" />
      <Field label="Unidad" value={itemForm.unit} onChangeText={(value) => setItemForm((current) => ({ ...current, unit: value }))} placeholder="ml, litro, kilo, unidad..." />
      <Field label="Stock inicial" value={itemForm.current_stock} onChangeText={(value) => setItemForm((current) => ({ ...current, current_stock: value }))} placeholder="0" keyboardType="numeric" />
      <Field label="Stock mínimo" value={itemForm.min_stock} onChangeText={(value) => setItemForm((current) => ({ ...current, min_stock: value }))} placeholder="0" keyboardType="numeric" />
      <Field label="Costo unitario" value={itemForm.unit_cost} onChangeText={(value) => setItemForm((current) => ({ ...current, unit_cost: value }))} placeholder="0" keyboardType="numeric" />
      <Field label="Proveedor" value={itemForm.supplier} onChangeText={(value) => setItemForm((current) => ({ ...current, supplier: value }))} placeholder="Proveedor opcional" />
      <Button label="Guardar insumo" onPress={saveItem} icon="cube-outline" />

      <SectionTitle title="Registrar movimiento" subtitle="Para elegir insumo usa su ID del listado." />
      <Field label="ID del insumo" value={movementForm.item_id} onChangeText={(value) => setMovementForm((current) => ({ ...current, item_id: value }))} placeholder="ID del insumo" keyboardType="numeric" />
      <Field label="Tipo" value={movementForm.movement_type} onChangeText={(value) => setMovementForm((current) => ({ ...current, movement_type: value }))} placeholder="in, out o adjustment" />
      <Field label="Cantidad" value={movementForm.qty} onChangeText={(value) => setMovementForm((current) => ({ ...current, qty: value }))} placeholder="0" keyboardType="numeric" />
      <Field label="Costo unitario" value={movementForm.unit_cost} onChangeText={(value) => setMovementForm((current) => ({ ...current, unit_cost: value }))} placeholder="Opcional" keyboardType="numeric" />
      <Field label="Fecha" value={movementForm.movement_date} onChangeText={(value) => setMovementForm((current) => ({ ...current, movement_date: value }))} placeholder="YYYY-MM-DD" />
      <Field label="Nota" value={movementForm.note} onChangeText={(value) => setMovementForm((current) => ({ ...current, note: value }))} placeholder="Detalle del movimiento" />
      <Button label="Guardar movimiento" onPress={saveMovement} icon="swap-horizontal-outline" />

      <SectionTitle title="Inventario actual" />
      {items.length === 0 ? (
        <EmptyState title="Sin insumos" message="Agrega el primero para comenzar a controlar inventario." />
      ) : (
        items.map((item) => (
          <ListRow
            key={item.id}
            title={`${item.id}. ${item.name}`}
            subtitle={`${item.current_stock} ${item.unit} · ${money(item.unit_cost)} c/u`}
            trailing={<Badge label={item.low_stock ? 'Bajo stock' : 'OK'} tone={item.low_stock ? 'warning' : 'success'} />}
            footer={<Text style={{ color: '#64748b', fontSize: 12 }}>Valor estimado: {money(item.inventory_value)}</Text>}
          />
        ))
      )}

      <SectionTitle title="Últimos movimientos" />
      {movements.length === 0 ? (
        <EmptyState title="Sin movimientos" message="Aquí aparecerán entradas, salidas y ajustes." />
      ) : (
        movements.map((movement) => (
          <ListRow
            key={movement.id}
            title={`${movement.item_name} · ${movementLabel(movement.movement_type)}`}
            subtitle={`${movement.qty} ${movement.item_unit} · ${shortDate(movement.movement_date)}`}
            footer={<Text style={{ color: '#64748b', fontSize: 12 }}>{movement.note || 'Sin nota'}</Text>}
          />
        ))
      )}
    </Screen>
  );
}
