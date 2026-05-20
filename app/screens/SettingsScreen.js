import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, List, TextInput, Title } from 'react-native-paper';
import { useDebt } from '../context/DebtContext';

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllData, contacts, transactions } = useDebt();
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [currency, setCurrency] = useState(settings.currency);

  useEffect(() => {
    setBusinessName(settings.businessName);
    setCurrency(settings.currency);
  }, [settings.businessName, settings.currency]);

  const handleSave = async () => {
    await updateSettings({
      businessName: businessName.trim() || 'SCARS',
      currency: currency.trim() || '₱',
    });
    Alert.alert('Saved', 'Your settings were updated.');
  };

  const handleClearData = () => {
    Alert.alert(
      'Delete all data?',
      'This removes every contact and transaction from this phone. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            setBusinessName('SCARS');
            setCurrency('₱');
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Your business</Title>
          <TextInput
            label="Name shown on dashboard"
            value={businessName}
            onChangeText={setBusinessName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. SCARS"
          />
          <TextInput
            label="Currency symbol"
            value={currency}
            onChangeText={setCurrency}
            mode="outlined"
            style={styles.input}
            placeholder="₱"
          />
          <Button mode="contained" onPress={handleSave} style={styles.button}>
            Save settings
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Data on this phone</Title>
          <List.Item
            title="Contacts"
            description={`${contacts.length} saved`}
            left={(props) => <List.Icon {...props} icon="account-group" />}
          />
          <List.Item
            title="Transactions"
            description={`${transactions.length} recorded`}
            left={(props) => <List.Icon {...props} icon="receipt" />}
          />
          <List.Item
            title="Storage"
            description="Everything stays on this device — no cloud account needed"
            left={(props) => <List.Icon {...props} icon="cellphone" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>About</Title>
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        textColor="#C62828"
        onPress={handleClearData}
        style={styles.dangerButton}
      >
        Clear all data
      </Button>
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
    marginBottom: 12,
    borderRadius: 12,
  },
  input: {
    marginTop: 12,
  },
  button: {
    marginTop: 16,
  },
  dangerButton: {
    marginTop: 8,
    marginBottom: 32,
    borderColor: '#C62828',
  },
});
