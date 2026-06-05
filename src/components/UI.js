import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export function Screen({
  title,
  subtitle,
  children,
  floatingAction,
  contentContainerStyle,
}) {
  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.screenRoot}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.screenContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title={title} subtitle={subtitle} />
        {children}
      </ScrollView>
      {floatingAction}
    </LinearGradient>
  );
}

export function AppHeader({ title, subtitle, rightSlot }) {
  return (
    <LinearGradient colors={theme.gradients.header} style={styles.appHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerEyebrow}>App offline</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot}
    </LinearGradient>
  );
}

export function SectionTitle({ title, subtitle, actionLabel, onActionPress }) {
  return (
    <View style={styles.sectionRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style, pressable, onPress }) {
  const body = (
    <LinearGradient colors={theme.gradients.darkCard} style={[styles.card, style]}>
      {children}
    </LinearGradient>
  );

  if (pressable) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
        {body}
      </Pressable>
    );
  }

  return body;
}

export function MetricCard({ label, value, helper, tone = 'primary' }) {
  const toneConfig = {
    primary: theme.gradients.primary,
    success: theme.gradients.success,
    warning: theme.gradients.warning,
    danger: ['#fb7185', '#ef4444'],
  };
  return (
    <Card style={styles.metricCard}>
      <LinearGradient colors={toneConfig[tone] || toneConfig.primary} style={styles.metricOrb} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {helper ? <Text style={styles.metricHelper}>{helper}</Text> : null}
    </Card>
  );
}

export function ActionButton({ label, icon, onPress, tone = 'primary', compact }) {
  const colors =
    tone === 'secondary'
      ? ['rgba(148,163,184,0.2)', 'rgba(71,85,105,0.22)']
      : tone === 'success'
      ? theme.gradients.success
      : tone === 'warning'
      ? theme.gradients.warning
      : tone === 'ghost'
      ? ['rgba(15,23,42,0.22)', 'rgba(15,23,42,0.16)']
      : theme.gradients.primary;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient
        colors={colors}
        style={[styles.actionButton, compact ? styles.actionButtonCompact : null]}
      >
        {icon ? <Ionicons name={icon} size={16} color={theme.colors.textStrong} /> : null}
        <Text style={styles.actionButtonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function FloatingButton({ label, icon = 'add', onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fabWrap, { opacity: pressed ? 0.92 : 1 }]}>
      <LinearGradient colors={theme.gradients.primary} style={styles.fab}>
        <Ionicons name={icon} size={20} color={theme.colors.textStrong} />
        <Text style={styles.fabText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedSoft}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
      />
    </View>
  );
}

export function AppModal({ visible, title, subtitle, children, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <LinearGradient colors={theme.gradients.darkCard} style={styles.modalInner}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{title}</Text>
                {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable onPress={onClose} style={styles.iconButton}>
                <Ionicons name="close" size={20} color={theme.colors.textStrong} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              {children}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

export function EmptyState({ title, message }) {
  return (
    <Card style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name="sparkles-outline" size={24} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </Card>
  );
}

export function StatusChip({ label, tone = 'neutral' }) {
  const toneMap = {
    neutral: { bg: 'rgba(148,163,184,0.18)', fg: theme.colors.muted },
    success: { bg: 'rgba(34,197,94,0.18)', fg: '#7ff0a3' },
    warning: { bg: 'rgba(245,158,11,0.22)', fg: '#ffd375' },
    danger: { bg: 'rgba(239,68,68,0.18)', fg: '#ff9b9b' },
    info: { bg: 'rgba(79,140,255,0.2)', fg: '#9dc2ff' },
  };
  const selected = toneMap[tone] || toneMap.neutral;
  return (
    <View style={[styles.chip, { backgroundColor: selected.bg }]}>
      <Text style={[styles.chipText, { color: selected.fg }]}>{label}</Text>
    </View>
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
      {footer ? <View style={{ marginTop: 2 }}>{footer}</View> : null}
    </Card>
  );
}

export const uiStyles = StyleSheet.create({
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricWrap: {
    flex: 1,
    minWidth: 145,
  },
});

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.lg,
  },
  appHeader: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    overflow: 'hidden',
  },
  headerEyebrow: {
    color: '#89afff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  headerTitle: {
    color: theme.colors.textStrong,
    fontSize: 27,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    color: theme.colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  sectionAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(79,140,255,0.14)',
  },
  sectionActionText: {
    color: '#a4c4ff',
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    gap: theme.spacing.sm,
  },
  metricCard: {
    minHeight: 114,
    flex: 1,
    minWidth: 145,
  },
  metricOrb: {
    width: 38,
    height: 38,
    borderRadius: 16,
    marginBottom: 4,
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: theme.colors.textStrong,
    fontSize: 23,
    fontWeight: '900',
  },
  metricHelper: {
    color: theme.colors.mutedSoft,
    fontSize: 12,
    lineHeight: 17,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionButtonCompact: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    color: theme.colors.textStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  fabWrap: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 22,
  },
  fab: {
    minHeight: 56,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2f6df2',
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  fabText: {
    color: theme.colors.textStrong,
    fontSize: 14,
    fontWeight: '900',
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.strokeStrong,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    color: theme.colors.textStrong,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '92%',
  },
  modalInner: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.stroke,
    overflow: 'hidden',
  },
  modalHandle: {
    width: 54,
    height: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(148,163,184,0.45)',
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.textStrong,
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 26,
    gap: theme.spacing.md,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(79,140,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: theme.colors.textStrong,
    fontSize: 17,
    fontWeight: '900',
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '900',
  },
  listTop: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
  },
  listTitle: {
    color: theme.colors.textStrong,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  listSubtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
