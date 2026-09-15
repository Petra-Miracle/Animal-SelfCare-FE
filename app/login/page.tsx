"use client";

/* Satu form login untuk SUPERADMIN & ADMIN_RS — redirect sesuai role. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CircleAlert, KeyRound, LoaderCircle, Mail, PawPrint } from "lucide-react";
import { Button, Card, CardBody, Input } from "@heroui/react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Isi email dan kata sandi terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      router.replace(user.role === "SUPERADMIN" ? "/admin" : "/fasilitas");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError("Email atau kata sandi salah. Silakan coba lagi.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal masuk. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-10 sm:pt-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="border border-stone-100 shadow-sm">
          <CardBody className="gap-4 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white" aria-hidden>
                <PawPrint className="h-6 w-6" />
              </span>
              <h1 className="text-xl font-bold text-stone-900">Masuk Dashboard</h1>
              <p className="text-sm text-stone-500">
                Khusus Admin Rumah Sakit & SuperAdmin. Masyarakat tidak perlu akun untuk melapor.
              </p>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="cth. admin@rshewan.id"
                value={email}
                onValueChange={setEmail}
                isRequired
                aria-label="Email"
                startContent={<Mail className="h-4 w-4 text-stone-400" aria-hidden />}
              />
              <Input
                label="Kata sandi"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onValueChange={setPassword}
                isRequired
                aria-label="Kata sandi"
                startContent={<KeyRound className="h-4 w-4 text-stone-400" aria-hidden />}
              />
              {error ? (
                <p role="alert" className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
                </p>
              ) : null}
              <Button
                type="submit"
                color="success"
                className="font-semibold"
                isLoading={loading}
                spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
              >
                {loading ? "Memeriksa…" : "Masuk"}
              </Button>
            </form>
            <p className="text-center text-xs text-stone-400">
              Ingin melaporkan hewan? <Link href="/lapor" className="font-medium text-emerald-700 underline">Ke form laporan</Link>
            </p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
