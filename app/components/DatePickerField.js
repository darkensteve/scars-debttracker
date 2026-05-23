import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from 'react-native-paper';
import {
  formatFilterDate,
  parseDateInput,
  toDateInputValue,
} from '../lib/dateFilters';
import { colors } from '../theme/colors';

const MAX_DATE_STR = toDateInputValue(new Date());

function applyDateText(text, onChange) {
  if (!text) {
    onChange(null);
    return;
  }
  const parsed = parseDateInput(text);
  if (parsed) onChange(parsed);
}

function WebDateField({ label, hint, value, onChange, maximumDate }) {
  const maxStr = maximumDate ? toDateInputValue(maximumDate) : MAX_DATE_STR;
  return (
    <View style={styles.fieldBlock}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.webDateWrap}>
        <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.primary} />
        <TextInput
          style={styles.webDateInput}
          value={toDateInputValue(value)}
          onChangeText={(text) => applyDateText(text, onChange)}
          placeholder="Pick a date"
          placeholderTextColor={colors.textMuted}
          {...{
            type: 'date',
            max: maxStr,
          }}
        />
      </View>
      {value ? (
        <Text style={styles.selectedHint}>{formatFilterDate(value)}</Text>
      ) : hint ? (
        <Text style={styles.tapHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function NativeDateField({
  label,
  hint,
  value,
  onChange,
  maximumDate,
  pickerVisible,
  onOpenPicker,
  onClosePicker,
}) {
  const display = value ? formatFilterDate(value) : hint || 'Tap to open calendar';

  return (
    <View style={styles.fieldBlock}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.dateBtn, pressed && styles.dateBtnPressed]}
        onPress={onOpenPicker}
      >
        <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.primary} />
        <Text style={[styles.dateBtnText, !value && styles.dateBtnPlaceholder]}>{display}</Text>
      </Pressable>
      {pickerVisible ? (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selected) => {
            if (Platform.OS === 'android') onClosePicker();
            if (event.type === 'dismissed') {
              onClosePicker();
              return;
            }
            if (selected) onChange(selected);
          }}
          maximumDate={maximumDate || new Date()}
        />
      ) : null}
      {Platform.OS === 'ios' && pickerVisible ? (
        <Pressable style={styles.iosDoneBtn} onPress={onClosePicker}>
          <Text style={styles.iosDoneText}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Single date picker (web calendar or native picker).
 */
export default function DatePickerField({
  label,
  hint,
  value,
  onChange,
  maximumDate = new Date(),
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <WebDateField
        label={label}
        hint={hint}
        value={value}
        onChange={onChange}
        maximumDate={maximumDate}
      />
    );
  }

  return (
    <NativeDateField
      label={label}
      hint={hint}
      value={value}
      onChange={onChange}
      maximumDate={maximumDate}
      pickerVisible={pickerOpen}
      onOpenPicker={() => setPickerOpen(true)}
      onClosePicker={() => setPickerOpen(false)}
    />
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 6,
  },
  webDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  webDateInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    paddingVertical: 4,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          cursor: 'pointer',
          minHeight: 28,
        }
      : {}),
  },
  tapHint: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 4,
  },
  selectedHint: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.primary,
    marginTop: 4,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dateBtnPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dateBtnText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },
  dateBtnPlaceholder: {
    color: colors.textMuted,
  },
  iosDoneBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iosDoneText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
});
