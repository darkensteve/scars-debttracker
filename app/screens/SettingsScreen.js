import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import { useAccount } from '../context/AccountContext';
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

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, clearAllData, contacts, transactions } = useDebt();
  const { isPinEnabled, verifyPin, removePin } = useAuth();
  const { user, logout } = useAccount();
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [currency, setCurrency] = useState(settings.currency);
  const [disablePinInput, setDisablePinInput] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

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

  const handlePinToggle = (value) => {
    if (value) {
      navigation.navigate('PinSetup');
    } else {
      setDisablePinInput('');
      setShowDisableConfirm(true);
    }
  };

  const handleConfirmDisablePin = async () => {
    const correct = await verifyPin(disablePinInput);
    if (correct) {
      await removePin();
      setShowDisableConfirm(false);
      setDisablePinInput('');
      Alert.alert('PIN disabled', 'Your PIN lock has been removed.');
    } else {
      Alert.alert('Incorrect PIN', 'The PIN you entered is wrong. Please try again.');
      setDisablePinInput('');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'Your data stays saved in the cloud. Sign in again anytime with your email and password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
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

      {/* Account */}
      <View style={styles.card}>
        <SectionHeader icon="account-circle-outline" title="Account" />
        <InfoRow icon="account-outline" label="Signed in as" value={user?.name || '—'} />
        <View style={styles.divider} />
        <InfoRow icon="email-outline" label="Email" value={user?.email || '—'} />
        <View style={styles.divider} />
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutBtn}
          textColor={colors.primary}
          icon="logout"
        >
          Sign out
        </Button>
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
          icon="cloud-check-outline"
          label="Storage"
          value="Saved to your account in the cloud"
        />
      </View>

      {/* About */}
      <View style={styles.card}>
        <SectionHeader icon="information-outline" title="About" />
        <InfoRow icon="tag-outline" label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <InfoRow icon="shield-check-outline" label="Data privacy" value="Data is tied to your account and stored securely" />
      </View>

      {/* Privacy & how SCARS works */}
      <View style={styles.card}>
        <SectionHeader icon="shield-check-outline" title="Privacy & security" />
        <InfoRow
          icon="folder-lock-outline"
          label="Secure Folder"
          value="SCARS does not open or read Samsung Secure Folder or other apps"
        />
        <View style={styles.divider} />
        <InfoRow
          icon="eye-off-outline"
          label="Recent apps"
          value="Balances stay hidden in the app switcher while SCARS is open"
        />
        <View style={styles.divider} />
        <InfoRow
          icon="lock-reset"
          label="Auto-lock"
          value="PIN required again when you leave the app (if PIN is on)"
        />
        <View style={styles.divider} />
        <InfoRow
          icon="cloud-lock-outline"
          label="Your data"
          value="Records sync to your account over encrypted HTTPS only"
        />
      </View>

      {/* Security */}
      <View style={styles.card}>
        <SectionHeader icon="shield-lock-outline" title="App lock (PIN)" />

        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textMuted} style={styles.infoIcon} />
            <View style={styles.toggleText}>
              <Text style={styles.infoLabel}>PIN lock</Text>
              <Text style={styles.infoValue}>
                {isPinEnabled
                  ? 'Required when opening SCARS and after leaving the app'
                  : 'Recommended — like GCash, keeps names and amounts private'}
              </Text>
            </View>
          </View>
          <Switch
            value={isPinEnabled}
            onValueChange={handlePinToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isPinEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        {isPinEnabled && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="fingerprint" size={18} color={colors.textMuted} style={styles.infoIcon} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Biometric unlock</Text>
                <Text style={styles.infoValue}>Uses fingerprint if available on your device</Text>
              </View>
            </View>
          </>
        )}

        {showDisableConfirm && (
          <View style={styles.disableConfirmBox}>
            <Text style={styles.disableConfirmLabel}>Enter your current PIN to disable lock:</Text>
            <TextInput
              value={disablePinInput}
              onChangeText={setDisablePinInput}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              style={styles.disableInput}
              outlineStyle={styles.inputOutline}
              placeholder="6-digit PIN"
              left={<TextInput.Icon icon="lock-outline" color={colors.primary} />}
            />
            <View style={styles.disableActions}>
              <Button
                onPress={() => { setShowDisableConfirm(false); setDisablePinInput(''); }}
                textColor={colors.textSecondary}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmDisablePin}
                buttonColor={colors.danger}
                disabled={disablePinInput.length !== 6}
              >
                Disable PIN
              </Button>
            </View>
          </View>
        )}
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  toggleText: {
    flex: 1,
  },
  disableConfirmBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  disableConfirmLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    marginBottom: 2,
  },
  disableInput: {
    backgroundColor: colors.surface,
  },
  disableActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  signOutBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderColor: colors.primary,
  },
});
