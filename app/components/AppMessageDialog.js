import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const VARIANTS = {
  success: {
    icon: 'check-circle-outline',
    color: colors.success,
    bg: '#ECFDF5',
    border: '#6EE7B7',
  },
  error: {
    icon: 'alert-circle-outline',
    color: colors.danger,
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  warning: {
    icon: 'alert-outline',
    color: colors.warning,
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  info: {
    icon: 'information-outline',
    color: colors.primary,
    bg: colors.primaryLight,
    border: '#BFDBFE',
  },
};

export default function AppMessageDialog({
  visible,
  variant = 'info',
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = null,
  destructive = false,
  onConfirm,
  onCancel,
  onDismiss,
}) {
  const meta = VARIANTS[variant] || VARIANTS.info;
  const confirmColor = destructive ? colors.danger : colors.primary;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={[styles.iconRing, { backgroundColor: meta.bg, borderColor: meta.border }]}>
          <MaterialCommunityIcons name={meta.icon} size={36} color={meta.color} />
        </View>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text style={styles.message}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions style={[styles.actions, cancelLabel && styles.actionsRow]}>
          {cancelLabel ? (
            <Button
              mode="text"
              onPress={onCancel}
              textColor={colors.textMuted}
              labelStyle={styles.cancelLabel}
              style={styles.cancelButton}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            mode="contained"
            onPress={onConfirm}
            buttonColor={confirmColor}
            style={[styles.button, cancelLabel && styles.buttonFlex]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 24,
  },
  iconRing: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 4,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    minWidth: 88,
  },
  cancelLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    minWidth: 120,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  buttonLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
});
