"use client";

/* Provider global: HeroUI (+ Toast bawaan HeroUI) + Auth. Flowbite-react tidak butuh provider. */

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { AuthProvider } from "@/lib/auth";
import { AppToastProvider } from "@/lib/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ToastProvider placement="bottom-center" maxVisibleToasts={3} toastProps={{ timeout: 4500 }} />
      <AuthProvider>
        <AppToastProvider>{children}</AppToastProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
