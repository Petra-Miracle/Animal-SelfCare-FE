"use client";

/* Kelola draft panduan milik fasilitas sendiri + ajukan untuk ditinjau. */

import { useCallback, useEffect, useState } from "react";
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
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { apiErrorMessage, createGuide, listMyGuides, submitGuide, updateGuide } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import PageHeader from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { formatDateID } from "@/lib/utils";
import type { CareGuide } from "@/lib/types";

const COLOR = { DRAFT: "default", DITINJAU: "warning", AKTIF: "success", DINONAKTIFKAN: "default" } as const;

export default function FacilityGuidesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<CareGuide[]>([]);
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
          <Button color="success" startContent={<Plus className="h-4 w-4" aria-hidden />} onPress={openCreate}>
            Tulis Panduan
          </Button>
        }
      />

      {loading ? (
        <LoadingState label="Memuat panduan…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada panduan" hint="Tulis panduan pertolongan awal pertama untuk fasilitas Anda." />
      ) : (
        <div className="space-y-3">
          {items.map((g) => (
            <Card key={g.id} className="border border-stone-100 shadow-sm">
              <CardBody className="gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <BookOpenText className="h-4 w-4 text-emerald-700" aria-hidden />
                  <p className="text-sm font-bold text-stone-900">{g.title}</p>
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
                      <Button size="sm" color="success" variant="flat" startContent={<SendHorizontal className="h-3.5 w-3.5" aria-hidden />} onPress={() => submit(g)}>
                        Ajukan Ditinjau
                      </Button>
                    </>
                  )}
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
              <ModalHeader>{editing ? "Ubah draft" : "Tulis panduan"}</ModalHeader>
              <ModalBody className="gap-3">
                <Input label="Judul" value={title} onValueChange={setTitle} isRequired aria-label="Judul panduan" />
                <Textarea label="Isi panduan" value={content} onValueChange={setContent} minRows={5} isRequired aria-label="Isi panduan" />
                <Input label="Catatan sumber (opsional)" value={sourceNote} onValueChange={setSourceNote} aria-label="Catatan sumber" />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Batal</Button>
                <Button color="success" onPress={save} isLoading={busy}>Simpan Draft</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
