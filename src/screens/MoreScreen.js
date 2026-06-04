import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, SectionTitle, StatusChip } from '../components/UI';
import { theme } from '../theme';

const LINKS = [
  {
    key: 'customers',
    label: 'Clientes',
    description: 'Gestiona clientes, telefono y saldo pendiente.',
    icon: 'people-outline',
  },
  {
    key: 'movements',
    label: 'Movimientos',
    description: 'Registra ingresos y gastos manuales.',
    icon: 'swap-horizontal-outline',
  },
  {
    key: 'ledger',
    label: 'Cartera',
    description: 'Controla ventas pendientes y abonos.',
    icon: 'wallet-outline',
  },
  {
    key: 'settings',
    label: 'Respaldo',
    description: 'La app sigue guardando todo en SQLite local offline.',
    icon: 'cloud-offline-outline',
  },
];

export function MoreScreen({ snapshot, navigate }) {
  const customersWithDebt = (snapshot.customers || []).filter(
    (customer) => Number(customer.pending_balance || 0) > 0
  ).length;

  return (
    <Screen
      title="Mas"
      subtitle="Accesos secundarios para uso diario sin saturar el menu inferior."
    >
      <SectionTitle title="Atajos utiles" subtitle="Clientes, movimientos, cartera y estado offline." />
      <View style={{ gap: theme.spacing.md }}>
        {LINKS.map((link) => (
          <Card
            key={link.key}
            pressable={link.key !== 'settings'}
            onPress={link.key !== 'settings' ? () => navigate(link.key) : undefined}
          >
            <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: 'rgba(79, 140, 255, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={link.icon} size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textStrong, fontSize: 16, fontWeight: '800' }}>
                  {link.label}
                </Text>
                <Text style={{ color: theme.colors.muted, fontSize: 13, lineHeight: 18 }}>
                  {link.description}
                </Text>
              </View>
              {link.key !== 'settings' ? (
                <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
              ) : (
                <StatusChip label="Info" tone="info" />
              )}
            </View>
          </Card>
        ))}
      </View>

      <SectionTitle title="Estado rapido" subtitle="Contexto corto para el trabajo diario." />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        <Card style={{ flex: 1, minWidth: 140 }}>
          <Text style={{ color: theme.colors.muted, fontSize: 12, fontWeight: '700' }}>
            Clientes con deuda
          </Text>
          <Text style={{ color: theme.colors.textStrong, fontSize: 24, fontWeight: '900' }}>
            {customersWithDebt}
          </Text>
        </Card>
        <Card style={{ flex: 1, minWidth: 140 }}>
          <Text style={{ color: theme.colors.muted, fontSize: 12, fontWeight: '700' }}>
            Datos locales
          </Text>
          <Text style={{ color: theme.colors.textStrong, fontSize: 24, fontWeight: '900' }}>
            SQLite
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
