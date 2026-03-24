import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  Clock, 
  Download, 
  LayoutGrid,
  List,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { apiGet, apiPatch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMinutes } from "@/lib/format";

export function AttendancePage() {
  const queryClient = useQueryClient();
  const current = new Date();
  const [year] = useState(current.getUTCFullYear());
  const [month] = useState(current.getUTCMonth() + 1);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"GRID" | "TIMELINE">("GRID");

  const attendanceQuery = useQuery({
    queryKey: ["attendance-records", year, month, search],
    queryFn: () => apiGet<{ items: any[], total: number }>("/attendance/records", { 
      page: 1, 
      limit: 50,
      search: search || undefined
    }),
  });

  const globalSummaryQuery = useQuery({
    queryKey: ["attendance-global-summary", year, month],
    queryFn: () => apiGet<{ 
      activeStaff: number, 
      avgCheckIn: string, 
      totalOvertimeHours: number, 
      latenessRate: number, 
      missingLogsCount: number 
    }>("/attendance/global-summary", { year, month }),
  });

  const approvalsQuery = useQuery({
    queryKey: ["manager-approvals"],
    queryFn: () => apiGet<{ pendingOvertime: any[], teamAttendance: any[] }>("/attendance/manager/approvals"),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: "APPROVED" | "REJECTED" }) => 
      apiPatch(`/attendance/overtime-requests/${id}/decision`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-global-summary"] });
      toast.success("Overtime decision recorded");
    },
    onError: () => toast.error("Failed to process request"),
  });

  const headerTextClass = "text-xl font-bold font-headline text-[#00346f]";

  const items = attendanceQuery.data?.items ?? [];
  const stats = globalSummaryQuery.data;

  return (
    <div className="page-shell max-w-7xl page-stack animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="page-header">
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
              <span>Time Management</span>
              <CheckCircle2 className="size-3 text-[#0e9f6e]" />
              <span className="text-[#00346f]">Presence Tracking</span>
           </div>
           <div className="space-y-1">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">Monthly Attendance</h2>
              <p className="text-[#424751] font-medium text-sm">
                Viewing records for {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year} • <span className="text-[#00346f] font-bold">{stats?.activeStaff ?? 0} Active Staff</span>
              </p>
           </div>
        </div>
        
        <div className="w-full rounded-2xl border border-[#c2c6d3]/30 bg-white p-2 shadow-sm transition-shadow hover:shadow-md md:w-auto">
           <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-[#737783] uppercase tracking-wider px-4 border-r border-[#eceef0]">Shift Period</span>
              <button className="px-5 py-2 font-bold text-[#191c1e] text-sm flex items-center gap-2 hover:bg-[#f7f9fb] rounded-xl transition-colors">
                 October 2023
                 <Calendar className="size-4 text-[#00346f]" />
              </button>
           </div>
        </div>
      </div>

      {/* Primary Metrics Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Avg Check-In */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm relative group hover:border-[#00346f]/20 transition-all">
           <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-4">Avg Check-In</p>
           <h3 className="text-4xl font-black font-headline text-[#191c1e] tracking-tighter">{stats?.avgCheckIn ?? "--:--"}</h3>
           <div className="mt-4 flex items-center gap-2 text-[#0e9f6e] text-[10px] font-bold uppercase tracking-widest">
              <CheckCircle2 className="size-3" /> Efficiency Optimal
           </div>
        </div>

        {/* Overtime Hours */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm group hover:border-[#00346f]/20 transition-all">
           <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-4">Overtime Volume</p>
           <h3 className="text-4xl font-black font-headline text-[#191c1e] tracking-tighter">
             {stats?.totalOvertimeHours ?? 0} <span className="text-sm font-medium text-[#737783]">hrs</span>
           </h3>
           <div className="mt-4 flex items-center gap-2 text-[#424751] text-[10px] font-bold uppercase tracking-widest">
              <Clock className="size-3" /> Cumulative Cycle
           </div>
        </div>

        {/* Lateness Rate */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm group hover:border-[#ba1a1a]/20 transition-all">
           <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-4">Lateness Rate</p>
           <h3 className="text-4xl font-black font-headline text-[#ba1a1a] tracking-tighter">
             {stats?.latenessRate ?? 0}%
           </h3>
           <div className="mt-4 flex items-center gap-2 text-[#ba1a1a] text-[10px] font-bold uppercase tracking-widest">
              <AlertCircle className="size-3" /> Action Recommended
           </div>
        </div>

        {/* Missing Logs */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm group hover:border-[#00346f]/20 transition-all">
           <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-4">Integrity Gaps</p>
           <h3 className="text-4xl font-black font-headline text-[#00346f] tracking-tighter">
             {stats?.missingLogsCount ?? 0} <span className="text-sm font-medium text-[#737783]">Issues</span>
           </h3>
           <div className="mt-4 flex items-center gap-2 text-[#00346f] text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:underline">
              Resolve Audit Log
           </div>
        </div>
      </div>

      {/* Control Surface */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col rounded-2xl border border-[#c2c6d3]/20 bg-[#f7f9fb] p-1.5 shadow-inner sm:w-auto sm:flex-row">
              <button 
                onClick={() => setView("GRID")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'GRID' ? 'bg-white shadow-md text-[#00346f]' : 'text-[#737783] hover:text-[#00346f]'}`}
              >
                  <LayoutGrid className="size-4" /> Comprehensive View
              </button>
              <button 
                onClick={() => setView("TIMELINE")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'TIMELINE' ? 'bg-white shadow-md text-[#00346f]' : 'text-[#737783] hover:text-[#00346f]'}`}
              >
                  <List className="size-4" /> Weekly Timeline
              </button>
          </div>

          <div className="page-actions w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#737783] group-focus-within:text-[#00346f] transition-colors" />
                <Input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Employee search..." 
                  className="h-11 pl-11 rounded-2xl bg-white border-[#c2c6d3]/40 shadow-none text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-[#00346f]/5 transition-all outline-none" 
                />
              </div>
              <button className="flex h-11 items-center justify-center gap-4 rounded-2xl border border-[#c2c6d3]/40 bg-white px-6 text-[11px] font-bold uppercase tracking-widest text-[#424751] shadow-sm transition-all hover:bg-[#f7f9fb]">
                 <Download className="size-4" /> Export Ledger
              </button>
          </div>
      </div>

      <div className="grid gap-8">
        
        {/* Main Log Repository */}
        <div className="bg-white rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fb] border-b border-[#eceef0]">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#737783]">Workforce Focus</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#737783]">Work Cycle</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#737783]">Operational Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#737783]">Interval In/Out</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#737783]">Total Delta</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-[#ba1a1a]">Lateness</th>
                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-[#00346f]">Premium (OT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {attendanceQuery.isLoading ? (
                    <tr><td colSpan={7} className="py-24 text-center text-[#737783] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Synchronizing building access logs...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7} className="py-24 text-center text-[#737783] text-[10px] font-black uppercase tracking-[0.2em]">Zero activity clusters detected.</td></tr>
                  ) : items.map((record) => (
                    <tr key={record.id} className="hover:bg-[#f7f9fb] transition-colors group cursor-default">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="size-11 rounded-2xl bg-[#eceef0] border-2 border-white shadow-sm flex items-center justify-center font-black text-xs text-[#00346f]">
                             {record.employee?.fullName?.[0] ?? "U"}
                           </div>
                           <div className="space-y-0.5">
                              <p className="font-bold text-[#191c1e] text-sm group-hover:text-[#00346f] transition-colors">{record.employee?.fullName}</p>
                              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">{record.employee?.employeeCode}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-[#191c1e]">{formatDate(record.workDate)}</td>
                      <td className="px-8 py-5">
                         <Badge className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-none ${
                            record.attendanceStatus === 'PRESENT' ? 'bg-[#def7ec] text-[#006e00]' : 
                            record.attendanceStatus === 'LATE' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 
                            record.attendanceStatus === 'ABSENT' ? 'bg-[#f2f4f6] text-[#737783]' : 
                            'bg-[#fff4de] text-[#b45d00]'
                         }`}>
                            {record.attendanceStatus}
                         </Badge>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-[#424751] font-headline">
                        {record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                        <span className="mx-2 opacity-20">/</span>
                        {record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="px-8 py-5 text-xs font-black text-[#191c1e]">{formatMinutes(record.workedMinutes)}</td>
                      <td className="px-10 py-5 text-xs font-black text-[#ba1a1a]">{record.lateMinutes > 0 ? `${record.lateMinutes}m` : "—"}</td>
                      <td className="px-10 py-5 text-xs font-black text-[#00346f]">
                        {record.overtimeMinutes > 0 ? `${record.overtimeMinutes}m` : "—"}
                        {record.overtimeRequest && <Badge className="ml-3 bg-[#f0f4f8] text-[#00346f] text-[8px] border-none font-black uppercase tracking-widest">Requested</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Decision Queue */}
           <div className="lg:col-span-8 bg-white rounded-[2.5rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm space-y-8 lg:space-y-10">
              <div className="flex justify-between items-center">
                 <h3 className={headerTextClass}>Pending Operational Adjustments <span className="text-sm font-medium text-[#737783] ml-2">({approvalsQuery.data?.pendingOvertime?.length ?? 0})</span></h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                 {(approvalsQuery.data?.pendingOvertime ?? []).map((req) => (
                    <div key={req.id} className="p-6 rounded-[2rem] bg-[#f7f9fb] border border-[#eceef0] space-y-6 hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-3 items-start">
                             <div className="size-10 rounded-xl bg-white border border-[#eceef0] flex items-center justify-center text-[#c2c6d3]"><Search className="size-5" /></div>
                             <div>
                                <p className="font-bold text-[#191c1e] text-sm">{req.employee?.fullName}</p>
                                <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest mt-1">
                                  {formatDate(req.workDate)} • 18:30 Check-Out
                                </p>
                             </div>
                          </div>
                       </div>
                       <p className="text-xs text-[#424751] font-medium leading-relaxed italic border-l-2 border-[#00346f]/20 pl-4">"{req.requestedNote || "Manual clock-out: Meeting ran late"}"</p>
                       <div className="flex gap-3">
                          <button 
                            disabled={decideMutation.isPending}
                            onClick={() => decideMutation.mutate({ id: req.id, status: 'APPROVED' })}
                            className="flex-1 py-3 rounded-xl bg-[#00346f] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#00346f]/10 hover:opacity-90 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button 
                            disabled={decideMutation.isPending}
                            onClick={() => decideMutation.mutate({ id: req.id, status: 'REJECTED' })}
                            className="flex-1 py-3 rounded-xl bg-white border border-[#c2c6d3]/40 text-[#ba1a1a] text-[10px] font-black uppercase tracking-widest hover:bg-[#ffdad6]/10 disabled:opacity-50"
                          >
                            Reject
                          </button>
                       </div>
                    </div>
                 ))}
                 {(!approvalsQuery.data?.pendingOvertime || approvalsQuery.data.pendingOvertime.length === 0) && (
                    <div className="sm:col-span-2 py-16 text-center text-[#737783] text-[10px] font-black uppercase tracking-[0.2em] bg-[#f7f9fb] rounded-3xl border border-dashed border-[#eceef0]">All operational adjustments cleared.</div>
                 )}
              </div>
           </div>

           {/* Visualization Legend */}
           <div className="lg:col-span-4 bg-[#191c1e] rounded-[2.5rem] card-pad-lg text-white shadow-xl flex flex-col justify-between">
              <div>
                 <h3 className="text-xl font-black font-headline mb-10">Attendance Legend</h3>
                 <div className="space-y-8">
                    {[
                      { color: "bg-[#ba1a1a] shadow-[0_0_12px_#ba1a1a]", label: "Lateness / Early Departure" },
                      { color: "bg-[#00346f] shadow-[0_0_12px_#00346f]", label: "Overtime Recorded" },
                      { color: "bg-[#0e9f6e] shadow-[0_0_12px_#0e9f6e]", label: "Remote / WFH Status" },
                      { color: "bg-[#737783] shadow-[0_0_12px_#737783]", label: "Approved Leave / Sick" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-5">
                         <div className={`size-3 rounded-full ${item.color}`}></div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">{item.label}</p>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="mt-12 pt-10 border-t border-white/10">
                 <p className="text-[9px] font-medium text-white/40 italic leading-relaxed">
                   Logs are automatically synchronized with building access systems every 15 minutes. Manual HR overrides are logged in the sovereign audit trail.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
