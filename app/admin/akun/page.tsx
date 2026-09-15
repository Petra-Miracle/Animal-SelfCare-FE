"use client";

/* Kelola akun: buat Admin RS (wajib facilityId) / SuperAdmin, nonaktifkan akun. */

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Mail, Plus, UserX } from "lucide-react";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
  Select,
  SelectItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
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
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="rounded-3xl">
              <div className="h-20" />
            </Skeleton>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada akun" />
      ) : (
        <ScrollShadow orientation="horizontal" className="rounded-3xl border border-stone-200/80 bg-white shadow-card">
          <Table aria-label="Daftar akun" removeWrapper>
            <TableHeader>
              <TableColumn>AKUN</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>AKSI</TableColumn>
            </TableHeader>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id} className={u.isActive ? "" : "opacity-60"}>
                  <TableCell className="min-w-56">
                    <HeroUser
                      name={u.email}
                      description={[u.phone, formatDateID(u.createdAt)].filter(Boolean).join(" · ")}
                      avatarProps={{
                        name: u.email.charAt(0).toUpperCase(),
                        className: u.role === "SUPERADMIN" ? "bg-violet-600 text-white" : "bg-brand-600 text-white",
                        size: "sm",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-stone-700">
                      {u.role === "SUPERADMIN" ? "SuperAdmin" : `Admin RS`}
                    </span>
                    {u.role === "ADMIN_RS" && u.facilityId ? (
                      <p className="max-w-48 truncate text-xs text-stone-400">{facilityName[u.facilityId] ?? "Fasilitas"}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={u.isActive ? "success" : "default"} variant="flat">
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {u.isActive && u.id !== user?.id ? (
                      <Tooltip content="Cabut akses masuk akun ini" placement="top" size="sm">
                        <Button size="sm" variant="light" color="danger" startContent={<UserX className="h-3.5 w-3.5" aria-hidden />} onPress={() => deactivate(u)}>
                          Nonaktifkan
                        </Button>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollShadow>
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
