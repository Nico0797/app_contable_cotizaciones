import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Badge, Button, EmptyState, Field, ListRow, Screen, SectionTitle, SheetModal } from '../components/UI';
import { confirmQuoteAsSale, createQuote, getQuoteDetail, rejectQuote } from '../db/repository';
import { money, shortDate } from '../utils/format';

const EMPTY_ITEM = { description: '', qty: '1', unit_price: '' };

export function QuotesScreen({ snapshot, onDataChanged, openTab }) {
  const customers = useMemo(() => snapshot.customers || [], [snapshot.customers]);
  const quotes = useMemo(() => snapshot.quotes || [], [snapshot.quotes]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [discount, setDiscount] = useState('0');
  const [itemDraft, setItemDraft] = useState(EMPTY_ITEM);
  const [items, setItems] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailQuote, setDetailQuote] = useState(null);

  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  const addItem = () => {
    const description = itemDraft.description.trim();
    const qty = Number(itemDraft.qty || 0);
    const unitPrice = Number(itemDraft.unit_price || 0);
    if (!description || qty <= 0 || unitPrice < 0) {
      Alert.alert('Revisa', 'Cada ítem necesita descripción, cantidad y precio válidos.');
      return;
    }
    setItems((current) => [
      ...current,
      {
        description,
        qty,
        unit_price: unitPrice,
        total: qty * unitPrice,
      },
    ]);
    setItemDraft(EMPTY_ITEM);
  };

  const saveQuote = async () => {
    try {
      await createQuote({
        customer_id: selectedCustomerId || null,
        customer_name: manualCustomerName,
        quote_date: quoteDate,
        note,
        discount,
        items,
      });
      setSelectedCustomerId('');
      setManualCustomerName('');
      setQuoteDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setDiscount('0');
      setItemDraft(EMPTY_ITEM);
      setItems([]);
      await onDataChanged();
      Alert.alert('Listo', 'Cotización guardada como borrador.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo guardar la cotización.');
    }
  };

  const openDetail = async (quoteId) => {
    try {
      const detail = await getQuoteDetail(quoteId);
      setDetailQuote(detail);
      setDetailVisible(true);
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo cargar el detalle.');
    }
  };

  const confirmQuote = (quote) => {
    Alert.alert('Confirmar cotización', '¿La venta quedó pagada o pendiente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Pendiente',
        onPress: async () => {
          try {
            await confirmQuoteAsSale(quote.id, {
              paid: false,
              sale_date: new Date().toISOString().slice(0, 10),
            });
            await onDataChanged('sales');
            openTab('sales');
            Alert.alert('Listo', 'Cotización confirmada como venta pendiente.');
          } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo confirmar la cotización.');
          }
        },
      },
      {
        text: 'Pagada',
        onPress: async () => {
          try {
            await confirmQuoteAsSale(quote.id, {
              paid: true,
              sale_date: new Date().toISOString().slice(0, 10),
            });
            await onDataChanged('sales');
            openTab('sales');
            Alert.alert('Listo', 'Cotización confirmada como venta pagada.');
          } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo confirmar la cotización.');
          }
        },
      },
    ]);
  };

  const rejectCurrentQuote = async (quoteId) => {
    try {
      await rejectQuote(quoteId);
      await onDataChanged();
      Alert.alert('Listo', 'Cotización marcada como rechazada.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo rechazar la cotización.');
    }
  };

  return (
    <>
      <Screen
        title="Cotizaciones"
        subtitle="Flujo principal: crear, confirmar y convertir en venta."
      >
        <SectionTitle title="Nueva cotización" />
        <Field
          label="Fecha"
          value={quoteDate}
          onChangeText={setQuoteDate}
          placeholder="YYYY-MM-DD"
        />

        <SectionTitle title="Cliente existente" subtitle="Opcional. Toca un chip para elegir." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {customers.map((customer) => {
            const active = selectedCustomerId === String(customer.id);
            return (
              <Pressable
                key={customer.id}
                onPress={() => setSelectedCustomerId(active ? '' : String(customer.id))}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? '#2563eb' : '#ffffff',
                  borderWidth: 1,
                  borderColor: active ? '#2563eb' : '#cbd5e1',
                }}
              >
                <Text style={{ color: active ? '#ffffff' : '#0f172a', fontWeight: '800', fontSize: 12 }}>
                  {customer.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Nombre manual"
          value={manualCustomerName}
          onChangeText={setManualCustomerName}
          placeholder="Si no eliges cliente, escribe el nombre manualmente"
        />
        <Field label="Nota" value={note} onChangeText={setNote} placeholder="Observaciones" multiline />

        <SectionTitle title="Agregar ítems" />
        <Field
          label="Descripción"
          value={itemDraft.description}
          onChangeText={(value) => setItemDraft((current) => ({ ...current, description: value }))}
          placeholder="Descripción del servicio o concepto"
        />
        <Field
          label="Cantidad"
          value={itemDraft.qty}
          onChangeText={(value) => setItemDraft((current) => ({ ...current, qty: value }))}
          placeholder="1"
          keyboardType="numeric"
        />
        <Field
          label="Precio unitario"
          value={itemDraft.unit_price}
          onChangeText={(value) => setItemDraft((current) => ({ ...current, unit_price: value }))}
          placeholder="0"
          keyboardType="numeric"
        />
        <Button label="Agregar ítem" onPress={addItem} icon="add-outline" />

        {items.map((item, index) => (
          <ListRow
            key={`${item.description}-${index}`}
            title={item.description}
            subtitle={`${item.qty} x ${money(item.unit_price)}`}
            trailing={<Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '900' }}>{money(item.total)}</Text>}
            footer={
              <Button
                label="Eliminar ítem"
                onPress={() => setItems((current) => current.filter((_, i) => i !== index))}
                variant="secondary"
                icon="trash-outline"
              />
            }
          />
        ))}

        <Field
          label="Descuento"
          value={discount}
          onChangeText={setDiscount}
          placeholder="0"
          keyboardType="numeric"
        />

        <ListRow
          title={`Subtotal: ${money(subtotal)}`}
          subtitle={`Total final: ${money(total)}`}
          footer={<Button label="Guardar cotización" onPress={saveQuote} icon="save-outline" />}
        />

        <SectionTitle title="Historial" subtitle="Estados draft, converted y rejected." />
        {quotes.length === 0 ? (
          <EmptyState title="Sin cotizaciones" message="Crea la primera cotización para iniciar el flujo." />
        ) : (
          quotes.map((quote) => (
            <ListRow
              key={quote.id}
              title={`${quote.quote_number} · ${quote.customer_name || 'Sin cliente'}`}
              subtitle={`${shortDate(quote.quote_date)} · ${money(quote.total)}`}
              trailing={
                <Badge
                  label={quote.status}
                  tone={quote.status === 'converted' ? 'success' : quote.status === 'rejected' ? 'danger' : 'info'}
                />
              }
              footer={
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Button label="Ver" onPress={() => openDetail(quote.id)} variant="secondary" />
                  {quote.status === 'draft' ? (
                    <>
                      <Button label="Confirmar" onPress={() => confirmQuote(quote)} />
                      <Button label="Rechazar" onPress={() => rejectCurrentQuote(quote.id)} variant="danger" />
                    </>
                  ) : null}
                </View>
              }
            />
          ))
        )}
      </Screen>

      <SheetModal
        visible={detailVisible}
        title={detailQuote?.quote_number || 'Detalle'}
        onClose={() => setDetailVisible(false)}
      >
        {detailQuote ? (
          <View style={{ gap: 12 }}>
            <ListRow
              title={detailQuote.customer_name || 'Sin cliente'}
              subtitle={`${shortDate(detailQuote.quote_date)} · ${detailQuote.status}`}
            />
            {detailQuote.items.map((item) => (
              <ListRow
                key={item.id}
                title={item.description}
                subtitle={`${item.qty} x ${money(item.unit_price)}`}
                trailing={<Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '900' }}>{money(item.total)}</Text>}
              />
            ))}
            <ListRow
              title={`Subtotal: ${money(detailQuote.subtotal)}`}
              subtitle={`Descuento: ${money(detailQuote.discount)} · Total: ${money(detailQuote.total)}`}
            />
          </View>
        ) : null}
      </SheetModal>
    </>
  );
}
