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

function WebDateField({ label, value, onChange }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.webDateWrap}>
        <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.primary} />
        <TextInput
          style={styles.webDateInput}
          value={toDateInputValue(value)}
          onChangeText={(text) => applyDateText(text, onChange)}
          placeholder="Pick a date"
          placeholderTextColor={colors.textMuted}
          // RN Web passes these to <input type="date" />
          {...{
            type: 'date',
            max: MAX_DATE_STR,
          }}
        />
      </View>
      {value ? (
        <Text style={styles.selectedHint}>{formatFilterDate(value)}</Text>
      ) : (
        <Text style={styles.tapHint}>Tap to open calendar</Text>
      )}
    </View>
  );
}

function NativeDateField({ label, value, onChange, pickerVisible, onOpenPicker, onClosePicker }) {
  const display = value ? formatFilterDate(value) : 'Tap to open calendar';

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
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
          maximumDate={new Date()}
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

function DateField(props) {
  if (Platform.OS === 'web') {
    return <WebDateField label={props.label} value={props.value} onChange={props.onChange} />;
  }
  return <NativeDateField {...props} />;
}

export default function CustomDateFilter({ fromDate, toDate, onChangeFrom, onChangeTo, onClear }) {
  const [openPicker, setOpenPicker] = useState(null);

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Custom dates</Text>
      <Text style={styles.panelHint}>
        {Platform.OS === 'web'
          ? 'Tap From or To — a calendar will open. Use one day (only From) or a range (From and To).'
          : 'Tap a date field to open the calendar. One day: set From only. Range: set From and To.'}
      </Text>

      <View style={styles.dateRow}>
        <DateField
          label="From"
          value={fromDate}
          onChange={onChangeFrom}
          pickerVisible={openPicker === 'from'}
          onOpenPicker={() => setOpenPicker('from')}
          onClosePicker={() => setOpenPicker(null)}
        />
        <DateField
          label="To (optional)"
          value={toDate}
          onChange={onChangeTo}
          pickerVisible={openPicker === 'to'}
          onOpenPicker={() => setOpenPicker('to')}
          onClosePicker={() => setOpenPicker(null)}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearBtnText}>Clear dates</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  panelHint: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldBlock: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textMuted,
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
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: colors.textMuted,
    marginTop: 4,
  },
  selectedHint: {
    fontSize: 10,
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
    fontSize: 12,
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
  actions: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  clearBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.primary,
  },
});
