import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCheck, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPatch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import type { NotificationList, NotificationItem, UnreadCount } from "@/types/api";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const canWriteNotifications = hasPermission("notifications.write");

  const notificationsQuery = useQuery({
    queryKey: ["notifications", 1],
    queryFn: () => apiGet<NotificationList>("/notifications/me", { page: 1, limit: 30 }),
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => apiGet<UnreadCount>("/notifications/me/unread-count"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiPatch<{ updatedCount: number }>("/notifications/me/read-all"),
    onSuccess: () => {
      queryClient.setQueryData<NotificationList | undefined>(["notifications", 1], (currentState) =>
        currentState
          ? {
              ...currentState,
              items: currentState.items.map((item) =>
                item.status === "UNREAD"
                  ? {
                      ...item,
                      status: "READ",
                      readAt: new Date().toISOString(),
                    }
                  : item,
              ),
            }
          : currentState,
      );
      queryClient.setQueryData<UnreadCount>(["notifications-unread"], { unreadCount: 0 });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => apiPatch<NotificationItem>(`/notifications/me/${id}/read`),
    onSuccess: (updatedItem) => {
      let unreadDelta = 0;

      queryClient.setQueryData<NotificationList | undefined>(["notifications", 1], (currentState) => {
        if (!currentState) {
          return currentState;
        }

        return {
          ...currentState,
          items: currentState.items.map((item) => {
            if (item.id !== updatedItem.id) {
              return item;
            }

            if (item.status === "UNREAD" && updatedItem.status === "READ") {
              unreadDelta = -1;
            }

            return updatedItem;
          }),
        };
      });

      queryClient.setQueryData<UnreadCount | undefined>(["notifications-unread"], (currentState) => ({
        unreadCount: Math.max((currentState?.unreadCount ?? 0) + unreadDelta, 0),
      }));
    },
  });

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return (notificationsQuery.data?.items ?? []).filter((item) => {
      const matchesStatus = statusFilter === "ALL" ? true : item.status === statusFilter;
      const haystack = `${item.title} ${item.body} ${item.type}`.toLowerCase();
      const matchesSearch = keyword ? haystack.includes(keyword) : true;
      return matchesStatus && matchesSearch;
    });
  }, [notificationsQuery.data?.items, search, statusFilter]);

  return (
    <div className="page-shell max-w-5xl page-stack">
      
      {/* Header Section */}
      <div className="page-header">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b2f00]">Communications</p>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f] flex items-center gap-3">
             <Inbox className="size-8" />
             Inbox
          </h2>
          <p className="text-[#424751] font-medium text-sm">Stay updated on system alerts, approvals, and reminders.</p>
        </div>
        
        <div className="page-actions">
            <div className="rounded-xl border border-[#c2c6d3]/40 bg-white px-4 py-2 flex items-center gap-2 shadow-sm font-bold text-sm text-[#191c1e]">
              <span className="w-2 h-2 rounded-full bg-[#00346f]"></span>
              {unreadQuery.data?.unreadCount ?? 0} Unread
            </div>
            <Button
              type="button"
              className="rounded-xl px-5 py-2.5 bg-gradient-to-br from-[#00346f] to-[#004a99] text-white shadow-md hover:bg-[#004a99] transition-colors font-bold text-sm h-auto"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending || !canWriteNotifications || unreadQuery.data?.unreadCount === 0}
            >
              <CheckCheck className="size-4 mr-2" />
              Mark all read
            </Button>
        </div>
      </div>

      <Card className="rounded-3xl border border-[#c2c6d3]/30 bg-white shadow-sm overflow-hidden flex flex-col h-full">
        <CardContent className="p-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <div className="page-actions sm:w-auto">
                 <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v ?? "ALL") as "ALL" | "UNREAD" | "READ")}>
                     <SelectTrigger className="h-11 w-full rounded-xl bg-[#f7f9fb] border-none font-medium shadow-none focus-visible:ring-0 sm:w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                     <SelectContent className="rounded-xl shadow-lg border-[#c2c6d3]/30">
                        <SelectItem value="ALL">All Updates</SelectItem><SelectItem value="UNREAD">Unread Only</SelectItem><SelectItem value="READ">Read Only</SelectItem>
                     </SelectContent>
                 </Select>
                 <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications..." className="h-11 w-full rounded-xl bg-[#f7f9fb] border-none px-4 shadow-none focus-visible:ring-0 md:w-[250px]" />
             </div>
             <p className="text-xs font-bold text-[#737783] uppercase tracking-widest">{filteredItems.length} items</p>
          </div>

          <ScrollArea className="h-[60vh] -mx-4 px-4 pr-6">
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full rounded-2xl border p-5 text-left transition-colors flex flex-col md:flex-row items-start justify-between gap-4 ${
                     item.status === 'UNREAD' ? 'bg-[#f5f8ff] border-[#00346f]/30 hover:bg-[#eaf1ff]' : 'bg-white border-[#c2c6d3]/30 hover:border-[#00346f]/50'
                  }`}
                  onClick={() => {
                    if (canWriteNotifications && item.status === "UNREAD") {
                      markOneMutation.mutate(item.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-4 flex-1">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === "UNREAD" ? "bg-[#00346f] text-white shadow-md" : "bg-[#eceef0] text-[#737783]"}`}>
                        <BellRing className="size-5" />
                     </div>
                     <div className="space-y-1 pr-4">
                        <div className={`font-bold ${item.status === 'UNREAD' ? 'text-[#00346f]' : 'text-[#191c1e]'}`}>{item.title}</div>
                        <div className="text-sm font-medium text-[#424751] line-clamp-2 leading-relaxed">{item.body}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#737783] mt-2 block">
                           {formatDateTime(item.createdAt)}
                        </div>
                     </div>
                  </div>
                  <div className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold ${item.status === "UNREAD" ? "bg-[#00346f] text-white" : "bg-[#f2f4f6] text-[#737783]"}`}>
                     {item.status}
                  </div>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="p-12 text-center text-sm font-medium text-[#737783] border border-dashed border-[#c2c6d3]/50 rounded-2xl bg-[#f7f9fb]">
                  All caught up! No notifications to display.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
