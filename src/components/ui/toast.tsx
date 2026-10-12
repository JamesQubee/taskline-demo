"use client";

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error";
type ToastItem = { id: number; tone: Tone; message: string };
type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DISMISS_AFTER_MS = 4500;
let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((tone: Tone, message: string) => {
    const id = ++nextId;
    setToasts((current) => [...current, { id, tone, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, DISMISS_AFTER_MS);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext value={api}>
      {children}
      {/* Always in the DOM so screen readers announce toasts as they arrive. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-control border bg-surface px-3.5 py-3 text-sm shadow-lift",
              toast.tone === "error" ? "border-danger/30" : "border-line",
            )}
          >
            {toast.tone === "error" ? (
              <CircleAlert
                className="mt-0.5 size-4 shrink-0 text-danger"
                aria-hidden="true"
              />
            ) : (
              <CircleCheck
                className="mt-0.5 size-4 shrink-0 text-success"
                aria-hidden="true"
              />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastApi {
  const api = use(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>.");
  return api;
}
