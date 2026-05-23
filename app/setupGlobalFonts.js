import { Platform, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { defaultFontFamily } from './theme/fonts';

/**
 * Apply Poppins as the default for React Native Text / TextInput.
 * Paper components use paperTheme; this catches plain RN text and inputs.
 */
let hasApplied = false;

export function setupGlobalFonts() {
  if (hasApplied) return;
  hasApplied = true;

  const baseStyle = { fontFamily: defaultFontFamily };

  if (RNText.defaultProps == null) {
    RNText.defaultProps = {};
  }
  RNText.defaultProps.style = baseStyle;

  if (RNTextInput.defaultProps == null) {
    RNTextInput.defaultProps = {};
  }
  RNTextInput.defaultProps.style = baseStyle;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const id = 'scars-poppins-web';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        html, body, #root, #root input, #root textarea, #root button, #root select {
          font-family: '${defaultFontFamily}', 'Poppins', sans-serif;
        }
      `;
      document.head.appendChild(el);
    }
  }
}
