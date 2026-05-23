import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, IconButton, Text } from 'react-native-paper';
import { useAppMessage } from '../context/AppMessageContext';
import { useDebt } from '../context/DebtContext';
import { getContactHistorySummary } from '../utils/contactHistory';
import { formatDate, formatDateTime, formatMoney, TRANSACTION_LABELS } from '../utils/format';
import { computeDueDateISO } from '../utils/due';
import { colors } from '../theme/colors';

const HISTORY_PAGE_SIZE = 5;

const TYPE_META = {
  loan: { color: colors.danger, icon: 'cash-plus', bg: '#FEF2F2' },
  purchase: { color: colors.warning, icon: 'cart-outline', bg: '#FFFBEB' },
  payment: { color: colors.success, icon: 'check-circle-outline', bg: '#ECFDF5' },
};

function SummaryPill({ label, value }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

export default function ContactDetailScreen({ route, navigation }) {
  const { contactId } = route.params;
  const { showMessage, showConfirm } = useAppMessage();
  const {
    getContactById,
    getTransactionsForContact,
    contactBalance,
    deleteTransaction,
    settings,
  } = useDebt();

  const contact = getContactById(contactId);
  const transactionsNewestFirst = getTransactionsForContact(contactId);
  const balance = contactBalance(contactId);

  const [historyPage, setHistoryPage] = useState(0);

  const summary = useMemo(() => {
    if (!contact) return null;
    return getContactHistorySummary(transactionsNewestFirst, contact);
  }, [contact, transactionsNewestFirst]);

  const totalHistoryPages = summary
    ? Math.max(1, Math.ceil(summary.chronological.length / HISTORY_PAGE_SIZE))
    : 1;

  const pagedHistory = useMemo(() => {
    if (!summary) return [];
    const start = historyPage * HISTORY_PAGE_SIZE;
    return summary.chronological.slice(start, start + HISTORY_PAGE_SIZE);
  }, [summary, historyPage]);

  useEffect(() => {
    setHistoryPage(0);
  }, [contactId, summary?.transactionCount]);

  useEffect(() => {
    if (historyPage > totalHistoryPages - 1) {
      setHistoryPage(Math.max(0, totalHistoryPages - 1));
    }
  }, [historyPage, totalHistoryPages]);

  useLayoutEffect(() => {
    if (contact) {
      navigation.setOptions({ title: contact.name });
    }
  }, [contact, navigation]);

  if (!contact || !summary) {
    return (
      <View style={styles.centered}>
        <Text>Contact not found.</Text>
      </View>
    );
  }

  const confirmDelete = (transaction) => {
    const meta = TYPE_META[transaction.type];
    const formatted = `${settings.currency || '₱'}${Number(transaction.amount).toLocaleString()}`;
    const typeLabel =
      transaction.type === 'loan'
        ? 'money lent'
        : transaction.type === 'purchase'
        ? 'purchase'
        : 'payment';
    showConfirm({
      variant: 'warning',
      title: 'Remove this record?',
      message: `This will permanently delete the ${formatted} ${typeLabel} entry and update ${contact.name}'s balance. This cannot be undone.`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        await deleteTransaction(transaction.id);
        showMessage({
          variant: 'success',
          title: 'Record removed',
          message: `The ${formatted} ${typeLabel} entry has been deleted and ${contact.name}'s balance has been updated.`,
        });
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {contact.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{contact.name}</Text>
              {contact.phone ? (
                <Text style={styles.phone}>{contact.phone}</Text>
              ) : null}
              {contact.notes ? (
                <Text style={styles.notes}>{contact.notes}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>
              {balance > 0
                ? 'Current balance — they owe you'
                : balance < 0
                ? 'Current balance — you owe them'
                : 'All settled up'}
            </Text>
            <View style={styles.balanceRow}>
              <Text
                style={[
                  styles.balanceAmount,
                  balance > 0 && styles.balanceOwed,
                  balance === 0 && styles.balanceZero,
                ]}
              >
                {formatMoney(balance, settings.currency)}
              </Text>
              <TouchableOpacity
                style={styles.recordBtn}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('AddTransaction', { contactId })}
              >
                <MaterialCommunityIcons name="pencil-plus-outline" size={14} color={colors.primary} />
                <Text style={styles.recordBtnText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.metaCard}>
        <Card.Content>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />
            <View style={styles.metaText}>
              <Text style={styles.metaTitle}>
                {summary.startedLendingOn
                  ? 'Started lending'
                  : 'Added to contacts'}
              </Text>
              <Text style={styles.metaValue}>
                {formatDate(summary.startedLendingOn || summary.addedOn)}
              </Text>
            </View>
          </View>
          {summary.transactionCount > 0 ? (
            <Text style={styles.metaHint}>
              {summary.transactionCount}{' '}
              {summary.transactionCount === 1 ? 'record' : 'records'} on file
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      {summary.transactionCount > 0 ? (
        <View style={styles.pillRow}>
          <SummaryPill
            label="Total lent / bought"
            value={formatMoney(summary.totalLent, settings.currency)}
          />
          <SummaryPill
            label="Total paid back"
            value={formatMoney(summary.totalPaid, settings.currency)}
          />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Full history</Text>
      <Text style={styles.sectionSub}>
        {summary.transactionCount > HISTORY_PAGE_SIZE
          ? `${HISTORY_PAGE_SIZE} records per page — oldest first`
          : 'Oldest first — every loan, purchase & payment'}
      </Text>

      {summary.transactionCount === 0 ? (
        <Card style={styles.emptyCard}>
          <MaterialCommunityIcons
            name="history"
            size={36}
            color={colors.textMuted}
          />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>
            Use the Add tab to record the first loan or purchase for{' '}
            {contact.name}.
          </Text>
        </Card>
      ) : (
        <>
        {Array.from({ length: HISTORY_PAGE_SIZE }).map((_, i) => {
          const item = pagedHistory[i];
          if (!item) {
            return <View key={`ghost-${i}`} style={styles.txCardGhost} />;
          }
          const meta = TYPE_META[item.type];
          const dueDateISO = item.dueDate || computeDueDateISO({ type: item.type, createdAtISO: item.date });
          const isDueApplicable = item.type === 'loan' || item.type === 'purchase';
          return (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: meta.color }]} />
                {i < HISTORY_PAGE_SIZE - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <Card style={styles.txCard}>
                <Card.Content>
                  <View style={styles.txTop}>
                    <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                      <MaterialCommunityIcons name={meta.icon} size={14} color={meta.color} />
                      <Text style={[styles.typeBadgeText, { color: meta.color }]}>
                        {TRANSACTION_LABELS[item.type]}
                      </Text>
                    </View>
                    <Text style={styles.txDate}>{formatDateTime(item.date)}</Text>
                  </View>
                  {item.description ? (
                    <Text style={styles.txDesc}>{item.description}</Text>
                  ) : null}
                  {isDueApplicable && dueDateISO ? (
                    <Text style={styles.txDue}>Due {formatDate(dueDateISO)}</Text>
                  ) : null}
                  <View style={styles.txBottom}>
                    <Text style={[styles.txAmount, { color: meta.color }]}>
                      {item.type === 'payment' ? '−' : '+'}
                      {formatMoney(item.amount, settings.currency)}
                    </Text>
                    <IconButton
                      icon="delete-outline"
                      size={20}
                      iconColor={colors.textMuted}
                      onPress={() => confirmDelete(item)}
                    />
                  </View>
                </Card.Content>
              </Card>
            </View>
          );
        })}

        {totalHistoryPages > 1 ? (
          <View style={styles.pagination}>
            <Pressable
              onPress={() => setHistoryPage((p) => Math.max(0, p - 1))}
              disabled={historyPage === 0}
              style={({ pressed }) => [
                styles.pageArrow,
                historyPage === 0 && styles.pageArrowDisabled,
                pressed && historyPage !== 0 && styles.pageArrowPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={historyPage === 0 ? colors.textMuted : colors.primary}
              />
            </Pressable>
            <Text style={styles.pageIndicator}>
              {historyPage + 1} / {totalHistoryPages}
            </Text>
            <Pressable
              onPress={() => setHistoryPage((p) => Math.min(totalHistoryPages - 1, p + 1))}
              disabled={historyPage >= totalHistoryPages - 1}
              style={({ pressed }) => [
                styles.pageArrow,
                styles.pageArrowNext,
                historyPage >= totalHistoryPages - 1 && styles.pageArrowDisabled,
                pressed && historyPage < totalHistoryPages - 1 && styles.pageArrowNextPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={historyPage >= totalHistoryPages - 1 ? colors.textMuted : '#FFFFFF'}
              />
            </Pressable>
          </View>
        ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  phone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  balanceBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  balanceAmount: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  recordBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  balanceOwed: {
    color: colors.primary,
  },
  balanceZero: {
    color: colors.success,
  },
  metaCard: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    flex: 1,
  },
  metaTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  metaValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: 2,
  },
  metaHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  pill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillValue: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  pillLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 18,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: -8,
    minHeight: 40,
  },
  txCard: {
    flex: 1,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
    minHeight: 90,
  },
  txCardGhost: {
    flex: 1,
    minHeight: 90,
    marginBottom: 10,
    marginLeft: 34,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  txDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'Poppins_500Medium',
  },
  txDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  txDue: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    fontFamily: 'Poppins_500Medium',
  },
  txBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  txAmount: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 12,
    color: colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    marginBottom: 8,
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
  pageArrowDisabled: {
    opacity: 0.35,
  },
  pageArrowPressed: {
    backgroundColor: colors.primaryLight,
  },
  pageArrowNextPressed: {
    backgroundColor: colors.primaryDark,
  },
  pageIndicator: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'center',
  },
});
