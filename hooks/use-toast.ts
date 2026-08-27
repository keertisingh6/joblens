"use client";

import { useState } from "react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function toast(message: Omit<ToastMessage, "id">) {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { ...message, id }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3200);
  }

  return { toasts, toast };
}
