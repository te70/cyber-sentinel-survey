import { useEffect, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastMessage {
  id: number;
  text: string;
}

let _addToast: ((text: string) => void) | null = null;

export function showToast(text: string) {
  _addToast?.(text);
}

export function TsToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [exiting, setExiting] = useState<Set<number>>(new Set());

  const add = useCallback((text: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setExiting((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        setExiting((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 200);
    }, 3000);
  }, []);

  useEffect(() => {
    _addToast = add;
    return () => { _addToast = null; };
  }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            boxShadow: "var(--ts-shadow-lg)",
            fontFamily: "var(--ts-font-body)",
            transition: "opacity 200ms ease",
            opacity: exiting.has(t.id) ? 0 : 1,
          }}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-[var(--ts-text-primary)]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--ts-success)]" aria-hidden="true" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
