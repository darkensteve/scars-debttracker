import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput, Title } from 'react-native-paper';
import ContactPicker from '../components/ContactPicker';
import { useDebt } from '../context/DebtContext';
import { TRANSACTION_LABELS } from '../utils/format';
import { computeDueDateISO } from '../utils/due';

const TYPE_OPTIONS = [
  { value: 'loan', label: 'Lent cash' },
  { value: 'purchase', label: 'Bought item' },
  { value: 'payment', label: 'Paid you' },
];

export default function AddTransactionScreen({ navigation }) {
  const { contacts, addTransaction, settings } = useDebt();
  const [contactId, setContactId] = useState(contacts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('loan');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const duePreview = useMemo(() => {
    const createdAtISO = new Date().toISOString();
    return computeDueDateISO({ type: transactionType, createdAtISO });
  }, [transactionType]);

  useEffect(() => {
    if (contacts.length && !contacts.find((c) => c.id === contactId)) {
      setContactId(contacts[0].id);
    }
  }, [contacts, contactId]);

  const handleAddTransaction = async () => {
    if (!contactId) {
      Alert.alert(
        'No contact',
        'Add a person first under the People tab.',
        [{ text: 'OK' }]
      );
      return;
    }
    const value = parseFloat(amount.replace(/,/g, ''));
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await addTransaction({
        contactId,
        amount: value,
        type: transactionType,
        description,
      });
      Alert.alert('Saved', `${TRANSACTION_LABELS[transactionType]} recorded.`);
      setAmount('');
      setDescription('');
      setTransactionType('loan');
    } catch (e) {
      Alert.alert('Error', 'Could not save transaction.');
    } finally {
      setSaving(false);
    }
  };

  if (contacts.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Add a contact first</Text>
        <Text style={styles.emptyText}>
          Before recording money lent or items bought, add the person under People.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('People', { screen: 'AddContact' })}
          style={styles.emptyButton}
        >
          Add contact
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Card style={styles.form}>
        <Card.Content>
          <Title>New transaction</Title>

          <Text style={styles.label}>Who is this for?</Text>
          <ContactPicker contacts={contacts} value={contactId} onChange={setContactId} />

          <Text style={styles.label}>Type</Text>
          <SegmentedButtons
            value={transactionType}
            onValueChange={setTransactionType}
            buttons={TYPE_OPTIONS}
            style={styles.segmented}
          />

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            style={styles.input}
            placeholder="0.00"
            keyboardType="decimal-pad"
            left={<TextInput.Affix text={settings.currency || '₱'} />}
          />

          <TextInput
            label="Description (optional)"
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
          />
          {transactionType !== 'payment' && duePreview ? (
            <Text style={styles.hint}>
              Due date: {new Date(duePreview).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleAddTransaction}
            loading={saving}
            disabled={saving}
            style={styles.button}
          >
            Save transaction
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  form: {
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  segmented: {
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    marginTop: 12,
  },
  button: {
    marginTop: 24,
    paddingVertical: 6,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 12,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    alignSelf: 'center',
  },
});
