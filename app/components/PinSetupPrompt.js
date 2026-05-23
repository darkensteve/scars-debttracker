import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppMessage } from '../context/AppMessageContext';
import { loadPinSettings } from '../lib/pinStorage';

const PROMPT_KEY = 'scars_pin_setup_prompted';

export default function PinSetupPrompt({ navigation }) {
  const { showConfirm } = useAppMessage();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    (async () => {
      const already = await AsyncStorage.getItem(PROMPT_KEY);
      if (already === 'true') return;

      const { pinEnabled } = await loadPinSettings();
      if (pinEnabled) {
        await AsyncStorage.setItem(PROMPT_KEY, 'true');
        return;
      }

      shown.current = true;
      await AsyncStorage.setItem(PROMPT_KEY, 'true');

      showConfirm({
        variant: 'info',
        title: 'Protect your records',
        message:
          'Set a 6-digit PIN so balances and names stay hidden when you switch apps. Use the mobile number on your account if you ever forget your PIN.',
        confirmLabel: 'Set PIN now',
        cancelLabel: 'Not now',
        onConfirm: () => navigation.navigate('PinSetup'),
      });
    })();
  }, [navigation, showConfirm]);

  return null;
}
