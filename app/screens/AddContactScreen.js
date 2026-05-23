import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Switch, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DatePickerField from '../components/DatePickerField';
import { useDebt } from '../context/DebtContext';
import { startOfDay } from '../lib/dateFilters';
import { colors } from '../theme/colors';

export default function AddContactScreen({ navigation }) {
  const { addContact, addTransaction, isOffline, pendingSyncCount, settings } = useDebt();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [hasExistingDebt, setHasExistingDebt] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [startLentDate, setStartLentDate] = useState(() => startOfDay(new Date()));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', "Please enter the person's name.");
      return;
    }

    let amount = 0;
    if (hasExistingDebt) {
      amount = parseFloat(openingAmount.replace(/,/g, ''));
      if (!amount || amount <= 0) {
        Alert.alert(
          'Amount required',
          'Enter how much they currently owe you, or turn off "Already owes you".'
        );
        return;
      }
      if (!startLentDate) {
        Alert.alert('Start lent date', 'Pick when you first lent them money.');
        return;
      }
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      if (startLentDate > todayEnd) {
        Alert.alert('Invalid date', 'Start lent cannot be in the future.');
        return;
      }
    }

    setSaving(true);
    try {
      const contact = await addContact({ name, phone, notes });
      if (!contact?.id) {
        throw new Error('Server did not return a contact id.');
      }

      if (hasExistingDebt && amount > 0) {
        await addTransaction({
          contactId: contact.id,
          amount,
          type: 'loan',
          description: 'Opening balance',
          date: startLentDate,
        });
      }

      const syncNote =
        isOffline || pendingSyncCount > 0
          ? ' Saved on this phone — will sync to your account when internet is available.'
          : '';
      Alert.alert(
        'Contact added',
        `${name.trim()} has been added to your list.${syncNote}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ContactsList');
              navigation.navigate('ContactDetail', { contactId: contact.id });
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Could not save contact', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <MaterialCommunityIcons name="account-plus-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.bannerTitle}>New contact</Text>
        <Text style={styles.bannerSub}>Fill in the details below to add someone.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="account-outline" size={16} color={colors.primary} />
            <Text style={styles.labelText}>Full name <Text style={styles.required}>*</Text></Text>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Maria Santos"
            outlineStyle={styles.inputOutline}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="phone-outline" size={16} color={colors.primary} />
            <Text style={styles.labelText}>Phone <Text style={styles.optional}>(optional)</Text></Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="09XX XXX XXXX"
            outlineStyle={styles.inputOutline}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.primary} />
            <Text style={styles.labelText}>Notes <Text style={styles.optional}>(optional)</Text></Text>
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="Where you know them, reminders..."
            outlineStyle={styles.inputOutline}
          />
        </View>

        <View style={styles.debtSection}>
          <View style={styles.debtToggleRow}>
            <View style={styles.debtToggleText}>
              <Text style={styles.debtToggleTitle}>Already owes you</Text>
              <Text style={styles.debtToggleSub}>
                Turn on if you lent them money before adding them here.
              </Text>
            </View>
            <Switch
              value={hasExistingDebt}
              onValueChange={(on) => {
                setHasExistingDebt(on);
                if (on && !startLentDate) {
                  setStartLentDate(startOfDay(new Date()));
                }
              }}
              color={colors.primary}
            />
          </View>

          {hasExistingDebt ? (
            <View style={styles.debtFields}>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabel}>
                  <MaterialCommunityIcons name="cash" size={16} color={colors.danger} />
                  <Text style={styles.labelText}>
                    Amount they owe <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <TextInput
                  value={openingAmount}
                  onChangeText={setOpeningAmount}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder={`e.g. 5000`}
                  left={<TextInput.Affix text={settings.currency || '₱'} />}
                  outlineStyle={styles.inputOutline}
                />
              </View>

              <DatePickerField
                label="Start lent"
                hint="When you first lent them money (e.g. last month)"
                value={startLentDate}
                onChange={setStartLentDate}
              />
            </View>
          ) : null}
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={colors.primary}
          icon="check"
        >
          Save contact
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
    paddingVertical: 24,
    marginBottom: 4,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    textAlign: 'center',
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
    marginBottom: 6,
  },
  labelText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  required: {
    color: colors.danger,
    fontFamily: 'Poppins_700Bold',
  },
  optional: {
    color: colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  input: {
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: 10,
    borderColor: colors.border,
  },
  debtSection: {
    marginBottom: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  debtToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  debtToggleText: {
    flex: 1,
  },
  debtToggleTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 2,
  },
  debtToggleSub: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    lineHeight: 16,
  },
  debtFields: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
