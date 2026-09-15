"use client";

/* Kelola akun: buat Admin RS (wajib facilityId) / SuperAdmin, nonaktifkan akun. */

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Mail, Plus, UserX } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Skeleton,
  Tooltip,
  User as HeroUser,
  useDisclosure,
} from "@heroui/react";
import {
  apiErrorMessage,
  asArray,
  createUser,
  deactivateUser,
  listFacilities,
  listUsers,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { CareFacility, ManagedUser, UserRole } from "@/lib/types";

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<ManagedUser[]>([]);
  const [facilities, setFacilities] = useState<CareFacility[]>([]);
  const [facilityName, setFacilityName] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN_RS");
  const [facilityId, setFacilityId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, f] = await Promise.all([
        listUsers(token ?? undefined),
        listFacilities(token ?? undefined).catch(() => ({ facilities: [] as CareFacility[] })),
      ]);
      setItems(asArray<ManagedUser>(u, "users"));
      const facs = asArray<CareFacility>(f, "facilities");
      setFacilities(facs);
      setFacilityName(Object.fromEntries(facs.map((x) => [x.id, x.name])));
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat akun."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error("Isi email yang valid.");
    if (password.length < 8) return toast.error("Kata sandi minimal 8 karakter.");
    if (role === "ADMIN_RS" && !facilityId) return toast.error("Pilih fasilitas untuk role Admin RS.");
    setBusy(true);
    try {
      await createUser(
        {
          email: email.trim(),
          password,
          role,
          phone: phone.trim() || undefined,
          facilityId: role === "ADMIN_RS" ? facilityId : undefined,
        },
        token ?? undefined
      );
      toast.success("Akun baru dibuat.");
      setEmail("");
      setPassword("");
      setPhone("");
      setFacilityId("");
      onClose();
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (u: ManagedUser) => {
    if (!window.confirm(`Nonaktifkan akun ${u.email}?`)) return;
    try {
      await deactivateUser(u.id, token ?? undefined);
      toast.success("Akun dinonaktifkan.");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Kelola Akun"
        description="Akun Admin RS wajib terikat ke satu fasilitas."
        actions={
          <Button color="success" className="bg-brand-600 font-semibold" startContent={<Plus className="h-4 w-4" aria-hidden />} onPress={onOpen}>
            Buat Akun
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="rounded-3xl">
              <div className="h-28" />
            </Skeleton>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada akun" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((u) => (
            <Card key={u.id} className={`border shadow-card ${u.isActive ? "border-stone-200/70" : "border-stone-200 opacity-70"}`}>
              <CardBody className="gap-2.5 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <HeroUser
                    name={u.email}
                    description={u.role === "SUPERADMIN" ? "SuperAdmin" : `Admin RS · ${u.facilityId ? (facilityName[u.facilityId] ?? "Fasilitas") : "-"}`}
                    avatarProps={{
                      name: u.email.charAt(0).toUpperCase(),
                      className: u.role === "SUPERADMIN" ? "bg-violet-600 text-white" : "bg-brand-600 text-white",
                    }}
                  />
                  <Chip size="sm" color={u.isActive ? "success" : "default"} variant="flat">
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </Chip>
                </div>
                <p className="text-xs text-stone-400">Dibuat {formatDateID(u.createdAt)}{u.phone ? ` · ${u.phone}` : ""}</p>
                {u.isActive && u.id !== user?.id ? (
                  <div className="border-t border-stone-100 pt-2">
                    <Tooltip content="Cabut akses masuk akun ini" placement="top" size="sm">
                      <Button size="sm" variant="light" color="danger" startContent={<UserX className="h-3.5 w-3.5" aria-hidden />} onPress={() => deactivate(u)}>
                        Nonaktifkan
                      </Button>
                    </Tooltip>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>Buat akun baru</ModalHeader>
              <ModalBody className="gap-3">
                <Input label="Email" type="email" value={email} onValueChange={setEmail} isRequired aria-label="Email akun" startContent={<Mail className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />} />
                <Input label="Kata sandi (min. 8 karakter)" type="password" value={password} onValueChange={setPassword} isRequired aria-label="Kata sandi akun" startContent={<KeyRound className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />} />
                <Input label="No. HP (opsional)" inputMode="tel" value={phone} onValueChange={setPhone} aria-label="Nomor HP akun" />
                <Select label="Role" selectedKeys={[role]} onSelectionChange={(k) => {
                  const v = Array.from(k)[0] as UserRole;
                  if (v) setRole(v);
                }}>
                  <SelectItem key="ADMIN_RS">Admin RS</SelectItem>
                  <SelectItem key="SUPERADMIN">SuperAdmin</SelectItem>
                </Select>
                {role === "ADMIN_RS" ? (
                  <Select
                    label="Fasilitas (wajib)"
                    placeholder="Pilih fasilitas"
                    selectedKeys={facilityId ? [facilityId] : []}
                    onSelectionChange={(k) => setFacilityId((Array.from(k)[0] as string) ?? "")}
                  >
                    {facilities.map((f) => (
                      <SelectItem key={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </Select>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Batal</Button>
                <Button color="success" className="bg-brand-600 font-semibold" onPress={save} isLoading={busy}>Buat Akun</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
