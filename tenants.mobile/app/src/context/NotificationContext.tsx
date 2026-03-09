import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Portal, Dialog, Button, Text, Snackbar } from 'react-native-paper';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface NotificationContextValue {
  toast: (message: string | ToastOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface ConfirmState {
  id: number;
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'danger' | 'primary';
  resolve: (value: boolean) => void;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const confirmIdRef = useRef(0);
  const snackbarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((input: string | ToastOptions) => {
    const opts: ToastOptions = typeof input === 'string' ? { message: input } : input;
    if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);
    setSnackbarMessage(opts.message);
    setSnackbarVisible(true);
    const duration = opts.duration ?? 4000;
    snackbarTimeoutRef.current = setTimeout(() => {
      setSnackbarVisible(false);
      snackbarTimeoutRef.current = null;
    }, duration);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const id = ++confirmIdRef.current;
      setConfirmState({
        id,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        variant: options.variant ?? 'danger',
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(true);
      setConfirmState(null);
    }
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState) {
      confirmState.resolve(false);
      setConfirmState(null);
    }
  }, [confirmState]);

  return (
    <NotificationContext.Provider value={{ toast, confirm }}>
      {children}
      <Portal>
        {confirmState && (
          <Dialog visible={true} onDismiss={handleCancel}>
            {confirmState.title && <Dialog.Title>{confirmState.title}</Dialog.Title>}
            <Dialog.Content>
              <Text variant="bodyLarge">{confirmState.message}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleCancel}>{confirmState.cancelLabel}</Button>
              <Button
                onPress={handleConfirm}
                textColor={confirmState.variant === 'danger' ? '#d32f2f' : undefined}
              >
                {confirmState.confirmLabel}
              </Button>
            </Dialog.Actions>
          </Dialog>
        )}
        <ToastSnackbar
          visible={snackbarVisible}
          message={snackbarMessage}
          onDismiss={() => setSnackbarVisible(false)}
        />
      </Portal>
    </NotificationContext.Provider>
  );
}

function ToastSnackbar({
  visible,
  message,
  onDismiss,
}: {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <Snackbar visible={visible} onDismiss={onDismiss} duration={4000}>
      {message}
    </Snackbar>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
