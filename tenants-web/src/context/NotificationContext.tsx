"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "info" | "success" | "warning" | "error";

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
  variant?: "danger" | "primary";
}

interface NotificationContextValue {
  toast: (message: string | ToastOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

interface ToastItem extends ToastOptions {
  id: number;
}

interface ConfirmState {
  id: number;
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: "danger" | "primary";
  resolve: (value: boolean) => void;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const toastIdRef = useRef(0);
  const confirmIdRef = useRef(0);
  const toastTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout) clearTimeout(timeout);
    toastTimeoutsRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: string | ToastOptions) => {
      const opts: ToastOptions =
        typeof input === "string" ? { message: input } : input;
      const id = ++toastIdRef.current;
      const item: ToastItem = {
        id,
        message: opts.message,
        type: opts.type ?? "info",
        duration: opts.duration ?? 4000,
      };
      setToasts((prev) => [...prev, item]);

      const timeout = setTimeout(() => removeToast(id), item.duration);
      toastTimeoutsRef.current.set(id, timeout);
    },
    [removeToast]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const id = ++confirmIdRef.current;
      setConfirmState({
        id,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? "Confirm",
        cancelLabel: options.cancelLabel ?? "Cancel",
        variant: options.variant ?? "danger",
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
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {confirmState && (
        <ConfirmDialog
          {...confirmState}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </NotificationContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  const iconMap: Record<ToastType, string> = {
    info: "bi-info-circle",
    success: "bi-check-circle",
    warning: "bi-exclamation-triangle",
    error: "bi-x-circle",
  };
  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const toastType = t.type ?? "info";
        return (
        <div
          key={t.id}
          className={`toast-item toast-${toastType}`}
          role="alert"
          onClick={() => onClose(t.id)}
        >
          <i className={`bi ${iconMap[toastType]} me-2 toast-icon`} aria-hidden />
          <span className="toast-message">{t.message}</span>
        </div>
        );
      })}
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant,
  onConfirm,
  onCancel,
}: ConfirmState & { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "confirm-dialog-title" : undefined}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          {title && (
            <div className="modal-header">
              <h5 id="confirm-dialog-title" className="modal-title">{title}</h5>
            </div>
          )}
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              <i className="bi bi-x-lg" aria-hidden />
              {cancelLabel}
            </button>
            <button
              type="button"
              className={variant === "danger" ? "btn btn-danger" : "btn btn-primary"}
              onClick={onConfirm}
            >
              <i className={`bi ${variant === "danger" ? "bi-trash" : "bi-check-lg"}`} aria-hidden />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
