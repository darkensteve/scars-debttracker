import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, TextInput, Title } from 'react-native-paper';
import { useDebt } from '../context/DebtContext';

export default function AddContactScreen({ navigation }) {
  const { addContact } = useDebt();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter the person\'s name.');
      return;
    }
    setSaving(true);
    try {
      const contact = await addContact({ name, phone, notes });
      navigation.replace('ContactDetail', { contactId: contact.id });
    } catch (e) {
      Alert.alert('Error', 'Could not save contact.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <Card.Content>
          <Title>New contact</Title>
          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. Maria Santos"
          />
          <TextInput
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="09XX XXX XXXX"
          />
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="Where you know them, reminders..."
          />
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.button}
          >
            Save contact
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
  card: {
    borderRadius: 12,
  },
  input: {
    marginTop: 12,
  },
  button: {
    marginTop: 20,
    paddingVertical: 6,
  },
});

