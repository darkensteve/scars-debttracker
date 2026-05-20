import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebt } from '../context/DebtContext';
import { formatDateTime, formatMoney, TRANSACTION_LABELS } from '../utils/format';
import { colors } from '../theme/colors';

const PAGE_SIZE = 8;

const TYPE_META = {
  loan:     { color: colors.danger,  icon: 'cash-plus',            bg: '#FEF2F2' },
  purchase: { color: colors.warning, icon: 'cart-outline',         bg: '#FFFBEB' },
  payment:  { color: colors.success, icon: 'check-circle-outline', bg: '#ECFDF5' },
};

const DATE_FILTERS = [
  { key: 'all',       label: 'All time' },
  { key: 'today',     label: 'Today' },
  { key: 'week',      label: 'This week' },
  { key: 'month',     label: 'This month' },
  { key: 'lastmonth', label: 'Last month' },
];

function isInDateRange(dateISO, key) {
  if (key === 'all') return true;
  const d = new Date(dateISO);
  const now = new Date();
  if (key === 'today') {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  if (key === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (key === 'month') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (key === 'lastmonth') {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
  }
  return true;
}

function FilterChip({ label, icon, active, color, bg, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: bg || colors.primaryLight, borderColor: color || colors.primary }]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={12}
          color={active ? (color || colors.primary) : colors.textMuted}
        />
      ) : null}
      <Text style={[styles.chipLabel, active && { color: color || colors.primary, fontFamily: 'Poppins_700Bold' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function HistoryRow({ item, contactName, currency }) {
  const meta = TYPE_META[item.type] || TYPE_META.loan;
  return (
    <View style={styles.row}>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>{contactName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>{contactName}</Text>
        <View style={styles.rowMeta}>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <MaterialCommunityIcons name={meta.icon} size={11} color={meta.color} />
            <Text style={[styles.badgeText, { color: meta.color }]}>
              {TRANSACTION_LABELS[item.type]}
            </Text>
          </View>
          <Text style={styles.rowDate}>{formatDateTime(item.date)}</Text>
        </View>
      </View>
      <Text style={[styles.rowAmount, { color: meta.color }]}>
        {item.type === 'payment' ? '−' : '+'}
        {formatMoney(item.amount, currency)}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { recentTransactions, contacts, settings } = useDebt();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const getContactName = (contactId) =>
    contacts.find((c) => c.id === contactId)?.name || 'Unknown';

  const filtered = useMemo(() => {
    let list = recentTransactions;
    if (dateFilter !== 'all') list = list.filter((t) => isInDateRange(t.date, dateFilter));
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((t) =>
        getContactName(t.contactId).toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [recentTransactions, dateFilter, search, contacts]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );

  const displayItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const setFilter = (setter) => (val) => { setter(val); setPage(0); };

  const isFiltered = dateFilter !== 'all' || search.trim().length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>
          {isFiltered
            ? `${filtered.length} of ${recentTransactions.length} records`
            : `${recentTransactions.length} total record${recentTransactions.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={17} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or description..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setFilter(setSearch)}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setFilter(setSearch)('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={15} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Date filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Period</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {DATE_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={dateFilter === f.key}
              onPress={() => setFilter(setDateFilter)(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="filter-off-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {Array.from({ length: PAGE_SIZE }).map((_, i) => {
            const item = displayItems[i];
            if (item) {
              return (
                <HistoryRow
                  key={item.id}
                  item={item}
                  contactName={getContactName(item.contactId)}
                  currency={settings.currency}
                />
              );
            }
            return <View key={`ghost-${i}`} style={styles.rowGhost} />;
          })}
        </View>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <View style={styles.pagination}>
          <Pressable
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={({ pressed }) => [
              styles.pageArrow,
              page === 0 && styles.pageArrowDisabled,
              pressed && page !== 0 && styles.pageArrowPressed,
            ]}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color={page === 0 ? colors.textMuted : colors.primary} />
          </Pressable>
          <Text style={styles.pageText}>{page + 1} / {totalPages}</Text>
          <Pressable
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={({ pressed }) => [
              styles.pageArrow,
              styles.pageArrowNext,
              page >= totalPages - 1 && styles.pageArrowDisabled,
              pressed && page < totalPages - 1 && styles.pageArrowNextPressed,
            ]}
          >
            <MaterialCommunityIcons name="chevron-right" size={20} color={page >= totalPages - 1 ? colors.textMuted : '#FFFFFF'} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexShrink: 0,
    gap: 10,
  },
  filterLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: colors.textMuted,
    width: 36,
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
  },
  listWrap: {
    flex: 1,
    gap: 6,
    minHeight: 0,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowGhost: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  rowAvatarText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  rowBody: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  rowName: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  rowDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  rowAmount: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    flexShrink: 0,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    flexShrink: 0,
  },
  pageArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageArrowNext: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pageArrowDisabled: { opacity: 0.35 },
  pageArrowPressed: { backgroundColor: colors.primaryLight },
  pageArrowNextPressed: { backgroundColor: colors.primaryDark },
  pageText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
