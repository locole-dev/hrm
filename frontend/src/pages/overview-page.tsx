import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  ArrowRightCircle,
  Download,
  Plus,
  CheckCircle2,
  CalendarRange,
  AlertCircle,
  CalendarDays,
  Clock3,
  FileText,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiDownload, apiGet, apiPatch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { 
  HrSummary, 
  LeaveRequest,
  TeamApprovalQueues,
} from "@/types/api";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OverviewPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);

  const hrSummaryQuery = useQuery({
    queryKey: ["hr-summary"],
    queryFn: () => apiGet<HrSummary>("/reports/hr-summary"),
  });

  const approvalsQuery = useQuery({
    queryKey: ["approvals-queue"],
    queryFn: () => apiGet<TeamApprovalQueues>("/manager/team/approvals"),
    enabled: hasPermission("manager.read"),
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiPatch<LeaveRequest>(`/leave/requests/${requestId}/decision`, { status: "APPROVED" }),
    onSuccess: (_, requestId) => {
      setSelectedLeaveRequest((currentRequest) =>
        currentRequest?.id === requestId ? null : currentRequest,
      );
      void queryClient.invalidateQueries({ queryKey: ["approvals-queue"] });
      void queryClient.invalidateQueries({ queryKey: ["team-approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["manager-team-approvals"] });
      void queryClient.invalidateQueries({ queryKey: ["leave-dashboard-me"] });
      toast.success("Leave request approved");
    },
    onError: () => {
      toast.error("Failed to approve leave request");
    },
  });

  const exportHrSummaryMutation = useMutation({
    mutationFn: () => apiDownload("/reports/hr-summary/export.csv"),
    onSuccess: (blob) => {
      const today = new Date().toISOString().slice(0, 10);
      saveBlob(blob, `hr-summary-${today}.csv`);
      toast.success("HR summary downloaded");
    },
    onError: () => {
      toast.error("Failed to download HR summary");
    },
  });

  const summary = hrSummaryQuery.data;
  const approvals = approvalsQuery.data;
  const approvingLeaveRequestId = approveLeaveMutation.isPending
    ? approveLeaveMutation.variables
    : null;
  const isSelectedLeaveRequestPending =
    approvingLeaveRequestId !== null && approvingLeaveRequestId === selectedLeaveRequest?.id;

  const baseCardClass = "bg-white rounded-3xl card-pad border border-[#c2c6d3]/30 shadow-sm overflow-hidden flex flex-col h-full";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";

  return (
    <div className="page-shell max-w-7xl page-stack">
      
      {/* Header Section */}
      <div className="page-header">
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
              <span>Overview</span>
              <ArrowRightCircle className="size-3" />
              <span className="text-[#00346f]">Dashboard</span>
           </div>
           <div className="space-y-1">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">Organization Insights</h2>
              <p className="text-[#424751] font-medium text-sm">Real-time snapshots of your workforce and pending operations.</p>
           </div>
        </div>
        
        <div className="page-actions">
           <button
              type="button"
              onClick={() => exportHrSummaryMutation.mutate()}
              disabled={exportHrSummaryMutation.isPending}
              className="h-11 px-6 rounded-2xl bg-white border border-[#c2c6d3]/40 text-sm font-bold text-[#424751] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
           >
              <Download className="size-4" />
              {exportHrSummaryMutation.isPending ? "Downloading..." : "Download Report"}
           </button>
           <button
              type="button"
              onClick={() => navigate("/employees?create=1")}
              className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
           >
              <Plus className="size-4" /> Add Employee
           </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         <div className={baseCardClass}>
            <div className="flex justify-between items-start mb-6">
               <div className="size-10 rounded-2xl bg-[#f5f8ff] text-[#00346f] flex items-center justify-center"><Users className="size-5" /></div>
               <Badge className="bg-[#def7ec] text-[#006e00] border-none text-[8px] font-black uppercase tracking-widest">+12</Badge>
            </div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Total Workforce</p>
            <h4 className="text-3xl font-black font-headline text-[#191c1e]">{summary?.totalEmployees ?? 0}</h4>
            <p className="text-[9px] font-medium text-[#737783] mt-2 underline cursor-pointer">View full directory</p>
         </div>
         
         <div className={baseCardClass}>
            <div className="flex justify-between items-start mb-6">
               <div className="size-10 rounded-2xl bg-[#fff4de] text-[#b45d00] flex items-center justify-center"><CheckCircle2 className="size-5" /></div>
            </div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Active Status</p>
            <h4 className="text-3xl font-black font-headline text-[#191c1e]">{summary?.activeEmployees ?? 0}</h4>
            <div className="mt-3 h-1 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
               <div className="h-full bg-[#0e9f6e] rounded-full" style={{ width: summary?.totalEmployees ? `${(summary.activeEmployees / summary.totalEmployees) * 100}%` : '0%' }}></div>
            </div>
         </div>

         <div className={baseCardClass}>
            <div className="flex justify-between items-start mb-6">
               <div className="size-10 rounded-2xl bg-[#f0f4f8] text-[#424751] flex items-center justify-center"><CalendarRange className="size-5" /></div>
            </div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Open Requests</p>
            <h4 className="text-3xl font-black font-headline text-[#191c1e]">
               {(approvals?.leaveRequests?.length ?? 0) + (approvals?.overtimeRequests?.length ?? 0)}
            </h4>
            <p className="text-[9px] font-medium text-[#737783] mt-2">Requires immediate attention</p>
         </div>

         <div className={baseCardClass}>
            <div className="flex justify-between items-start mb-6">
               <div className="size-10 rounded-2xl bg-[#ffecef] text-[#ba1a1a] flex items-center justify-center"><AlertCircle className="size-5" /></div>
            </div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Missing Records</p>
            <h4 className="text-3xl font-black font-headline text-[#ba1a1a]">0</h4>
            <p className="text-[9px] font-medium text-[#737783] mt-2">Compliance check complete</p>
         </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
         {/* Department Chart - Left Column */}
         <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
            <h3 className={headerTextClass}>Department Distribution</h3>
            <div className="bg-white rounded-[2.5rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm overflow-hidden min-h-[320px] sm:min-h-[400px] flex flex-col">
               <div className="mb-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:mb-12 lg:gap-8">
                  {summary?.departments?.map((dept, i) => (
                    <div key={dept.id} className="flex items-center gap-3">
                       <div className="size-3 rounded-full" style={{ backgroundColor: i % 2 === 0 ? '#00346f' : '#b45d00' }}></div>
                       <div>
                          <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">{dept.name}</p>
                          <p className="text-lg font-black text-[#191c1e]">{dept.employeeCount}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="flex flex-1 items-end justify-between gap-2 px-2 sm:px-4 md:px-10">
                  {summary?.departments?.map((dept, i) => {
                    const maxCount = Math.max(...(summary.departments?.map(d => d.employeeCount) || [1]));
                    const height = (dept.employeeCount / maxCount) * 100;
                    return (
                      <div key={dept.id} className="flex-1 flex flex-col items-center gap-4 group">
                         <div className="w-full relative">
                            <div 
                              className={`w-full rounded-t-2xl transition-all duration-700 delay-${i * 100} ${i % 2 === 0 ? 'bg-[#00346f]/10 group-hover:bg-[#00346f]' : 'bg-[#b45d00]/10 group-hover:bg-[#b45d00]'}`}
                              style={{ height: `${height}%`, minHeight: '40px' }}
                            >
                               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#191c1e] text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  {dept.employeeCount}
                               </div>
                            </div>
                         </div>
                         <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-[8px] font-black uppercase tracking-tighter text-[#737783] sm:text-[9px]">
                            {dept.name}
                         </p>
                      </div>
                    );
                  })}
               </div>
            </div>
         </div>

         {/* Pending Action Queue - Right Column */}
         <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
            <h3 className={headerTextClass}>Pending Actions</h3>
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm flex-1 space-y-8">
               
               {/* Leave Requests */}
               <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Leave Approvals</p>
                  <div className="space-y-3">
                     {approvals?.leaveRequests?.length === 0 ? (
                       <p className="text-xs font-medium text-[#c2c6d3] italic text-center py-4">No pending leave requests</p>
                     ) : approvals?.leaveRequests?.map((req) => (
                        <div key={req.id} className="p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] group hover:border-[#00346f]/30 transition-all">
                           <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-[#191c1e] text-sm">{req.employee?.fullName}</p>
                              <Badge className="bg-[#def7ec] text-[#006e00] text-[8px] border-none">New</Badge>
                           </div>
                           <p className="text-[10px] text-[#737783] font-medium">{req.leaveType?.name} • {formatDate(req.fromDate)}</p>
                           <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => approveLeaveMutation.mutate(req.id)}
                                disabled={approveLeaveMutation.isPending}
                                className="flex-1 py-1.5 rounded-lg bg-[#00346f] text-white text-[8px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {approvingLeaveRequestId === req.id ? "Saving..." : "Approve"}
                              </button>
                              <button
                                onClick={() => setSelectedLeaveRequest(req)}
                                className="flex-1 py-1.5 rounded-lg bg-white border border-[#c2c6d3]/30 text-[#191c1e] text-[8px] font-bold uppercase tracking-widest transition-colors hover:bg-[#f7f9fb]"
                              >
                                View
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Overtime Requests */}
               <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Overtime Review</p>
                  <div className="space-y-3">
                     {approvals?.overtimeRequests?.length === 0 ? (
                       <p className="text-xs font-medium text-[#c2c6d3] italic text-center py-4">No pending overtime</p>
                     ) : approvals?.overtimeRequests?.map((req) => (
                        <div key={req.id} className="p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] group">
                           <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-[#191c1e] text-sm">{req.employee?.fullName}</p>
                              <div className="size-2 rounded-full bg-[#00346f]"></div>
                           </div>
                           <p className="text-[10px] text-[#737783] font-medium">{formatDate(req.workDate)} • {req.totalMinutes}m</p>
                           <p className="mt-2 text-[9px] italic text-[#424751] line-clamp-1">{req.requestedNote}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <button
                  onClick={() =>
                    approvals?.leaveRequests?.length
                      ? navigate("/leave?view=team-approvals")
                      : approvals?.overtimeRequests?.length
                        ? navigate("/attendance")
                        : navigate("/leave")
                  }
                  className="w-full mt-4 py-3 rounded-2xl bg-[#00346f] text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#00346f]/20 hover:opacity-95 transition-opacity"
               >
                  Open Action Center
               </button>
            </div>
         </div>
      </div>

      <Dialog
        open={Boolean(selectedLeaveRequest)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedLeaveRequest(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl overflow-hidden rounded-[2rem] border-none bg-white p-0 shadow-2xl"
        >
          {selectedLeaveRequest ? (
            <>
              <div className="relative overflow-hidden bg-[#00346f] px-8 pb-8 pt-7 text-white">
                <DialogClose
                  render={
                    <button
                      type="button"
                      className="absolute right-5 top-5 inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/18"
                    />
                  }
                >
                  <X className="size-5" />
                  <span className="sr-only">Close</span>
                </DialogClose>
                <DialogHeader className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">
                    Pending Action Review
                  </p>
                  <DialogTitle className="max-w-2xl text-3xl font-black font-headline tracking-tight text-white">
                    Leave request snapshot
                  </DialogTitle>
                  <p className="max-w-2xl text-sm font-medium leading-6 text-white/80">
                    Review the leave context without leaving the dashboard, then approve when the request is ready to move.
                  </p>
                </DialogHeader>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge className="border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white shadow-none">
                    {selectedLeaveRequest.employee?.employeeCode ?? "Pending"}
                  </Badge>
                  <Badge className="border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white shadow-none">
                    {selectedLeaveRequest.leaveType?.name}
                  </Badge>
                  <Badge className="border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white shadow-none">
                    {selectedLeaveRequest.requestedDays} day(s)
                  </Badge>
                </div>
                <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-white/10 blur-3xl" />
              </div>

              <div className="grid gap-6 px-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-[#d7e2ff] bg-[#f5f8ff] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#737783]">
                      Request Owner
                    </p>
                    <div className="mt-4 flex items-start gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-[#00346f] shadow-sm ring-1 ring-[#d7e2ff]">
                        <UserRound className="size-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black font-headline text-[#191c1e]">
                          {selectedLeaveRequest.employee?.fullName || "Employee Request"}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#737783]">
                          {selectedLeaveRequest.leaveType?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-[#eceef0] bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3 text-[#00346f]">
                        <CalendarDays className="size-5" />
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#737783]">
                          Schedule
                        </p>
                      </div>
                      <p className="mt-4 text-lg font-black font-headline text-[#191c1e]">
                        {formatDate(selectedLeaveRequest.fromDate)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#737783]">
                        to {formatDate(selectedLeaveRequest.toDate)}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-[#eceef0] bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3 text-[#00346f]">
                        <Clock3 className="size-5" />
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#737783]">
                          Duration
                        </p>
                      </div>
                      <p className="mt-4 text-lg font-black font-headline text-[#191c1e]">
                        {selectedLeaveRequest.requestedDays} day(s)
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#737783]">
                        Submitted {formatDate(selectedLeaveRequest.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-[#eceef0] bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 text-[#00346f]">
                      <FileText className="size-5" />
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#737783]">
                        Request Note
                      </p>
                    </div>
                    <p className="mt-4 text-sm font-medium leading-7 text-[#424751]">
                      {selectedLeaveRequest.reason?.trim()
                        ? selectedLeaveRequest.reason
                        : "No additional explanation was included with this leave request."}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-[#d7e2ff] bg-[#f7f9fb] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#737783]">
                      Action Scope
                    </p>
                    <p className="mt-3 text-sm font-medium leading-7 text-[#424751]">
                      Approving here syncs the dashboard queue and the leave approvals pipeline immediately, so you do not need to open another screen unless deeper review is needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#eceef0] bg-[#fbfcff] px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#737783]">
                  Fast review flow for pending leave actions
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setSelectedLeaveRequest(null)}
                    className="h-12 rounded-2xl border border-[#d7dde8] bg-white px-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#424751] transition-colors hover:bg-[#f7f9fb]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => approveLeaveMutation.mutate(selectedLeaveRequest.id)}
                    disabled={approveLeaveMutation.isPending}
                    className="h-12 rounded-2xl bg-[#00346f] px-6 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#00346f]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSelectedLeaveRequestPending ? "Approving..." : "Approve Request"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
