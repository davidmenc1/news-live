"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SocketProvider } from "@/components/socket-provider";
import { CategoryProvider } from "@/components/category-context";
import { NotificationPanel } from "@/components/notification-panel";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper component
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SocketProvider>
        <CategoryProvider>
          {children}
        </CategoryProvider>
        <NotificationPanel />
        <Toaster position="top-right" richColors closeButton />
      </SocketProvider>
    </ThemeProvider>
  );
}
