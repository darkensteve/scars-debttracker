import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadPinSettings } from '../lib/pinStorage';

const PROMPT_KEY = 'scars_pin_setup_prompted';

export default function PinSetupPrompt({ navigation }) {
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

      Alert.alert(
        'Protect your records',
        'Set a 6-digit PIN so balances and names stay hidden when you switch apps. Use the mobile number on your account if you ever forget your PIN.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Set PIN now',
            onPress: () => navigation.navigate('PinSetup'),
          },
        ]
      );
    })();
  }, [navigation]);

  return null;
}
