"use client";

/* Kelola draft panduan milik fasilitas sendiri + ajukan untuk ditinjau.
   Filter status via Tabs (data dari satu endpoint — filter sisi klien valid). */

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, Pencil, Plus, SendHorizontal } from "lucide-react";
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
  Skeleton,
  Tab,
  Tabs,
  Textarea,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { apiErrorMessage, createGuide, listMyGuides, submitGuide, updateGuide } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { CareGuide, CareGuideStatus } from "@/lib/types";

const COLOR = { DRAFT: "default", DITINJAU: "warning", AKTIF: "success", DINONAKTIFKAN: "default" } as const;

const TABS: Array<{ key: string; label: string; status: CareGuideStatus | "" }> = [
  { key: "SEMUA", label: "Semua", status: "" },
  { key: "DRAFT", label: "Draft", status: "DRAFT" },
  { key: "DITINJAU", label: "Ditinjau", status: "DITINJAU" },
  { key: "AKTIF", label: "Aktif", status: "AKTIF" },
];

export default function FacilityGuidesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<CareGuide[]>([]);
  const [tab, setTab] = useState("SEMUA");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [editing, setEditing] = useState<CareGuide | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceNote, setSourceNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMyGuides(token ?? undefined);
      setItems(res.guides);
    } catch (e) {
      setError(apiErrorMessage(e, "Gagal memuat panduan."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const status = TABS.find((t) => t.key === tab)?.status ?? "";
  const filtered = useMemo(
    () => (status ? items.filter((g) => g.status === status) : items),
    [items, status]
  );

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setSourceNote("");
    onOpen();
  };

  const openEdit = (g: CareGuide) => {
    setEditing(g);
    setTitle(g.title);
    setContent(g.content);
    setSourceNote(g.sourceNote ?? "");
    onOpen();
  };

  const save = async () => {
    if (title.trim().length < 3) return toast.error("Judul minimal 3 karakter.");
    if (content.trim().length < 10) return toast.error("Isi panduan minimal 10 karakter.");
    setBusy(true);
    try {
      const payload = { title: title.trim(), content: content.trim(), sourceNote: sourceNote.trim() || undefined };
      if (editing) {
        await updateGuide(editing.id, payload, token ?? undefined);
        toast.success("Draft diperbarui.");
      } else {
        await createGuide(payload, token ?? undefined);
        toast.success("Draft panduan dibuat.");
      }
      onClose();
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (g: CareGuide) => {
    try {
      await submitGuide(g.id, token ?? undefined);
      toast.success("Panduan diajukan untuk ditinjau SuperAdmin.");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Panduan Saya"
        description="Draft milik fasilitas Anda. Ajukan agar ditinjau dan diterbitkan ke halaman publik."
        actions={
          <Button color="success" className="bg-brand-600 font-semibold" startContent={<Plus className="h-4 w-4" aria-hidden />} onPress={openCreate}>
            Tulis Panduan
          </Button>
        }
      />

      <Tabs
        selectedKey={tab}
        onSelectionChange={(k) => setTab(String(k))}
        variant="solid"
        color="success"
        aria-label="Filter status panduan"
        classNames={{ tabList: "bg-white shadow-card" }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} title={t.label} />
        ))}
      </Tabs>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3" aria-hidden>
            {[0, 1].map((i) => (
              <Skeleton key={i} className="rounded-3xl">
                <div className="h-36" />
              </Skeleton>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Belum ada panduan" hint="Tulis panduan pertolongan awal pertama untuk fasilitas Anda." />
        ) : (
          <div className="space-y-3">
            {filtered.map((g) => (
              <Card key={g.id} className="border border-stone-200/70 shadow-card">
                <CardBody className="gap-2 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden>
                      <BookOpenText className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-extrabold text-stone-900">{g.title}</p>
                    <Chip size="sm" color={COLOR[g.status]} variant="flat">{g.status}</Chip>
                  </div>
                  <p className="line-clamp-3 whitespace-pre-line text-sm text-stone-600">{g.content}</p>
                  <p className="text-xs text-stone-400">Diperbarui {formatDateID(g.updatedAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    {(g.status === "DRAFT" || g.status === "DINONAKTIFKAN") && (
                      <>
                        <Button size="sm" variant="light" startContent={<Pencil className="h-3.5 w-3.5" aria-hidden />} onPress={() => openEdit(g)}>
                          Ubah
                        </Button>
                        <Tooltip content="Kirim ke SuperAdmin untuk ditinjau" placement="top" size="sm">
                          <Button size="sm" color="success" variant="flat" className="font-semibold" startContent={<SendHorizontal className="h-3.5 w-3.5" aria-hidden />} onPress={() => submit(g)}>
                            Ajukan Ditinjau
                          </Button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" scrollBehavior="inside">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>{editing ? "Ubah draft" : "Tulis panduan"}</ModalHeader>
              <ModalBody className="gap-3">
                <Input label="Judul" value={title} onValueChange={setTitle} isRequired aria-label="Judul panduan" />
                <Textarea label="Isi panduan" value={content} onValueChange={setContent} minRows={5} isRequired aria-label="Isi panduan" />
                <Input label="Catatan sumber (opsional)" value={sourceNote} onValueChange={setSourceNote} aria-label="Catatan sumber" />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Batal</Button>
                <Button color="success" className="bg-brand-600 font-semibold" onPress={save} isLoading={busy}>Simpan Draft</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
