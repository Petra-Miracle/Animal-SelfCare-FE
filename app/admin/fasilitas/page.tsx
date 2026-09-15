"use client";

/* CRUD fasilitas + toggle verifikasi. */

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Building, Pencil, Plus, Trash } from "lucide-react";
import {
  Alert,
  Avatar,
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
  Switch,
  Textarea,
  Tooltip,
  User as HeroUser,
  useDisclosure,
} from "@heroui/react";
import {
  apiErrorMessage,
  asArray,
  createFacility,
  deleteFacility,
  listFacilities,
  updateFacility,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import type { CareFacility } from "@/lib/types";

interface FormState {
  name: string;
  type: "HOSPITAL" | "ORGANISASI";
  email: string;
  phone: string;
  address: string;
  regionCity: string;
  isPaidPartner: boolean;
}

const EMPTY: FormState = {
  name: "",
  type: "HOSPITAL",
  email: "",
  phone: "",
  address: "",
  regionCity: "Kota Kupang",
  isPaidPartner: false,
};

export default function AdminFacilitiesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<CareFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [editing, setEditing] = useState<CareFacility | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleting, setDeleting] = useState<CareFacility | null>(null);
  const { isOpen: delOpen, onOpen: onDelOpen, onOpenChange: onDelChange, onClose: onDelClose } = useDisclosure();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(asArray<CareFacility>(await listFacilities(token ?? undefined), "facilities"));
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat fasilitas."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    onOpen();
  };

  const openEdit = (f: CareFacility) => {
    setEditing(f);
    setForm({
      name: f.name,
      type: f.type,
      email: f.email,
      phone: f.phone,
      address: f.address ?? "",
      regionCity: f.regionCity,
      isPaidPartner: f.isPaidPartner,
    });
    onOpen();
  };

  const save = async () => {
    if (form.name.trim().length < 2) return toast.error("Isi nama fasilitas.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return toast.error("Isi email fasilitas yang valid.");
    if (form.phone.trim().length < 8) return toast.error("Isi nomor telepon (min. 8 digit).");
    setBusy(true);
    try {
      if (editing) {
        await updateFacility(editing.id, { ...form, address: form.address || undefined }, token ?? undefined);
        toast.success("Fasilitas diperbarui.");
      } else {
        await createFacility({ ...form, address: form.address || undefined }, token ?? undefined);
        toast.success("Fasilitas baru ditambahkan.");
      }
      onClose();
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleVerified = async (f: CareFacility) => {
    try {
      await updateFacility(f.id, { isVerified: !f.isVerified }, token ?? undefined);
      toast.success(f.isVerified ? `${f.name} dinonaktifkan verifikasinya.` : `${f.name} terverifikasi.`);
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteFacility(deleting.id, token ?? undefined);
      toast.success("Fasilitas dihapus.");
      onDelClose();
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Kelola Fasilitas"
        description="Rumah sakit & organisasi mitra."
        actions={
          <Button color="success" className="bg-brand-600 font-semibold" startContent={<Plus className="h-4 w-4" aria-hidden />} onPress={openCreate}>
            Tambah Fasilitas
          </Button>
        }
      />

      <Alert
        color="warning"
        variant="faded"
        title="Hanya fasilitas terverifikasi yang bisa menerima penawaran laporan"
        className="mb-4"
      />

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="rounded-3xl">
              <div className="h-36" />
            </Skeleton>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada fasilitas" hint="Tambahkan rumah sakit atau organisasi mitra pertama." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((f) => (
            <Card key={f.id} className="border border-stone-200/70 shadow-card transition-shadow hover:shadow-lift">
              <CardBody className="gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={f.name.charAt(0).toUpperCase()}
                      className={f.isVerified ? "bg-brand-600 text-white" : "bg-stone-200 text-stone-600"}
                      size="md"
                    />
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-extrabold text-stone-900">
                        {f.name}
                        {f.isVerified ? <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" aria-label="Terverifikasi" /> : null}
                      </p>
                      <p className="text-xs text-stone-500">
                        {f.type === "HOSPITAL" ? "Rumah Sakit" : "Organisasi"} · {f.regionCity}
                        {f.address ? ` · ${f.address}` : ""}
                      </p>
                    </div>
                  </div>
                  <Chip size="sm" color={f.isVerified ? "success" : "default"} variant="flat">
                    {f.isVerified ? "Terverifikasi" : "Belum verif"}
                  </Chip>
                </div>
                <HeroUser
                  name={f.email}
                  description={f.phone}
                  avatarProps={{ icon: <Building className="h-4 w-4" aria-hidden />, className: "bg-stone-100 text-stone-500" }}
                />
                <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                  <Tooltip content={f.isVerified ? "Cabut verifikasi" : "Verifikasi fasilitas"} placement="top" size="sm">
                    <Switch
                      size="sm"
                      color="success"
                      isSelected={f.isVerified}
                      onValueChange={() => toggleVerified(f)}
                      aria-label={`Verifikasi ${f.name}`}
                    >
                      <span className="text-xs font-medium">Verifikasi</span>
                    </Switch>
                  </Tooltip>
                  <span className="flex-1" />
                  <Tooltip content="Ubah data fasilitas" placement="top" size="sm">
                    <Button size="sm" variant="light" isIconOnly aria-label={`Ubah ${f.name}`} onPress={() => openEdit(f)}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Hapus fasilitas" placement="top" size="sm">
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      isIconOnly
                      aria-label={`Hapus ${f.name}`}
                      onPress={() => {
                        setDeleting(f);
                        onDelOpen();
                      }}
                    >
                      <Trash className="h-4 w-4" aria-hidden />
                    </Button>
                  </Tooltip>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>{editing ? "Ubah fasilitas" : "Tambah fasilitas"}</ModalHeader>
              <ModalBody className="gap-3">
                <Input label="Nama" value={form.name} onValueChange={(v) => setForm((f) => ({ ...f, name: v }))} isRequired aria-label="Nama fasilitas" />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Tipe" selectedKeys={[form.type]} onSelectionChange={(k) => {
                    const v = Array.from(k)[0] as FormState["type"];
                    if (v) setForm((f) => ({ ...f, type: v }));
                  }}>
                    <SelectItem key="HOSPITAL">Rumah Sakit</SelectItem>
                    <SelectItem key="ORGANISASI">Organisasi</SelectItem>
                  </Select>
                  <Input label="Kota/Wilayah" value={form.regionCity} onValueChange={(v) => setForm((f) => ({ ...f, regionCity: v }))} aria-label="Kota wilayah" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Email" type="email" value={form.email} onValueChange={(v) => setForm((f) => ({ ...f, email: v }))} isRequired aria-label="Email fasilitas" />
                  <Input label="Telepon" inputMode="tel" value={form.phone} onValueChange={(v) => setForm((f) => ({ ...f, phone: v }))} isRequired aria-label="Telepon fasilitas" />
                </div>
                <Textarea label="Alamat" value={form.address} onValueChange={(v) => setForm((f) => ({ ...f, address: v }))} minRows={2} aria-label="Alamat fasilitas" />
                <Switch isSelected={form.isPaidPartner} onValueChange={(v) => setForm((f) => ({ ...f, isPaidPartner: v }))} color="success">
                  <span className="text-sm">Mitra berbayar</span>
                </Switch>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Batal</Button>
                <Button color="success" className="bg-brand-600 font-semibold" onPress={save} isLoading={busy}>Simpan</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={delOpen} onOpenChange={onDelChange} placement="center">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>Hapus fasilitas?</ModalHeader>
              <ModalBody>
                <p className="text-sm text-stone-600">
                  <strong>{deleting?.name}</strong> akan dihapus permanen. Akun admin yang terikat fasilitas ini bisa
                  terdampak.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onDelClose}>Batal</Button>
                <Button color="danger" onPress={confirmDelete} isLoading={busy}>Hapus</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
