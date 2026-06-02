import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Screen({ title, subtitle, children }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline ? styles.multiline : null]}
      />
    </View>
  );
}

export function Button({ label, onPress, variant = 'primary', icon, disabled }) {
  const backgroundColor =
    variant === 'secondary' ? '#e2e8f0' : variant === 'danger' ? '#dc2626' : '#2563eb';
  const textColor = variant === 'secondary' ? '#0f172a' : '#ffffff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor, opacity: disabled ? 0.6 : 1 }]}
    >
      {icon ? <Ionicons name={icon} size={16} color={textColor} /> : null}
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#e2e8f0', fg: '#334155' },
    success: { bg: '#dcfce7', fg: '#166534' },
    warning: { bg: '#fef3c7', fg: '#92400e' },
    danger: { bg: '#fee2e2', fg: '#991b1b' },
    info: { bg: '#dbeafe', fg: '#1d4ed8' },
  };
  const toneStyle = tones[tone] || tones.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.bg }]}>
      <Text style={[styles.badgeText, { color: toneStyle.fg }]}>{label}</Text>
    </View>
  );
}

export function StatCard({ label, value, helper, success, danger }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          success ? { color: '#16a34a' } : null,
          danger ? { color: '#dc2626' } : null,
        ]}
      >
        {value}
      </Text>
      {helper ? <Text style={styles.statHelper}>{helper}</Text> : null}
    </Card>
  );
}

export function ListRow({ title, subtitle, trailing, footer }) {
  return (
    <Card>
      <View style={styles.listTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>{title}</Text>
          {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
        </View>
        {trailing}
      </View>
      {footer}
    </Card>
  );
}

export function EmptyState({ title, message }) {
  return (
    <Card style={{ alignItems: 'center', gap: 8 }}>
      <Ionicons name="folder-open-outline" size={32} color="#94a3b8" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </Card>
  );
}

export function SheetModal({ visible, title, children, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color="#334155" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function TabBar({ tabs, activeTab, onChange }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tabItem, active ? styles.tabItemActive : null]}
          >
            <Ionicons name={tab.icon} size={18} color={active ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 120,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionWrap: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0f172a',
    fontSize: 15,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  button: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  statCard: {
    minWidth: 150,
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  statHelper: {
    fontSize: 12,
    color: '#64748b',
  },
  listTop: {
    flexDirection: 'row',
    gap: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  listSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '90%',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  tabItem: {
    minWidth: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: '#eff6ff',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#2563eb',
  },
});
