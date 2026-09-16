import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteNavbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Animal SelfCare — Lapor Hewan Terlantar Kota Kupang",
    template: "%s · Animal SelfCare",
  },
  description:
    "Platform pelaporan dan penanganan hewan terlantar di Kota Kupang. Laporkan hewan terlantar dalam hitungan menit, tanpa perlu akun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${inter.variable}`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteNavbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
