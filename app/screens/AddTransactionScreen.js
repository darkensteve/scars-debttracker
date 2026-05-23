import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ContactPicker from '../components/ContactPicker';
import { useDebt } from '../context/DebtContext';
import { TRANSACTION_LABELS } from '../utils/format';
import { computeDueDateISO } from '../utils/due';
import { colors } from '../theme/colors';

const TYPE_OPTIONS = [
  {
    value: 'loan',
    label: 'Lent cash',
    icon: 'cash-plus',
    color: colors.danger,
    bg: '#FEF2F2',
    activeBorder: colors.danger,
  },
  {
    value: 'purchase',
    label: 'Bought item',
    icon: 'cart-outline',
    color: colors.warning,
    bg: '#FFFBEB',
    activeBorder: colors.warning,
  },
  {
    value: 'payment',
    label: 'Paid you',
    icon: 'check-circle-outline',
    color: colors.success,
    bg: '#ECFDF5',
    activeBorder: colors.success,
  },
];

export default function AddTransactionScreen({ navigation, route }) {
  const { contacts, addTransaction, settings, isOffline, pendingSyncCount } = useDebt();
  const preselectedId = route?.params?.contactId;
  const [contactId, setContactId] = useState(
    preselectedId || contacts[0]?.id || ''
  );
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('loan');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedType = TYPE_OPTIONS.find((t) => t.value === transactionType);

  const duePreview = useMemo(() => {
    const createdAtISO = new Date().toISOString();
    return computeDueDateISO({ type: transactionType, createdAtISO });
  }, [transactionType]);

  useEffect(() => {
    if (preselectedId && contacts.find((c) => c.id === preselectedId)) {
      setContactId(preselectedId);
    } else if (contacts.length && !contacts.find((c) => c.id === contactId)) {
      setContactId(contacts[0].id);
    }
  }, [contacts, contactId, preselectedId]);

  const handleAddTransaction = async () => {
    if (!contactId) {
      Alert.alert('No contact selected', 'Please select a person before saving a transaction.', [{ text: 'OK' }]);
      return;
    }
    const value = parseFloat(amount.replace(/,/g, ''));
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const tx = await addTransaction({ contactId, amount: value, type: transactionType, description });
      const contactName = contacts.find((c) => c.id === contactId)?.name || 'Contact';
      const formatted = `${settings.currency || '₱'}${value.toLocaleString()}`;
      const dueISO = tx?.dueDate;
      const dueLabel = dueISO
        ? new Date(dueISO).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
        : null;

      const messages = {
        loan: {
          title: 'Money lent recorded',
          body: `You lent ${formatted} to ${contactName}.${dueLabel ? ` Expected to be paid back by ${dueLabel}.` : ''} Their balance has been updated.`,
        },
        purchase: {
          title: 'Purchase recorded',
          body: `A purchase of ${formatted} was recorded for ${contactName}.${dueLabel ? ` Payment expected by ${dueLabel}.` : ''} Their balance has been updated.`,
        },
        payment: {
          title: 'Payment received',
          body: `${contactName} paid you ${formatted}. Their outstanding balance has been reduced accordingly.`,
        },
      };

      const { title, body } = messages[transactionType];
      const syncNote =
        isOffline || pendingSyncCount > 0
          ? ' Saved on this phone — will sync when you have internet.'
          : '';
      Alert.alert(title, `${body}${syncNote}`, [{ text: 'Got it' }]);
      setAmount('');
      setDescription('');
      setTransactionType('loan');
    } catch (e) {
      Alert.alert('Something went wrong', 'The transaction could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (contacts.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name="account-plus-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No contacts yet</Text>
        <Text style={styles.emptyText}>
          Add a person under the People tab first before recording a transaction.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('People', { screen: 'AddContact' })}
          style={styles.emptyButton}
          buttonColor={colors.primary}
          icon="account-plus-outline"
        >
          Add contact
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <View style={[styles.bannerIcon, { backgroundColor: selectedType.bg }]}>
          <MaterialCommunityIcons name={selectedType.icon} size={28} color={selectedType.color} />
        </View>
        <Text style={styles.bannerTitle}>New transaction</Text>
        <Text style={styles.bannerSub}>Record a loan, purchase, or payment</Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
        {/* Person */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="account-outline" size={15} color={colors.primary} />
            <Text style={styles.labelText}>Person</Text>
          </View>
          {preselectedId ? (
            <View style={styles.lockedContact}>
              <View style={styles.lockedAvatar}>
                <Text style={styles.lockedAvatarText}>
                  {contacts.find((c) => c.id === preselectedId)?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={styles.lockedName}>
                {contacts.find((c) => c.id === preselectedId)?.name || 'Unknown'}
              </Text>
              <MaterialCommunityIcons name="lock-outline" size={14} color={colors.textMuted} />
            </View>
          ) : (
            <ContactPicker contacts={contacts} value={contactId} onChange={setContactId} />
          )}
        </View>

        {/* Type selector */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="tag-outline" size={15} color={colors.primary} />
            <Text style={styles.labelText}>Type</Text>
          </View>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => {
              const active = transactionType === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: opt.bg, borderColor: opt.activeBorder },
                  ]}
                  onPress={() => setTransactionType(opt.value)}
                >
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={18}
                    color={active ? opt.color : colors.textMuted}
                  />
                  <Text style={[styles.typeChipLabel, active && { color: opt.color, fontFamily: 'Poppins_700Bold' }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="cash-multiple" size={15} color={colors.primary} />
            <Text style={styles.labelText}>Amount</Text>
          </View>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            style={styles.input}
            placeholder="0.00"
            keyboardType="decimal-pad"
            left={<TextInput.Affix text={settings.currency || '₱'} />}
            outlineStyle={styles.inputOutline}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="note-text-outline" size={15} color={colors.primary} />
            <Text style={styles.labelText}>
              Description{' '}
              <Text style={styles.optional}>(optional)</Text>
            </Text>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder={
              transactionType === 'purchase'
                ? 'e.g. groceries from SM, phone load'
                : transactionType === 'loan'
                ? 'e.g. emergency cash, business capital'
                : 'e.g. GCash, partial payment'
            }
            outlineStyle={styles.inputOutline}
          />
        </View>

        {/* Due date hint */}
        {transactionType !== 'payment' && duePreview ? (
          <View style={styles.dueRow}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={14} color={colors.warning} />
            <Text style={styles.dueText}>
              Due:{' '}
              {new Date(duePreview).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        ) : null}

        <Button
          mode="contained"
          onPress={handleAddTransaction}
          loading={saving}
          disabled={saving}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={colors.primary}
          icon="check"
        >
          Save transaction
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 4,
  },
  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bannerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  optional: {
    color: colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
    textAlign: 'center',
  },
  lockedContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lockedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedAvatarText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.primary,
  },
  lockedName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: 10,
    borderColor: colors.border,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dueText: {
    fontSize: 12,
    color: colors.warning,
    fontFamily: 'Poppins_600SemiBold',
  },
  button: {
    marginTop: 4,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
  },
});
