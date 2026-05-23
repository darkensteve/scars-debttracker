import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import AppMessageDialog from '../components/AppMessageDialog';

const AppMessageContext = createContext(null);

const EMPTY = {
  visible: false,
  variant: 'info',
  title: '',
  message: '',
  confirmLabel: 'OK',
  cancelLabel: null,
  destructive: false,
};

export function AppMessageProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const callbacksRef = useRef({ onConfirm: null, onCancel: null });

  const hide = useCallback(() => {
    setState(EMPTY);
    callbacksRef.current = { onConfirm: null, onCancel: null };
  }, []);

  const showMessage = useCallback(
    ({ variant = 'info', title, message, confirmLabel = 'OK', onConfirm }) => {
      callbacksRef.current = { onConfirm: onConfirm || null, onCancel: null };
      setState({
        visible: true,
        variant,
        title,
        message,
        confirmLabel,
        cancelLabel: null,
        destructive: false,
      });
    },
    []
  );

  const showConfirm = useCallback(
    ({
      variant = 'warning',
      title,
      message,
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      destructive = false,
      onConfirm,
      onCancel,
    }) => {
      callbacksRef.current = {
        onConfirm: onConfirm || null,
        onCancel: onCancel || null,
      };
      setState({
        visible: true,
        variant,
        title,
        message,
        confirmLabel,
        cancelLabel,
        destructive,
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    const fn = callbacksRef.current.onConfirm;
    hide();
    fn?.();
  }, [hide]);

  const handleCancel = useCallback(() => {
    const fn = callbacksRef.current.onCancel;
    hide();
    fn?.();
  }, [hide]);

  const handleDismiss = useCallback(() => {
    if (state.cancelLabel) handleCancel();
    else hide();
  }, [state.cancelLabel, handleCancel, hide]);

  return (
    <AppMessageContext.Provider value={{ showMessage, showConfirm, hide }}>
      {children}
      <AppMessageDialog
        visible={state.visible}
        variant={state.variant}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        destructive={state.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onDismiss={handleDismiss}
      />
    </AppMessageContext.Provider>
  );
}

export function useAppMessage() {
  const ctx = useContext(AppMessageContext);
  if (!ctx) {
    throw new Error('useAppMessage must be used within AppMessageProvider');
  }
  return ctx;
}
