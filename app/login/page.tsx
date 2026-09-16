"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CircleAlert, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail, PawPrint } from "lucide-react";
import { Alert, Button, Form, Input } from "@heroui/react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-surface shadow-lift"
      >
        <div className="grid min-h-[500px] md:grid-cols-2">
          {/* Left panel - dark */}
          <div className="relative hidden bg-dark-mesh p-8 md:flex md:flex-col md:justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20" aria-hidden>
                <PawPrint className="h-5 w-5 text-white" />
              </span>
              <span className="text-sm font-bold text-white font-heading">Animal SelfCare</span>
            </div>

            {/* Tagline */}
            <div>
              <h2 className="text-2xl font-bold leading-tight text-white font-heading">
                Kelola penanganan hewan terlantar dengan cepat dan terkoordinasi.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Dashboard terpadu untuk Super Admin Kota Kupang dan mitra Rumah Sakit Hewan.
              </p>
            </div>

            {/* Copyright */}
            <p className="text-xs text-white/50">
              © 2026 Animal SelfCare — Kota Kupang
            </p>
          </div>

          {/* Right panel - form */}
          <div className="flex items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-sm">
              {/* Mobile logo */}
              <div className="mb-6 flex items-center gap-3 md:hidden">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary" aria-hidden>
                  <PawPrint className="h-5 w-5 text-white" />
                </span>
                <span className="text-sm font-bold text-txt-primary font-heading">Animal SelfCare</span>
              </div>

              <h1 className="text-2xl font-bold text-txt-primary font-heading">Masuk ke Dashboard</h1>
              <p className="mt-2 text-sm text-txt-secondary">
                Khusus untuk Admin Rumah Sakit & Super Admin.
              </p>

              <Form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@rumahsakit.id"
                  value={email}
                  onValueChange={setEmail}
                  isRequired
                  aria-label="Email"
                  startContent={<Mail className="h-4 w-4 shrink-0 text-txt-muted" aria-hidden />}
                  classNames={{
                    label: "text-txt-primary font-medium",
                    input: "text-txt-primary",
                  }}
                />
                <Input
                  label="Kata Sandi"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onValueChange={setPassword}
                  isRequired
                  aria-label="Kata Sandi"
                  startContent={<KeyRound className="h-4 w-4 shrink-0 text-txt-muted" aria-hidden />}
                  endContent={
                    <button
                      type="button"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-txt-muted outline-none hover:text-txt-secondary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </button>
                  }
                  classNames={{
                    label: "text-txt-primary font-medium",
                    input: "text-txt-primary",
                  }}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-txt-secondary cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    Ingat saya
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Lupa kata sandi?
                  </Link>
                </div>

                {error ? (
                  <Alert
                    color="danger"
                    variant="faded"
                    title="Gagal masuk"
                    description={error}
                    startContent={<CircleAlert className="h-5 w-5 shrink-0" aria-hidden />}
                  />
                ) : null}

                <Button
                  type="submit"
                  className="w-full bg-primary font-bold text-white"
                  isLoading={loading}
                  spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
                >
                  {loading ? "Memeriksa…" : "Masuk"}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
