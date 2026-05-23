import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useDebt } from '../context/DebtContext';
import { colors } from '../theme/colors';

export default function SyncStatusBanner() {
  const { isOffline, pendingSyncCount, syncNow, isSyncing } = useDebt();

  if (!isOffline && pendingSyncCount === 0) return null;

  const message = isOffline
    ? pendingSyncCount > 0
      ? `Offline — ${pendingSyncCount} change${pendingSyncCount === 1 ? '' : 's'} saved on this phone. Will sync when online.`
      : 'Offline — you can still view and add records. They sync when you have internet.'
    : `${pendingSyncCount} change${pendingSyncCount === 1 ? '' : 's'} waiting to sync…`;

  return (
    <Pressable
      style={[styles.banner, isOffline ? styles.offline : styles.pending]}
      onPress={!isOffline && pendingSyncCount > 0 ? syncNow : undefined}
      disabled={isOffline || isSyncing || pendingSyncCount === 0}
    >
      <MaterialCommunityIcons
        name={isOffline ? 'cloud-off-outline' : 'cloud-sync-outline'}
        size={18}
        color={isOffline ? colors.warning : colors.primary}
      />
      <Text style={styles.text}>{isSyncing ? 'Syncing…' : message}</Text>
      {!isOffline && pendingSyncCount > 0 && !isSyncing ? (
        <Text style={styles.tap}>Tap to sync</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  offline: {
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  pending: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#BBD4FF',
  },
  text: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },
  tap: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
});
