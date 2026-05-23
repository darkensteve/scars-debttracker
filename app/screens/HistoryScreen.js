import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebt } from '../context/DebtContext';
import CustomDateFilter from '../components/CustomDateFilter';
import { isInCustomRange, isInPresetRange } from '../lib/dateFilters';
import { formatDateTime, formatMoney, TRANSACTION_LABELS } from '../utils/format';
import { colors } from '../theme/colors';

const PAGE_SIZE = 5;

const TYPE_META = {
  loan: { color: colors.danger, icon: 'cash-plus', bg: '#FEF2F2', label: TRANSACTION_LABELS.loan },
  purchase: { color: colors.warning, icon: 'cart-outline', bg: '#FFFBEB', label: TRANSACTION_LABELS.purchase },
  payment: { color: colors.success, icon: 'check-circle-outline', bg: '#ECFDF5', label: TRANSACTION_LABELS.payment },
};

const DATE_FILTERS = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'lastmonth', label: 'Last month' },
  { key: 'custom', label: 'Custom' },
];

function HistoryListSeparator() {
  return <View style={styles.separator} />;
}

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const HistoryCard = React.memo(function HistoryCard({ item, contact, currency }) {
  const meta = TYPE_META[item.type] || TYPE_META.loan;
  const contactName = contact?.name || 'Unknown';
  const amountPrefix = item.type === 'payment' ? '−' : '+';

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyRow}>
        <View style={styles.avatarTouch}>
          {contact?.photoUri ? (
            <Image source={{ uri: contact.photoUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{contactName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.historyInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contactName}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <MaterialCommunityIcons name={meta.icon} size={12} color={meta.color} />
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.activityMeta} numberOfLines={1}>
            {formatDateTime(item.date)}
            {item.description ? ` · ${item.description}` : ''}
          </Text>
        </View>

        <View style={styles.amountCol}>
          <Text style={[styles.amount, { color: meta.color }]} numberOfLines={1}>
            {amountPrefix}
            {formatMoney(item.amount, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { recentTransactions, contacts, settings } = useDebt();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);

  const contactById = useMemo(() => {
    const map = new Map();
    for (const c of contacts) map.set(c.id, c);
    return map;
  }, [contacts]);

  const filtered = useMemo(() => {
    let list = recentTransactions;
    if (dateFilter === 'custom') {
      if (!customFrom) return [];
      list = list.filter((t) => isInCustomRange(t.date, customFrom, customTo));
    } else if (dateFilter !== 'all') {
      list = list.filter((t) => isInPresetRange(t.date, dateFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((t) => {
        const name = contactById.get(t.contactId)?.name || '';
        return (
          name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [recentTransactions, dateFilter, customFrom, customTo, search, contactById]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const displayItems = useMemo(() => {
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  const setFilter = (setter) => (val) => {
    setter(val);
    setPage(0);
  };

  const isFiltered =
    dateFilter !== 'all' ||
    search.trim().length > 0 ||
    (dateFilter === 'custom' && customFrom);
  const showingFrom = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  const listHeader = useMemo(
    () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>
          {isFiltered
            ? `${filtered.length} of ${recentTransactions.length} records`
            : `${recentTransactions.length} total record${recentTransactions.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      <Searchbar
        placeholder="Search by name or description"
        onChangeText={setFilter(setSearch)}
        value={search}
        style={styles.searchBar}
      />

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Period</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {DATE_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={dateFilter === f.key}
              onPress={() => {
                setDateFilter(f.key);
                setPage(0);
                if (f.key !== 'custom') {
                  setCustomFrom(null);
                  setCustomTo(null);
                }
              }}
            />
          ))}
        </ScrollView>
      </View>

      {dateFilter === 'custom' ? (
        <CustomDateFilter
          fromDate={customFrom}
          toDate={customTo}
          onChangeFrom={(d) => {
            setCustomFrom(d);
            setPage(0);
          }}
          onChangeTo={(d) => {
            setCustomTo(d);
            setPage(0);
          }}
          onClear={() => {
            setCustomFrom(null);
            setCustomTo(null);
            setPage(0);
          }}
        />
      ) : null}

      {dateFilter === 'custom' && !customFrom ? (
        <Text style={styles.customWarn}>
          Tap From above and pick a date from the calendar to see matching records.
        </Text>
      ) : null}

      {filtered.length > 0 ? (
        <Text style={styles.rangeHint}>
          Showing {showingFrom}–{showingTo} of {filtered.length}
        </Text>
      ) : null}
    </>
    ),
    [
      isFiltered,
      filtered.length,
      recentTransactions.length,
      search,
      dateFilter,
      customFrom,
      customTo,
      showingFrom,
      showingTo,
    ]
  );

  const listFooter = useMemo(
    () =>
    filtered.length > 0 && totalPages > 1 ? (
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
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={page === 0 ? colors.textMuted : colors.primary}
          />
        </Pressable>
        <Text style={styles.pageText}>
          Page {page + 1} of {totalPages}
        </Text>
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
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={page >= totalPages - 1 ? colors.textMuted : '#FFFFFF'}
          />
        </Pressable>
      </View>
    ) : (
      <View style={styles.listFooterSpacer} />
    ),
    [filtered.length, totalPages, page]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <HistoryCard
        item={item}
        contact={contactById.get(item.contactId)}
        currency={settings.currency}
      />
    ),
    [contactById, settings.currency]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={displayItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="filter-off-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or period filter.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        ItemSeparatorComponent={HistoryListSeparator}
        removeClippedSubviews={Platform.OS !== 'web'}
        windowSize={7}
        maxToRenderPerBatch={6}
        initialNumToRender={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
  searchBar: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    elevation: 0,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  filterLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: colors.textMuted,
    width: 40,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
  },
  chipLabelActive: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  rangeHint: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.textMuted,
    marginBottom: 10,
  },
  customWarn: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.warning,
    marginTop: -4,
    marginBottom: 10,
  },
  list: {
    paddingBottom: 16,
    flexGrow: 1,
    ...(Platform.OS === 'web' ? { scrollbarWidth: 'none' } : {}),
  },
  separator: {
    height: 10,
  },
  historyCard: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  avatarTouch: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  historyInfo: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
    gap: 3,
  },
  contactName: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  activityMeta: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  amountCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 80,
  },
  amount: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 16,
    marginTop: 4,
  },
  pageArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  pageArrowDisabled: {
    opacity: 0.35,
  },
  pageArrowPressed: {
    backgroundColor: colors.primaryLight,
  },
  pageArrowNextPressed: {
    backgroundColor: colors.primaryDark,
  },
  pageText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
    minWidth: 100,
    textAlign: 'center',
  },
  listFooterSpacer: {
    height: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
