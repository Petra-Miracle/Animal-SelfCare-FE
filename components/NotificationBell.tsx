"use client";

/* Lonceng notifikasi in-app: badge jumlah belum dibaca + dropdown daftar.
   Di-refresh saat event SSE "notification" tiba. */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Spinner,
} from "@heroui/react";
import { asArray, listNotifications, markNotificationRead } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { eventReportId, useRealtime } from "@/lib/sse";
import { useToast } from "@/lib/toast";
import { notificationLabel, timeAgoID } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export default function NotificationBell() {
  const { user, token } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await listNotifications(1, 10, token ?? undefined);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      /* gagal muat notifikasi tidak boleh mengganggu halaman */
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(
    (ev) => {
      if (ev.name !== "notification") return;
      load();
      const type = typeof ev.data.type === "string" ? ev.data.type : "NOTIFIKASI";
      toast.info(`Notifikasi baru: ${notificationLabel(type)}`);
    },
    !!user
  );

  if (!user) return null;
  const unread = items.filter((n) => !n.isRead).length;

  const openNotif = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id, token ?? undefined);
      } catch {
        /* abaikan */
      }
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    const reportId = n.reportId ?? eventReportId(n.payload ?? {});
    if (reportId) {
      router.push(user.role === "SUPERADMIN" ? `/admin/laporan/${reportId}` : `/fasilitas/laporan/${reportId}`);
    }
  };

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button isIconOnly variant="light" aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""}`}>
          <Badge content={unread > 0 ? unread : undefined} color="danger" size="sm" isInvisible={unread === 0}>
            <Bell className="h-5 w-5" aria-hidden />
          </Badge>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Daftar notifikasi"
        className="max-h-96 w-80 overflow-y-auto"
        emptyContent={loading ? "Memuat…" : "Belum ada notifikasi"}
      >
        <DropdownSection title={`Notifikasi (${total})`}>
          {loading && items.length === 0
            ? [
                <DropdownItem key="loading" isReadOnly textValue="Memuat">
                  <span className="flex items-center gap-2 text-sm text-stone-500">
                    <Spinner size="sm" aria-hidden /> Memuat…
                  </span>
                </DropdownItem>,
              ]
            : items.map((n) => (
                <DropdownItem
                  key={n.id}
                  textValue={notificationLabel(n.type)}
                  onPress={() => openNotif(n)}
                  description={timeAgoID(n.createdAt)}
                >
                  <span className={`text-sm ${n.isRead ? "font-normal text-stone-600" : "font-semibold text-stone-900"}`}>
                    {!n.isRead ? "● " : ""}
                    {notificationLabel(n.type)}
                  </span>
                </DropdownItem>
              ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
