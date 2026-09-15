"use client";

/* Provider global: HeroUI + Auth + Toast. Flowbite-react tidak butuh provider. */

import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
