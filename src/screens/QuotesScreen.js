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
import { confirmQuoteAsSale, createQuote, getQuoteDetail, rejectQuote } from '../db/repository';
import { money, shortDate } from '../utils/format';
import { theme } from '../theme';

const EMPTY_ITEM = { description: '', qty: '1', unit_price: '' };

export function QuotesScreen({ snapshot, onDataChanged, navigate, command }) {
  const customers = useMemo(() => snapshot.customers || [], [snapshot.customers]);
  const quotes = useMemo(() => snapshot.quotes || [], [snapshot.quotes]);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailQuote, setDetailQuote] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [discount, setDiscount] = useState('0');
  const [itemDraft, setItemDraft] = useState(EMPTY_ITEM);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (command?.route === 'quotes' && command?.action === 'create') {
      setWizardVisible(true);
      setStep(1);
    }
  }, [command]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const pendingCount = quotes.filter((quote) => quote.status === 'draft').length;
  const convertedCount = quotes.filter((quote) => quote.status === 'converted').length;
  const totalQuoted = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);

  const resetWizard = () => {
    setStep(1);
    setSelectedCustomerId('');
    setManualCustomerName('');
    setQuoteDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setDiscount('0');
    setItemDraft(EMPTY_ITEM);
    setItems([]);
  };

  const addItem = () => {
    const description = itemDraft.description.trim();
    const qty = Number(itemDraft.qty || 0);
    const unitPrice = Number(itemDraft.unit_price || 0);
    if (!description || qty <= 0 || unitPrice < 0) {
      Alert.alert('Revisa', 'Cada item necesita descripcion, cantidad y precio validos.');
      return;
    }
    setItems((current) => [
      ...current,
      { description, qty, unit_price: unitPrice, total: qty * unitPrice },
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
      resetWizard();
      setWizardVisible(false);
      await onDataChanged();
      Alert.alert('Listo', 'Cotizacion guardada como borrador.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo guardar la cotizacion.');
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
    Alert.alert('Confirmar cotizacion', 'La venta quedo pagada o pendiente?', [
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
            Alert.alert('Listo', 'Cotizacion convertida en venta pendiente.');
          } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo confirmar la cotizacion.');
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
            Alert.alert('Listo', 'Cotizacion convertida en venta pagada.');
          } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo confirmar la cotizacion.');
          }
        },
      },
    ]);
  };

  const rejectCurrentQuote = async (quoteId) => {
    try {
      await rejectQuote(quoteId);
      await onDataChanged();
      Alert.alert('Listo', 'Cotizacion rechazada.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'No se pudo rechazar la cotizacion.');
    }
  };

  return (
    <>
      <Screen
        title="Cotizaciones"
        subtitle="Lista limpia, resumen corto y formulario por pasos en modal."
        floatingAction={<FloatingButton label="Nueva cotiz." icon="add" onPress={() => setWizardVisible(true)} />}
      >
        <View style={uiStyles.rowWrap}>
          <MetricCard label="Pendientes" value={String(pendingCount)} tone="warning" />
          <MetricCard label="Convertidas" value={String(convertedCount)} tone="success" />
          <MetricCard label="Total cotizado" value={money(totalQuoted)} />
        </View>

        <SectionTitle title="Historial" subtitle="Draft, converted y rejected con acciones claras." />
        {quotes.length === 0 ? (
          <EmptyState title="Sin cotizaciones" message="Crea la primera para activar el flujo comercial." />
        ) : (
          <View style={{ gap: 12 }}>
            {quotes.map((quote) => (
              <ListRow
                key={quote.id}
                title={`${quote.quote_number} · ${quote.customer_name || 'Sin cliente'}`}
                subtitle={`${shortDate(quote.quote_date)} · ${money(quote.total)}`}
                trailing={
                  <StatusChip
                    label={quote.status}
                    tone={quote.status === 'converted' ? 'success' : quote.status === 'rejected' ? 'danger' : 'warning'}
                  />
                }
                footer={
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <ActionButton label="Ver" icon="eye-outline" onPress={() => openDetail(quote.id)} tone="secondary" compact />
                      {quote.status === 'draft' ? (
                        <>
                          <ActionButton label="Confirmar venta" icon="sparkles-outline" onPress={() => confirmQuote(quote)} compact />
                          <ActionButton label="Rechazar" icon="close-circle-outline" onPress={() => rejectCurrentQuote(quote.id)} tone="warning" compact />
                        </>
                      ) : null}
                    </View>
                  </View>
                }
              />
            ))}
          </View>
        )}
      </Screen>

      <AppModal
        visible={wizardVisible}
        title="Nueva cotizacion"
        subtitle={`Paso ${step} de 3`}
        onClose={() => {
          setWizardVisible(false);
          resetWizard();
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3].map((index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: theme.radius.pill,
                backgroundColor: index <= step ? theme.colors.primary : 'rgba(148,163,184,0.18)',
              }}
            />
          ))}
        </View>

        {step === 1 ? (
          <View style={{ gap: 12 }}>
            <SectionTitle title="Cliente y nota" subtitle="Elige cliente existente o usa nombre manual." />
            <AppInput label="Fecha" value={quoteDate} onChangeText={setQuoteDate} placeholder="YYYY-MM-DD" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {customers.map((customer) => {
                const active = selectedCustomerId === String(customer.id);
                return (
                  <ActionButton
                    key={customer.id}
                    label={customer.name}
                    onPress={() => setSelectedCustomerId(active ? '' : String(customer.id))}
                    tone={active ? 'primary' : 'secondary'}
                    compact
                  />
                );
              })}
            </View>
            <AppInput label="Nombre manual" value={manualCustomerName} onChangeText={setManualCustomerName} placeholder="Si no eliges cliente, escribe el nombre aqui" />
            <AppInput label="Nota" value={note} onChangeText={setNote} placeholder="Observaciones" multiline />
            <ActionButton label="Siguiente" icon="arrow-forward-outline" onPress={() => setStep(2)} />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: 12 }}>
            <SectionTitle title="Items" subtitle="Agrega varios conceptos en tarjetas compactas." />
            <AppInput label="Descripcion" value={itemDraft.description} onChangeText={(value) => setItemDraft((current) => ({ ...current, description: value }))} placeholder="Servicio, pedido o concepto" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppInput label="Cantidad" value={itemDraft.qty} onChangeText={(value) => setItemDraft((current) => ({ ...current, qty: value }))} placeholder="1" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Precio unitario" value={itemDraft.unit_price} onChangeText={(value) => setItemDraft((current) => ({ ...current, unit_price: value }))} placeholder="0" keyboardType="numeric" />
              </View>
            </View>
            <ActionButton label="Agregar item" icon="add-outline" onPress={addItem} tone="success" />

            {items.length === 0 ? (
              <EmptyState title="Sin items" message="Agrega al menos un item para continuar." />
            ) : (
              items.map((item, index) => (
                <ListRow
                  key={`${item.description}-${index}`}
                  title={item.description}
                  subtitle={`${item.qty} x ${money(item.unit_price)}`}
                  trailing={<Text style={{ color: theme.colors.textStrong, fontSize: 15, fontWeight: '900' }}>{money(item.total)}</Text>}
                  footer={
                    <ActionButton
                      label="Eliminar"
                      icon="trash-outline"
                      onPress={() => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                      tone="secondary"
                      compact
                    />
                  }
                />
              ))
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ActionButton label="Volver" icon="arrow-back-outline" onPress={() => setStep(1)} tone="secondary" />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton label="Siguiente" icon="arrow-forward-outline" onPress={() => setStep(3)} />
              </View>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={{ gap: 12 }}>
            <SectionTitle title="Confirmar total" subtitle="Revisa resumen y guarda el borrador." />
            <AppInput label="Descuento" value={discount} onChangeText={setDiscount} placeholder="0" keyboardType="numeric" />
            <ListRow title={`Subtotal: ${money(subtotal)}`} subtitle={`Total final: ${money(total)}`} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ActionButton label="Volver" icon="arrow-back-outline" onPress={() => setStep(2)} tone="secondary" />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton label="Guardar" icon="save-outline" onPress={saveQuote} />
              </View>
            </View>
          </View>
        ) : null}
      </AppModal>

      <AppModal
        visible={detailVisible}
        title={detailQuote?.quote_number || 'Detalle'}
        subtitle="Resumen compacto de la cotizacion."
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
                trailing={<Text style={{ color: theme.colors.textStrong, fontSize: 15, fontWeight: '900' }}>{money(item.total)}</Text>}
              />
            ))}
            <ListRow
              title={`Subtotal: ${money(detailQuote.subtotal)}`}
              subtitle={`Descuento: ${money(detailQuote.discount)} · Total: ${money(detailQuote.total)}`}
            />
          </View>
        ) : null}
      </AppModal>
    </>
  );
}
