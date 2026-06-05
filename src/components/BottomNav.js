import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function BottomNav({ tabs, activeTab, onChange }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [
              styles.navItem,
              active ? styles.navItemActive : null,
              { opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={active ? theme.colors.textStrong : '#94a3b8'}
            />
            <Text style={[styles.navLabel, active ? styles.navLabelActive : null]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1220',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingTop: 8,
    minHeight: 72,
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 18,
  },
  navItemActive: {
    backgroundColor: '#1d4ed8',
  },
  navLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
  },
  navLabelActive: {
    color: '#ffffff',
  },
});
