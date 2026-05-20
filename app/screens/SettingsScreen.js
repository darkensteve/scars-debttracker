import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDebt } from '../context/DebtContext';
import { colors } from '../theme/colors';

function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.textMuted} style={styles.infoIcon} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

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
    Alert.alert('Settings saved', 'Your business name and currency symbol have been updated successfully.');
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* App branding banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <MaterialCommunityIcons name="cog-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.bannerTitle}>Settings</Text>
        <Text style={styles.bannerSub}>Manage your app preferences</Text>
      </View>

      {/* Business profile */}
      <View style={styles.card}>
        <SectionHeader icon="store-outline" title="Business profile" />
        <View style={styles.fieldGroup}>
          <TextInput
            label="Business name"
            value={businessName}
            onChangeText={setBusinessName}
            mode="outlined"
            style={styles.input}
            placeholder="e.g. SCARS"
            left={<TextInput.Icon icon="domain" color={colors.primary} />}
            outlineStyle={styles.inputOutline}
          />
          <TextInput
            label="Currency symbol"
            value={currency}
            onChangeText={setCurrency}
            mode="outlined"
            style={styles.input}
            placeholder="₱"
            left={<TextInput.Icon icon="currency-sign" color={colors.primary} />}
            outlineStyle={styles.inputOutline}
          />
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            buttonColor={colors.primary}
            icon="content-save-outline"
          >
            Save changes
          </Button>
        </View>
      </View>

      {/* Data overview */}
      <View style={styles.card}>
        <SectionHeader icon="database-outline" title="Data on this device" />
        <InfoRow
          icon="account-group-outline"
          label="Contacts"
          value={`${contacts.length} saved`}
        />
        <View style={styles.divider} />
        <InfoRow
          icon="receipt-text-outline"
          label="Transactions"
          value={`${transactions.length} recorded`}
        />
        <View style={styles.divider} />
        <InfoRow
          icon="cellphone-lock"
          label="Storage"
          value="Local only — no cloud needed"
        />
      </View>

      {/* About */}
      <View style={styles.card}>
        <SectionHeader icon="information-outline" title="About" />
        <InfoRow icon="tag-outline" label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <InfoRow icon="shield-check-outline" label="Data privacy" value="All data stays on this device" />
      </View>

      {/* Danger zone */}
      <View style={[styles.card, styles.dangerCard]}>
        <SectionHeader icon="alert-outline" title="Danger zone" />
        <Text style={styles.dangerHint}>
          Permanently deletes all contacts and transactions. This cannot be undone.
        </Text>
        <Button
          mode="outlined"
          textColor={colors.danger}
          onPress={handleClearData}
          style={styles.dangerButton}
          contentStyle={styles.dangerButtonContent}
          icon="trash-can-outline"
        >
          Clear all data
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
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
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
  },
  fieldGroup: {
    gap: 4,
  },
  input: {
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  inputOutline: {
    borderRadius: 10,
    borderColor: colors.border,
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIcon: {
    marginRight: 12,
    width: 22,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },
  infoValue: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 34,
  },
  dangerHint: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 12,
    lineHeight: 18,
    opacity: 0.8,
  },
  dangerButton: {
    borderColor: colors.danger,
    borderRadius: 12,
  },
  dangerButtonContent: {
    paddingVertical: 4,
  },
});
