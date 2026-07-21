"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Pencil, Archive, Trash2, User } from "lucide-react";
import Link from "next/link";
import { apiClient, type ThreadSummary } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "./logo";
import { cn, formatRelative } from "@/lib/utils";

const COLLAPSED_KEY = "chat_sidebar_collapsed";

/** Group threads into "Hôm nay" / "7 ngày qua" / "Cũ hơn" buckets by lastMessageAt. */
function groupThreads(threads: ThreadSummary[]) {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const weekAgoMs = now - 7 * 86400_000;

  const today: ThreadSummary[] = [];
  const week: ThreadSummary[] = [];
  const older: ThreadSummary[] = [];

  for (const t of threads) {
    const ts = new Date(t.lastMessageAt).getTime();
    if (ts >= todayMs) today.push(t);
    else if (ts >= weekAgoMs) week.push(t);
    else older.push(t);
  }

  return [
    { label: "Hôm nay", items: today },
    { label: "7 ngày qua", items: week },
    { label: "Cũ hơn", items: older },
  ].filter((g) => g.items.length > 0);
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const threadsQ = useQuery({
    queryKey: ["threads"],
    queryFn: () => apiClient.threads.list(),
  });

  const createMut = useMutation({
    mutationFn: () => apiClient.threads.create(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      router.push(`/c/${res.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeId = pathname?.startsWith("/c/") ? pathname.split("/")[2] : null;
  const threads = threadsQ.data?.threads || [];
  const groups = useMemo(() => groupThreads(threads), [threads]);

  return (
    <aside
      className={cn(
        "shrink-0 overflow-hidden border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
        "flex flex-col transition-[width] duration-200",
        collapsed ? "w-14" : "w-72",
      )}
    >
      {/* Header — collapsed: chỉ hiện nút expand, ẩn logo hoàn toàn */}
      <div
        className={cn(
          "h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3",
          collapsed ? "justify-center" : "gap-1.5",
        )}
      >
        {!collapsed && <Logo />}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "size-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800",
            !collapsed && "ml-auto",
          )}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* New chat button */}
      <div className="p-2.5">
        <Button
          className="w-full justify-start"
          size="sm"
          disabled={createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          <Plus className="size-4" />
          {!collapsed && "Trò chuyện mới"}
        </Button>
      </div>

      {/* Thread list */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-1.5 pb-2">
        {threadsQ.isLoading && !collapsed && (
          <div className="text-xs text-zinc-500 px-3 py-4">Đang tải…</div>
        )}
        {!threadsQ.isLoading && threads.length === 0 && !collapsed && (
          <div className="text-xs text-zinc-500 italic px-3 py-4">Chưa có chat.</div>
        )}
        {collapsed
          ? threads.map((t) => (
              <ThreadRow key={t.id} thread={t} active={activeId === t.id} collapsed />
            ))
          : groups.map((g) => (
              <div key={g.label}>
                <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 px-3 pt-3.5 pb-1.5">
                  {g.label}
                </div>
                {g.items.map((t) => (
                  <ThreadRow key={t.id} thread={t} active={activeId === t.id} collapsed={false} />
                ))}
              </div>
            ))}
      </nav>

      {/* Footer — ẩn hoàn toàn khi collapsed (không đủ chỗ hiện label) */}
      {!collapsed && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-2.5">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Giao diện tối
            </span>
            <ThemeToggle className="ml-auto" />
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <User className="size-4 text-zinc-400" strokeWidth={2} />
            </div>
            <div className="min-w-0 truncate text-xs text-zinc-500">Bạn chưa đăng nhập</div>
          </div>
        </div>
      )}
    </aside>
  );
}

function ThreadRow({
  thread,
  active,
  collapsed,
}: {
  thread: ThreadSummary;
  active: boolean;
  collapsed: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();

  const renameMut = useMutation({
    mutationFn: ({ title }: { title: string }) =>
      apiClient.threads.update(thread.id, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Đã đổi tên");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const archiveMut = useMutation({
    mutationFn: () =>
      apiClient.threads.update(thread.id, { archivedAt: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Đã lưu trữ");
    },
  });
  const deleteMut = useMutation({
    mutationFn: () => apiClient.threads.delete(thread.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Đã xoá");
      router.push("/");
    },
  });

  const displayTitle = thread.title || "Cuộc trò chuyện mới";

  return (
    <div
      className={cn(
        "group relative flex items-center rounded-lg",
        active
          ? "bg-brand/10 dark:bg-brand/15"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
      )}
    >
      <Link
        href={`/c/${thread.id}`}
        className={cn("flex-1 min-w-0 px-3 py-2.5", collapsed && "text-center")}
        title={collapsed ? displayTitle : undefined}
      >
        {collapsed ? (
          <span className="text-xs text-zinc-500">
            {displayTitle.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <>
            <div
              className={cn(
                "text-[13.5px] font-medium truncate",
                active ? "text-brand" : "text-zinc-900 dark:text-zinc-100",
              )}
            >
              {displayTitle}
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {formatRelative(thread.lastMessageAt)}
            </div>
          </>
        )}
      </Link>
      {!collapsed && (
        <Dropdown
          trigger={
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 size-7 mr-1 rounded-lg flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <MoreHorizontal className="size-4" />
            </button>
          }
        >
          <DropdownItem
            onClick={() => {
              const next = prompt("Đổi tên:", displayTitle);
              if (next && next.trim()) renameMut.mutate({ title: next.trim() });
            }}
          >
            <Pencil className="size-3.5 inline mr-2" /> Đổi tên
          </DropdownItem>
          <DropdownItem onClick={() => archiveMut.mutate()}>
            <Archive className="size-3.5 inline mr-2" /> Lưu trữ
          </DropdownItem>
          <DropdownItem
            destructive
            onClick={() => {
              if (confirm(`Xoá "${displayTitle}"?`)) deleteMut.mutate();
            }}
          >
            <Trash2 className="size-3.5 inline mr-2" /> Xoá
          </DropdownItem>
        </Dropdown>
      )}
    </div>
  );
}
