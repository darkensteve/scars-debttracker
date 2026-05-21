import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeroInsightsCarousel from '../components/HeroInsightsCarousel';
import PinSetupPrompt from '../components/PinSetupPrompt';
import { useDebt } from '../context/DebtContext';
import { formatMoney } from '../utils/format';
import { colors } from '../theme/colors';


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ icon, label, value, accent, iconColor }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: accent }]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor || colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}


export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    transactions,
    contacts,
    settings,
    totalOwed,
    contactBalance: getBalance,
  } = useDebt();
  const debtorsCount = useMemo(
    () => contacts.filter((c) => getBalance(c.id) > 0).length,
    [contacts, getBalance]
  );

  const dueThisWeek = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const seen = new Set();
    const result = [];
    for (const tx of transactions) {
      if (!tx.dueDate || seen.has(tx.contactId)) continue;
      const due = new Date(tx.dueDate);
      if (due <= weekEnd) {
        seen.add(tx.contactId);
        result.push({
          contactId: tx.contactId,
          name: contacts.find((c) => c.id === tx.contactId)?.name || 'Unknown',
          dueDate: tx.dueDate,
          isOverdue: due < now,
        });
      }
    }
    return result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [transactions, contacts]);

  const businessName = settings.businessName || 'SCARS';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PinSetupPrompt navigation={navigation} />
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.businessName}>{businessName}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={({ pressed }) => [styles.settingsBtn, pressed && styles.settingsBtnPressed]}
            accessibilityLabel="Settings"
            // web tooltip on hover
            {...({ title: 'Settings' })}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

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
            icon={dueThisWeek.length > 0 ? 'calendar-alert' : 'calendar-check-outline'}
            label="Due soon"
            value={String(dueThisWeek.length)}
            accent={dueThisWeek.length > 0 ? '#FEF9C3' : '#F0FDF4'}
            iconColor={dueThisWeek.length > 0 ? colors.warning : colors.success}
          />
        </View>

      </View>

      <View style={[styles.dueSection, dueThisWeek.length > 0 && styles.dueSectionExpanded]}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Due this week</Text>
          {dueThisWeek.length > 0 ? (
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>{dueThisWeek.length}</Text>
            </View>
          ) : (
            <View style={styles.allClearPill}>
              <MaterialCommunityIcons name="check-circle-outline" size={13} color={colors.success} />
              <Text style={styles.allClearText}>All clear</Text>
            </View>
          )}
        </View>

        {dueThisWeek.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-check-outline" size={24} color={colors.success} />
            <Text style={styles.emptyTitle}>No one is due this week.</Text>
          </View>
        ) : (
          <View style={styles.dueList}>
            {dueThisWeek.map((d, i) => (
              <View
                key={d.contactId}
                style={[styles.dueRow, d.isOverdue && styles.dueRowOverdue]}
              >
                <View style={[styles.dueAvatar, d.isOverdue && styles.dueAvatarOverdue]}>
                  <Text style={[styles.dueAvatarText, d.isOverdue && styles.dueAvatarTextOverdue]}>
                    {d.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.dueRowBody}>
                  <Text style={styles.dueRowName} numberOfLines={1}>{d.name}</Text>
                  <Text style={[styles.dueRowDate, d.isOverdue && styles.dueRowDateOverdue]}>
                    {d.isOverdue
                      ? 'Overdue'
                      : `Due ${new Date(d.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={d.isOverdue ? 'alert-circle-outline' : 'clock-outline'}
                  size={20}
                  color={d.isOverdue ? colors.danger : colors.warning}
                />
              </View>
            ))}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  settingsBtnPressed: {
    backgroundColor: colors.primaryLight,
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  businessName: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginTop: 0,
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
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  dueSection: {
    flexShrink: 1,
  },
  dueSectionExpanded: {
    flex: 1,
    minHeight: 0,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  dueBadge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dueBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  dueList: {
    flex: 1,
    gap: 8,
    minHeight: 0,
  },
  dueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dueRowOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dueAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dueAvatarOverdue: {
    backgroundColor: '#FEE2E2',
  },
  dueAvatarText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: colors.warning,
  },
  dueAvatarTextOverdue: {
    color: colors.danger,
  },
  dueRowBody: {
    flex: 1,
    marginRight: 8,
  },
  dueRowName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  dueRowDate: {
    fontSize: 12,
    color: colors.warning,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  dueRowDateOverdue: {
    color: colors.danger,
  },
  allClearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  allClearText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.success,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptyTitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Poppins_500Medium',
  },
});
