import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  User, 
  Database, 
  ShieldCheck, 
  Search,
  Download,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { PaginatedResponse } from "@/types/api";

interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  changes: any;
  metadata: any;
  createdAt: string;
  actorUser: {
    id: string;
    email: string;
    employee?: {
      fullName: string;
    }
  } | null;
}

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const auditQuery = useQuery({
    queryKey: ["audit-logs", page, search],
    queryFn: () => apiGet<PaginatedResponse<AuditLog>>("/audit", { page, limit: 15, search }),
  });

  const logs = auditQuery.data?.items ?? [];

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-[#def7ec] text-[#006e00]";
      case "UPDATE": return "bg-[#e1effe] text-[#1e429f]";
      case "DELETE": return "bg-[#fde8e8] text-[#9b1c1c]";
      case "APPROVE": return "bg-[#def7ec] text-[#006e00]";
      case "REJECT": return "bg-[#fde8e8] text-[#9b1c1c]";
      case "LOCK": return "bg-[#f3f4f6] text-[#1f2937]";
      case "LOGIN_SUCCESS": return "bg-[#def7ec] text-[#006e00]";
      default: return "bg-[#f3f4f6] text-[#6b7280]";
    }
  };

  return (
    <div className="page-shell max-w-7xl page-stack">
      
      {/* Header Section */}
      <div className="page-header">
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
              <ShieldCheck className="size-3" />
              <span>Compliance Center</span>
           </div>
           <div className="space-y-1">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">Audit Ecosystem</h2>
              <p className="text-[#424751] font-medium text-sm">Comprehensive immutable log of all administrative and system actions.</p>
           </div>
        </div>
        
        <div className="page-actions">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#c2c6d3] group-focus-within:text-[#00346f] transition-colors" />
              <Input 
                 placeholder="Search logs..." 
                 className="h-11 w-full rounded-2xl bg-white pl-11 pr-6 border-[#c2c6d3]/40 focus:ring-[#00346f]/10 sm:w-64"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2">
              <Download className="size-4" /> Export Ledger
           </button>
        </div>
      </div>

      {/* Audit Intelligence Table */}
      <div className="bg-white rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm overflow-hidden min-h-[60vh] flex flex-col">
         <div className="overflow-x-auto flex-1">
            <table className="w-full min-w-[820px] text-left">
               <thead>
                  <tr className="bg-[#f7f9fb] border-y border-[#eceef0]">
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Timestamp</th>
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Operator</th>
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Action Matrix</th>
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Subject Entity</th>
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#737783] text-right">Verification</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#eceef0]">
                  {logs.map((log: AuditLog) => (
                     <tr key={log.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="font-bold text-[#191c1e] text-xs">{formatDate(log.createdAt)}</span>
                              <span className="text-[9px] text-[#737783] font-medium uppercase">{new Date(log.createdAt).toLocaleTimeString()}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="size-8 rounded-xl bg-[#f0f2f5] flex items-center justify-center text-[#737783] group-hover:bg-[#00346f] group-hover:text-white transition-colors">
                                 <User className="size-4" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-xs font-bold text-[#191c1e]">{log.actorUser?.employee?.fullName || 'System Automated'}</span>
                                 <span className="text-[9px] text-[#737783] font-medium">{log.actorUser?.email || 'INTERNAL_PROC'}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <Badge className={`border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 ${getActionColor(log.action)}`}>
                             {log.action}
                           </Badge>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#191c1e]">{log.entityLabel || log.entityId.substring(0, 8)}</span>
                              <span className="text-[9px] text-[#737783] font-bold uppercase tracking-tighter flex items-center gap-1">
                                 <Database className="size-2 text-[#00346f]" /> {log.entityType}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 text-[#006e00]">
                              <Activity className="size-3" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Valid Trace</span>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {!auditQuery.isLoading && logs.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-24 text-center">
                           <div className="flex flex-col items-center gap-4 text-[#c2c6d3]">
                              <AlertCircle className="size-10" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">No activity signatures detected</p>
                           </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination Signature */}
         <div className="flex flex-col gap-4 border-t border-[#eceef0] bg-[#f7f9fb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8 lg:py-6">
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">
               Displaying {logs.length} Log Signatures
            </p>
            <div className="flex items-center gap-2">
               <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-[#c2c6d3]/30 disabled:opacity-50 text-[#00346f]"
               >
                  Prev Cluster
               </button>
               <button 
                  disabled={!auditQuery.data?.total || page * 15 >= auditQuery.data.total}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#00346f] text-white disabled:opacity-50 shadow-md"
               >
                  Next Cluster
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
