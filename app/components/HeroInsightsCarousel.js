import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import {
  getCollectedThisWeek,
  getPaidTodayStats,
  getStillDueThisWeekCount,
} from '../utils/dashboardStats';
import { formatMoney } from '../utils/format';
import { colors } from '../theme/colors';

const ROTATE_MS = 6000;
const FADE_MS = 500;

export default function HeroInsightsCarousel({
  transactions,
  contacts,
  contactBalance,
  currency,
  totalOwed = 0,
  compact = false,
}) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const paidToday = useMemo(
    () => getPaidTodayStats(transactions),
    [transactions]
  );
  const collectedWeek = useMemo(
    () => getCollectedThisWeek(transactions),
    [transactions]
  );
  const stillDueWeek = useMemo(
    () => getStillDueThisWeekCount(contacts, transactions, contactBalance),
    [contacts, transactions, contactBalance]
  );

  const slides = useMemo(
    () => [
      {
        key: 'total-owed',
        label: 'Total owed to you',
        value: formatMoney(totalOwed, currency),
        hint:
          totalOwed > 0
            ? 'Across everyone with an open balance'
            : 'No outstanding balances right now',
      },
      {
        key: 'paid-today',
        label: 'Paid today',
        value:
          paidToday.peopleCount === 0
            ? '0 people'
            : `${paidToday.peopleCount} ${
                paidToday.peopleCount === 1 ? 'person' : 'people'
              }`,
        hint:
          paidToday.amount > 0
            ? `${formatMoney(paidToday.amount, currency)} collected today`
            : 'No payments recorded today',
      },
      {
        key: 'due-week',
        label: 'Still due this week',
        value:
          stillDueWeek === 0
            ? '0 people'
            : `${stillDueWeek} ${stillDueWeek === 1 ? 'person' : 'people'}`,
        hint:
          stillDueWeek === 0
            ? 'Everyone with balance paid this week'
            : 'Open balance, no payment this week',
      },
      {
        key: 'collected-week',
        label: 'Collected this week',
        value: formatMoney(collectedWeek, currency),
        hint: 'Total payments Mon – today',
      },
    ],
    [paidToday, stillDueWeek, collectedWeek, currency, totalOwed]
  );

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const timer = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setIndex((i) => (i + 1) % slides.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start();
      });
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [fadeAnim, slides.length]);

  const slide = slides[index];

  return (
    <View style={[styles.heroCard, compact && styles.heroCardCompact]}>
      <View style={[styles.heroDecor, compact && styles.heroDecorCompact]} />
      <Animated.View style={[styles.slide, compact && styles.slideCompact, { opacity: fadeAnim }]}>
        <Text style={[styles.heroLabel, compact && styles.heroLabelCompact]}>{slide.label}</Text>
        <Text style={[styles.heroAmount, compact && styles.heroAmountCompact]}>{slide.value}</Text>
        <Text style={[styles.heroHint, compact && styles.heroHintCompact]} numberOfLines={1}>
          {slide.hint}
        </Text>
      </Animated.View>
      <View style={[styles.dots, compact && styles.dotsCompact]}>
        {slides.map((s, i) => (
          <View
            key={s.key}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 22,
    paddingBottom: 18,
    overflow: 'hidden',
    marginBottom: 16,
    minHeight: 148,
  },
  heroDecor: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -30,
  },
  slide: {
    minHeight: 88,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.3,
  },
  heroAmount: {
    fontSize: 34,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginTop: 6,
  },
  heroHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  heroCardCompact: {
    padding: 14,
    paddingBottom: 12,
    marginBottom: 10,
    minHeight: 108,
    borderRadius: 16,
  },
  heroDecorCompact: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  slideCompact: {
    minHeight: 64,
  },
  heroLabelCompact: {
    fontSize: 11,
  },
  heroAmountCompact: {
    fontSize: 26,
    marginTop: 2,
  },
  heroHintCompact: {
    fontSize: 11,
    marginTop: 4,
  },
  dotsCompact: {
    marginTop: 8,
  },
});
