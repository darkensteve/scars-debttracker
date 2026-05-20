import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeroInsightsCarousel from '../components/HeroInsightsCarousel';
import { useDebt } from '../context/DebtContext';
import { formatDateTime, formatMoney, TRANSACTION_LABELS } from '../utils/format';
import { colors } from '../theme/colors';

const ROW_GAP = 8;
const PAGE_SIZE = 5;
const TYPE_META = {
  loan: { color: colors.danger, icon: 'cash-plus', bg: '#FEF2F2' },
  purchase: { color: colors.warning, icon: 'cart-outline', bg: '#FFFBEB' },
  payment: { color: colors.success, icon: 'check-circle-outline', bg: '#ECFDF5' },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ icon, label, value, accent }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ActivityPagination({ page, totalPages, onPrev, onNext }) {
  const atStart = page === 0;
  const atEnd = page >= totalPages - 1;

  return (
    <View style={styles.pagination}>
      <Pressable
        onPress={onPrev}
        disabled={atStart}
        style={({ pressed }) => [
          styles.pageArrow,
          atStart && styles.pageArrowDisabled,
          pressed && !atStart && styles.pageArrowPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Previous page"
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={20}
          color={atStart ? colors.textMuted : colors.primary}
        />
      </Pressable>

      <Text style={styles.pageStatusText}>
        {page + 1} / {totalPages}
      </Text>

      <Pressable
        onPress={onNext}
        disabled={atEnd}
        style={({ pressed }) => [
          styles.pageArrow,
          styles.pageArrowNext,
          atEnd && styles.pageArrowDisabled,
          pressed && !atEnd && styles.pageArrowNextPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Next page"
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={atEnd ? colors.textMuted : '#FFFFFF'}
        />
      </Pressable>
    </View>
  );
}

function ActivityRow({ item, contactName, currency }) {
  const meta = TYPE_META[item.type] || TYPE_META.loan;

  return (
    <View style={styles.txRow}>
      <View style={styles.txAvatar}>
        <Text style={styles.txAvatarText}>{contactName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txName} numberOfLines={1}>
          {contactName}
        </Text>
        <View style={styles.txMetaRow}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <MaterialCommunityIcons name={meta.icon} size={12} color={meta.color} />
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>
              {TRANSACTION_LABELS[item.type]}
            </Text>
          </View>
          <Text style={styles.txDate}>{formatDateTime(item.date)}</Text>
        </View>
      </View>
      <Text style={[styles.txAmount, { color: meta.color }]}>
        {item.type === 'payment' ? '−' : '+'}
        {formatMoney(item.amount, currency)}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    recentTransactions,
    transactions,
    contacts,
    settings,
    totalOwed,
    contactBalance: getBalance,
  } = useDebt();
  const [activityPage, setActivityPage] = useState(0);
  const prevTxCount = useRef(recentTransactions.length);

  const debtorsCount = useMemo(
    () => contacts.filter((c) => getBalance(c.id) > 0).length,
    [contacts, getBalance]
  );

  const totalActivityPages = useMemo(
    () => Math.max(1, Math.ceil(recentTransactions.length / PAGE_SIZE)),
    [recentTransactions.length]
  );

  const displayTransactions = useMemo(() => {
    const start = activityPage * PAGE_SIZE;
    return recentTransactions.slice(start, start + PAGE_SIZE);
  }, [recentTransactions, activityPage]);

  useEffect(() => {
    if (activityPage > totalActivityPages - 1) {
      setActivityPage(Math.max(0, totalActivityPages - 1));
    }
  }, [activityPage, totalActivityPages]);

  useEffect(() => {
    if (recentTransactions.length > prevTxCount.current) {
      setActivityPage(0);
    }
    prevTxCount.current = recentTransactions.length;
  }, [recentTransactions.length]);

  const getContactName = (contactId) =>
    contacts.find((c) => c.id === contactId)?.name || 'Unknown';

  const businessName = settings.businessName || 'SCARS';
  const showPagination = recentTransactions.length > PAGE_SIZE;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topSection}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.businessName}>{businessName}</Text>

        <HeroInsightsCarousel
          compact
          transactions={transactions}
          contacts={contacts}
          contactBalance={getBalance}
          currency={settings.currency}
          totalOwed={totalOwed}
        />

        <View style={styles.statsRow}>
          <StatCard
            icon="account-group-outline"
            label="Contacts"
            value={String(contacts.length)}
            accent={colors.primaryLight}
          />
          <StatCard
            icon="account-cash-outline"
            label="Owing you"
            value={String(debtorsCount)}
            accent="#E0F2FE"
          />
          <StatCard
            icon="receipt-text-outline"
            label="Records"
            value={String(recentTransactions.length)}
            accent="#F0FDF4"
          />
        </View>
      </View>

      <View style={styles.activitySection}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          {showPagination ? (
            <ActivityPagination
              page={activityPage}
              totalPages={totalActivityPages}
              onPrev={() => setActivityPage((p) => Math.max(0, p - 1))}
              onNext={() =>
                setActivityPage((p) => Math.min(totalActivityPages - 1, p + 1))
              }
            />
          ) : null}
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="notebook-outline"
              size={32}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No activity yet</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => {
              const item = displayTransactions[i];
              if (item) {
                return (
                  <ActivityRow
                    key={item.id}
                    item={item}
                    contactName={getContactName(item.contactId)}
                    currency={settings.currency}
                  />
                );
              }
              return <View key={`empty-${i}`} style={styles.txRowGhost} />;
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 4,
    overflow: 'hidden',
  },
  topSection: {
    flexShrink: 0,
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 0,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  activitySection: {
    flex: 1,
    minHeight: 0,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  activityList: {
    flex: 1,
    minHeight: 0,
    gap: ROW_GAP,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  pageStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 28,
    textAlign: 'center',
  },
  txRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txRowGhost: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  txAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  txBody: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  txName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 0,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
});
