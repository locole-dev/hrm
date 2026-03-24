import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  History,
  ShieldCheck,
  TrendingDown,
  UserRound,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type {
  LeaveBalance,
  LeaveDashboard,
  LeaveRequest,
  LeaveType,
  TeamApprovalQueues,
} from "@/types/api";

function countLeaveDays(fromDate: string, toDate: string) {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function LeavePage() {
  const queryClient = useQueryClient();
  const { hasRole, user } = useAuth();
  const canApprove = hasRole("ADMIN") || hasRole("HR_MANAGER") || hasRole("MANAGER");
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView =
    canApprove && searchParams.get("view") === "team-approvals"
      ? "team-approvals"
      : "my-requests";
  const selectedRequestId =
    canApprove && searchParams.get("requestId") ? searchParams.get("requestId") : null;

  const [activeView, setActiveView] = useState<"my-requests" | "team-approvals">(requestedView);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const leaveDashboardQuery = useQuery({
    queryKey: ["leave-dashboard-me"],
    queryFn: () => apiGet<LeaveDashboard>("/leave/me"),
  });

  const leaveTypesQuery = useQuery({
    queryKey: ["leave-types"],
    queryFn: () => apiGet<LeaveType[]>("/leave/types"),
  });

  const teamApprovalsQuery = useQuery({
    queryKey: ["team-approvals"],
    queryFn: () => apiGet<TeamApprovalQueues>("/manager/team/approvals"),
    enabled: canApprove,
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const requestedDays = countLeaveDays(leaveForm.fromDate, leaveForm.toDate);

      if (!user?.employeeId) {
        throw new Error("Employee context is missing");
      }

      if (!leaveForm.leaveTypeId) {
        throw new Error("Please select a leave type");
      }

      if (!requestedDays) {
        throw new Error("Leave dates are invalid");
      }

      return apiPost<LeaveRequest>("/leave/requests", {
        employeeId: user.employeeId,
        leaveTypeId: leaveForm.leaveTypeId,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        requestedDays,
        reason: leaveForm.reason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-dashboard-me"] });
      queryClient.invalidateQueries({ queryKey: ["team-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-queue"] });
      toast.success("Leave request submitted");
      setLeaveForm({
        leaveTypeId: "",
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
        reason: "",
      });
      setIsRequestOpen(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to submit leave request";
      toast.error(message);
    },
  });

  const decideMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: "APPROVED" | "REJECTED" }) =>
      apiPatch<LeaveRequest>(`/leave/requests/${requestId}/decision`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-queue"] });
      queryClient.invalidateQueries({ queryKey: ["leave-dashboard-me"] });
      toast.success(
        variables.status === "APPROVED" ? "Leave request approved" : "Leave request rejected",
      );
    },
    onError: () => toast.error("Failed to update leave request"),
  });

  const balances = leaveDashboardQuery.data?.balances ?? [];
  const requests = leaveDashboardQuery.data?.requests ?? [];
  const teamApprovals = useMemo(() => {
    const pendingLeaveRequests = teamApprovalsQuery.data?.leaveRequests ?? [];

    if (!selectedRequestId) {
      return pendingLeaveRequests;
    }

    return [...pendingLeaveRequests].sort((currentRequest, nextRequest) => {
      if (currentRequest.id === selectedRequestId) {
        return -1;
      }

      if (nextRequest.id === selectedRequestId) {
        return 1;
      }

      return 0;
    });
  }, [selectedRequestId, teamApprovalsQuery.data]);
  const requestedDays = countLeaveDays(leaveForm.fromDate, leaveForm.toDate);

  useEffect(() => {
    setActiveView(requestedView);
  }, [requestedView]);

  return (
    <div className="page-shell max-w-7xl">
      <div className="page-header mb-8 lg:mb-12">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
            <span>Time Management</span>
            <ChevronRight className="size-3" />
            <span className="text-[#00346f]">Presence & Allocation</span>
          </nav>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">
            Leave Management
          </h2>
        </div>
        <button
          onClick={() => setIsRequestOpen(true)}
          className="h-12 px-8 rounded-2xl bg-[#00346f] text-white text-[13px] font-black tracking-tight shadow-xl shadow-[#00346f]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus className="size-5" strokeWidth={3} /> Request Time Off
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm relative overflow-hidden">
            <h3 className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-10">
              Available Allocation
            </h3>
            <div className="space-y-8 relative z-10">
              {balances.map((balance: LeaveBalance) => {
                const total =
                  Number(balance.openingBalance) +
                  Number(balance.accruedBalance) +
                  Number(balance.adjustedBalance);
                const used = Number(balance.usedBalance);
                const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;

                return (
                  <div key={balance.id} className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="font-bold text-[#191c1e] text-base leading-none">
                          {balance.leaveType.name}
                        </p>
                        <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest mt-2">
                          {balance.usedBalance} Used · {balance.accruedBalance} Accrued
                        </p>
                      </div>
                      <p className="text-3xl font-black text-[#00346f] font-headline tracking-tighter">
                        {balance.accruedBalance}
                      </p>
                    </div>
                    <div className="h-2 w-full bg-[#f7f9fb] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00346f] rounded-full transition-all duration-1000 group-hover:opacity-80"
                        style={{ width: `${100 - percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!balances.length && (
                <div className="p-8 text-center text-[#737783] font-bold border-2 border-dashed border-[#eceef0] rounded-3xl uppercase tracking-widest text-[9px]">
                  Awaiting entitlement audit...
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 bg-[#00346f]/5 rounded-full blur-3xl" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-[#f7f9fb] p-6 rounded-3xl border border-[#c2c6d3]/30">
              <CalendarDays className="size-6 text-[#00346f] mb-4" />
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                Team Impact
              </p>
              <p className="text-2xl font-black text-[#191c1e] font-headline mt-1">
                {teamApprovals.length}
              </p>
              <p className="text-[9px] font-bold text-[#0e9f6e] uppercase tracking-widest mt-1">
                Pending Sync
              </p>
            </div>
            <div className="bg-[#191c1e] p-6 rounded-3xl border border-none shadow-xl">
              <Clock className="size-6 text-white mb-4" />
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                History
              </p>
              <p className="text-2xl font-black text-white font-headline mt-1">
                {requests.length}
              </p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">
                Total Cycles
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="flex gap-10 border-b border-[#c2c6d3]/30 pb-4 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => {
                setActiveView("my-requests");
                setSearchParams((currentParams) => {
                  const nextParams = new URLSearchParams(currentParams);
                  nextParams.delete("view");
                  nextParams.delete("requestId");
                  return nextParams;
                });
              }}
              className={`relative font-bold text-sm transition-all pb-4 -mb-[18px] uppercase tracking-widest text-[10px] ${
                activeView === "my-requests" ? "text-[#00346f]" : "text-[#737783] hover:text-[#00346f]"
              }`}
            >
              Personal Cycles
              {activeView === "my-requests" && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00346f] rounded-full" />
              )}
            </button>
            {canApprove ? (
              <button
                onClick={() => {
                  setActiveView("team-approvals");
                  setSearchParams((currentParams) => {
                    const nextParams = new URLSearchParams(currentParams);
                    nextParams.set("view", "team-approvals");
                    return nextParams;
                  });
                }}
                className={`relative font-bold text-sm transition-all pb-4 -mb-[18px] uppercase tracking-widest text-[10px] ${
                  activeView === "team-approvals"
                    ? "text-[#00346f]"
                    : "text-[#737783] hover:text-[#00346f]"
                }`}
              >
                Approvals Pipeline
                {activeView === "team-approvals" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00346f] rounded-full" />
                )}
              </button>
            ) : null}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeView === "team-approvals" && canApprove ? (
              <div className="space-y-4">
                {teamApprovals.map((request) => (
                  <div
                    key={request.id}
                    className={`bg-white rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border transition-all group shadow-sm ${
                      request.id === selectedRequestId
                        ? "border-[#00346f]/40 ring-2 ring-[#00346f]/10"
                        : "border-[#eceef0] hover:border-[#00346f]/20"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="size-14 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] flex items-center justify-center text-[#c2c6d3] group-hover:bg-[#00346f] group-hover:text-white transition-all shadow-inner">
                        <UserRound className="size-7" />
                      </div>
                      <div>
                        {request.id === selectedRequestId ? (
                          <p className="text-[10px] font-black text-[#00346f] uppercase tracking-widest mb-2">
                            Selected from dashboard
                          </p>
                        ) : null}
                        <h4 className="font-black text-[#191c1e] text-lg font-headline leading-tight">
                          {request.employee?.fullName || "Employee Request"}
                        </h4>
                        <p className="text-[11px] font-bold text-[#737783] uppercase tracking-widest mt-1">
                          {request.leaveType.name} · {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                        </p>
                        {request.reason ? (
                          <p className="text-xs font-medium text-[#737783] mt-3 italic line-clamp-2">
                            {request.reason}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => decideMutation.mutate({ requestId: request.id, status: "APPROVED" })}
                        disabled={decideMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-white border border-[#eceef0] text-[10px] font-bold text-[#00346f] uppercase tracking-widest hover:bg-[#00346f] hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decideMutation.mutate({ requestId: request.id, status: "REJECTED" })}
                        disabled={decideMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-white border border-[#eceef0] text-[10px] font-bold text-[#ba1a1a] uppercase tracking-widest hover:bg-[#ba1a1a] hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {!teamApprovals.length && (
                  <div className="bg-[#f7f9fb] rounded-[2.5rem] p-20 text-center border border-dashed border-[#eceef0]">
                    <ShieldCheck className="size-16 text-[#c2c6d3] mx-auto mb-6" />
                    <h4 className="text-2xl font-black text-[#191c1e] font-headline mb-2">
                      Pipeline Clear
                    </h4>
                    <p className="text-sm font-bold text-[#737783] uppercase tracking-widest">
                      All organizational requests have been processed.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                  className="bg-white rounded-[2rem] p-7 flex flex-col gap-4 border border-[#eceef0] shadow-sm transition-all hover:border-[#00346f]/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className="size-14 rounded-2xl bg-[#00346f]/5 flex items-center justify-center text-[#00346f] relative overflow-hidden">
                        <History className="size-7" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#00346f] uppercase tracking-widest mb-1">
                          {request.status}
                        </p>
                        <h4 className="font-black text-[#191c1e] text-lg font-headline">
                          {request.leaveType.name}
                        </h4>
                        <p className="text-[11px] font-bold text-[#737783] uppercase tracking-widest mt-1">
                          {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                        </p>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-bold text-[#191c1e]">{request.requestedDays} day(s)</p>
                      {request.decisionNote ? (
                        <p className="text-[10px] font-medium text-[#737783] mt-2 max-w-44">
                          {request.decisionNote}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!requests.length && (
                  <div className="bg-[#f7f9fb] rounded-[2.5rem] p-20 text-center border border-dashed border-[#eceef0]">
                    <TrendingDown className="size-16 text-[#c2c6d3] mx-auto mb-6" />
                    <h4 className="text-2xl font-black text-[#191c1e] font-headline mb-2">
                      No Applications
                    </h4>
                    <p className="text-sm font-bold text-[#737783] uppercase tracking-widest">
                      You haven't initiated any time off cycles recently.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] card-pad-lg bg-white border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black font-headline text-[#00346f] tracking-tight">
              Request Time Off
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Category Designation
              </label>
              <Select
                value={leaveForm.leaveTypeId}
                onValueChange={(value) =>
                  setLeaveForm((currentState) => ({ ...currentState, leaveTypeId: value ?? "" }))
                }
              >
                <SelectTrigger className="h-14 rounded-[1.25rem] bg-[#f7f9fb] border-none font-bold text-sm">
                  <SelectValue placeholder="Select outcome type" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {leaveTypesQuery.data?.map((leaveType) => (
                    <SelectItem key={leaveType.id} value={leaveType.id} className="rounded-xl">
                      {leaveType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Starting Date
                </label>
                <Input
                  type="date"
                  className="h-14 rounded-[1.25rem] bg-[#f7f9fb] border-none font-bold"
                  value={leaveForm.fromDate}
                  onChange={(event) =>
                    setLeaveForm((currentState) => ({ ...currentState, fromDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Concluding Date
                </label>
                <Input
                  type="date"
                  className="h-14 rounded-[1.25rem] bg-[#f7f9fb] border-none font-bold"
                  value={leaveForm.toDate}
                  onChange={(event) =>
                    setLeaveForm((currentState) => ({ ...currentState, toDate: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="rounded-[1.25rem] bg-[#f7f9fb] border border-[#eceef0] px-5 py-4">
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                Requested Duration
              </p>
              <p className="text-lg font-black text-[#00346f] mt-1">
                {requestedDays || 0} day(s)
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Justification Brief
              </label>
              <textarea
                className="w-full h-32 rounded-[1.25rem] bg-[#f7f9fb] border-none p-5 font-medium text-sm focus:ring-2 focus:ring-[#00346f]/10 outline-none"
                placeholder="Enter context for this request..."
                value={leaveForm.reason}
                onChange={(event) =>
                  setLeaveForm((currentState) => ({ ...currentState, reason: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => setIsRequestOpen(false)}
              className="px-8 py-4 rounded-2xl bg-[#eceef0] text-[#737783] font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={() => createRequestMutation.mutate()}
              disabled={createRequestMutation.isPending || !leaveForm.reason.trim() || !requestedDays}
              className="px-10 py-4 rounded-2xl bg-[#00346f] text-white font-bold text-xs shadow-xl shadow-[#00346f]/20 uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {createRequestMutation.isPending ? "Submitting..." : "Deploy Request"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
