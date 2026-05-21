"use client";

import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/theme/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </ThemeProvider>
  );
}
