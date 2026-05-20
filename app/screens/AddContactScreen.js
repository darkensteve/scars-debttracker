import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDebt } from '../context/DebtContext';
import { colors } from '../theme/colors';

export default function AddContactScreen({ navigation }) {
  const { addContact } = useDebt();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', "Please enter the person's name.");
      return;
    }
    setSaving(true);
    try {
      const contact = await addContact({ name, phone, notes });
      Alert.alert(
        'Contact added',
        `${name.trim()} has been added to your list. You can now record loans, purchases, and payments for them.`,
        [{ text: 'View profile', onPress: () => navigation.replace('ContactDetail', { contactId: contact.id }) }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save contact. Please try again.');
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
      {/* Header banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <MaterialCommunityIcons name="account-plus-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.bannerTitle}>New contact</Text>
        <Text style={styles.bannerSub}>Fill in the details below to add someone.</Text>
      </View>

      {/* Form card */}
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
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
