import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Filter, 
  MoreVertical, 
  ArrowRight,
  ChevronLeft,
  Calendar,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

import { apiGet, apiPatch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { NotificationList } from "@/types/api";

export function NotificationPage() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications-me"],
    queryFn: () => apiGet<NotificationList>("/notifications/me"),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/me/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-me"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiPatch("/notifications/me/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-me"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("All notifications marked as read");
    },
  });

  const notifications = notificationsQuery.data?.items ?? [];

  const getIcon = (type: string) => {
    switch (type) {
      case "LEAVE_REQUEST":
      case "LEAVE_DECISION":
        return <Calendar className="size-5" />;
      case "PAYROLL_PUBLISHED":
        return <Wallet className="size-5" />;
      case "OT_DECISION":
        return <Clock className="size-5" />;
      default:
        return <Bell className="size-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "LEAVE_REQUEST": return "text-[#b45d00] bg-[#fff4de]";
      case "LEAVE_DECISION": return "text-[#006e00] bg-[#def7ec]";
      case "PAYROLL_PUBLISHED": return "text-[#00346f] bg-[#f5f8ff]";
      case "OT_DECISION": return "text-[#191c1e] bg-[#f0f4f8]";
      default: return "text-[#737783] bg-[#f7f9fb]";
    }
  };

  return (
    <div className="page-shell max-w-4xl page-stack min-h-screen">
      
      {/* Header */}
      <div className="page-header">
         <div className="flex items-start gap-4 sm:items-center">
            <Link to="/" className="size-10 rounded-2xl bg-white border border-[#c2c6d3]/30 flex items-center justify-center text-[#737783] hover:text-[#00346f] transition-colors shadow-sm">
               <ChevronLeft className="size-5" />
            </Link>
            <div className="space-y-1">
               <h2 className="text-3xl font-black font-headline tracking-tighter text-[#00346f]">Alert Center</h2>
               <p className="text-[#737783] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#ba1a1a] animate-pulse"></span> {notificationsQuery.data?.total || 0} Notifications in queue
               </p>
            </div>
         </div>
         
         <div className="page-actions">
            <button className="h-10 px-5 rounded-xl bg-white border border-[#c2c6d3]/30 text-[10px] font-bold uppercase tracking-widest text-[#424751] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2 shadow-sm">
               <Filter className="size-3.5" /> Filter Center
            </button>
            <button 
               onClick={() => markAllReadMutation.mutate()}
               className="h-10 px-5 rounded-xl bg-[#00346f] text-white text-[10px] font-bold uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
               <CheckCircle2 className="size-3.5" /> Finalize Read Status
            </button>
         </div>
      </div>

      {/* Main Notification List */}
      <div className="space-y-4">
         {notifications.map((item) => (
            <div 
               key={item.id} 
               className={`group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-[2rem] border p-6 transition-all sm:flex-row sm:items-start ${
                  item.status === 'UNREAD' 
                  ? 'bg-white border-[#00346f]/20 shadow-lg shadow-[#00346f]/5' 
                  : 'bg-[#f7f9fb]/50 border-transparent hover:bg-white hover:border-[#c2c6d3]/30'
               }`}
               onClick={() => item.status === 'UNREAD' && markReadMutation.mutate(item.id)}
            >
               {item.status === 'UNREAD' && (
                  <div className="absolute top-0 right-0 p-3">
                     <div className="size-2 rounded-full bg-[#00346f]"></div>
                  </div>
               )}
               
               <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconColor(item.type)}`}>
                  {getIcon(item.type)}
               </div>

               <div className="flex-1 space-y-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                     <p className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'UNREAD' ? 'text-[#00346f]' : 'text-[#737783]'}`}>
                        {item.type.replace('_', ' ')}
                     </p>
                     <p className="text-[10px] font-bold text-[#c2c6d3] uppercase tracking-tighter">{formatDate(item.createdAt)}</p>
                  </div>
                  <h3 className={`text-base font-bold font-headline ${item.status === 'UNREAD' ? 'text-[#191c1e]' : 'text-[#424751]'}`}>
                     {item.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${item.status === 'UNREAD' ? 'text-[#424751]' : 'text-[#737783] font-medium'}`}>
                     {item.body}
                  </p>
               </div>

               <div className="flex h-full flex-col justify-center gap-2 pl-0 opacity-100 transition-opacity sm:pl-4 sm:opacity-0 sm:group-hover:opacity-100">
                  <button className="size-10 rounded-xl bg-white border border-[#eceef0] flex items-center justify-center text-[#737783] hover:text-[#00346f] transition-colors"><MoreVertical className="size-4" /></button>
               </div>
            </div>
         ))}

         {notifications.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-[#c2c6d3]/30 shadow-inner">
               <div className="size-20 rounded-[2.5rem] bg-[#f7f9fb] mx-auto mb-8 flex items-center justify-center text-[#c2c6d3] border-4 border-dashed border-[#eceef0]">
                  <Bell className="size-8" />
               </div>
               <h4 className="text-xl font-black font-headline text-[#191c1e] mb-2">Zero Active Alerts</h4>
               <p className="text-[#737783] font-medium text-sm">Your operational queue is currently pristine.</p>
               <Link to="/" className="mt-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00346f] underline">
                  Return to Headquarters <ArrowRight className="size-3" />
               </Link>
            </div>
         )}
      </div>

      {/* Pagination Placeholder */}
      <div className="flex justify-center pt-8">
         <div className="flex gap-2">
            {[1, 2, 3].map(n => (
               <button key={n} className={`size-10 rounded-xl text-[10px] font-bold border transition-all ${n === 1 ? 'bg-[#00346f] text-white border-transparent' : 'bg-white border-[#c2c6d3]/30 text-[#737783] hover:border-[#00346f]/30'}`}>{n}</button>
            ))}
         </div>
      </div>
    </div>
  );
}
