"use client";

/* Satu form login untuk SUPERADMIN & ADMIN_RS — redirect sesuai role.
   Dibungkus HeroUI Form; panel samping memakai HeroUI Image. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CircleAlert, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail, PawPrint } from "lucide-react";
import { Alert, Button, Card, CardBody, Form, Image, Input, Link as HeroLink } from "@heroui/react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/types";

const SIDE_IMG =
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80";

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
    <div className="mx-auto max-w-4xl pt-8 sm:pt-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="overflow-hidden border border-stone-200/70 shadow-lift">
          <CardBody className="grid gap-0 p-0 md:grid-cols-2">
            {/* Panel samping */}
            <div className="relative hidden min-h-full overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-teal-700 md:block">
              <Image
                src={SIDE_IMG}
                alt="Kucing yang tenang — setiap laporan membantu hewan seperti ini"
                className="absolute inset-0 h-full w-full object-cover opacity-40"
                removeWrapper
              />
              <div className="bg-card-dots absolute inset-0" aria-hidden />
              <div className="relative flex h-full flex-col justify-between gap-8 p-8 text-white">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm" aria-hidden>
                  <PawPrint className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-2xl font-extrabold leading-tight">Dasbor petugas, satu pintu.</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">
                    Verifikasi laporan, kelola fasilitas, dan pantau penanganan — semuanya realtime dari satu tempat.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-start gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-card md:hidden" aria-hidden>
                  <PawPrint className="h-6 w-6" />
                </span>
                <h1 className="text-xl font-extrabold tracking-tight text-stone-900">Masuk Dashboard</h1>
                <p className="text-sm text-stone-500">
                  Khusus Admin Rumah Sakit & SuperAdmin. Masyarakat tidak perlu akun untuk melapor.
                </p>
              </div>
              <Form onSubmit={submit} className="mt-5 flex flex-col gap-3">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="cth. admin@rshewan.id"
                  value={email}
                  onValueChange={setEmail}
                  isRequired
                  aria-label="Email"
                  startContent={<Mail className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />}
                />
                <Input
                  label="Kata sandi"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onValueChange={setPassword}
                  isRequired
                  aria-label="Kata sandi"
                  startContent={<KeyRound className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />}
                  endContent={
                    <button
                      type="button"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-stone-400 outline-none hover:text-stone-600 focus-visible:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </button>
                  }
                />
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
                  color="success"
                  className="bg-brand-600 font-bold"
                  isLoading={loading}
                  spinner={<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
                  startContent={loading ? undefined : <Lock className="h-4 w-4" aria-hidden />}
                >
                  {loading ? "Memeriksa…" : "Masuk"}
                </Button>
              </Form>
              <p className="mt-4 text-center text-xs text-stone-400">
                Ingin melaporkan hewan?{" "}
                <HeroLink as={Link} href="/lapor" color="success" className="text-xs font-semibold">
                  Ke form laporan
                </HeroLink>
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
