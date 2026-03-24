import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Clock, CalendarRange, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch } from "@/lib/api";
import { formatCurrency, formatDate, formatMinutes } from "@/lib/format";
import type { EmployeeProfile, LeaveRequest, OvertimeRequest, TeamApprovalQueues, TeamAttendanceSnapshot, TeamMemberDetail } from "@/types/api";

type ApprovalDialogState = { type: "leave"; item: LeaveRequest } | { type: "ot"; item: OvertimeRequest } | null;
type ApprovalFilter = "ALL" | "LEAVE" | "OT";

function matchesKeyword(value: string, keyword: string) {
  return value.toLowerCase().includes(keyword.trim().toLowerCase());
}

export function TeamPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [approvedMinutes, setApprovedMinutes] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("ALL");

  const teamQuery = useQuery({ queryKey: ["manager-team"], queryFn: () => apiGet<EmployeeProfile[]>("/manager/team") });
  const attendanceQuery = useQuery({ queryKey: ["manager-team-attendance", today.getUTCFullYear(), today.getUTCMonth() + 1], queryFn: () => apiGet<TeamAttendanceSnapshot>("/manager/team/attendance", { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 }) });
  const approvalsQuery = useQuery({ queryKey: ["manager-team-approvals"], queryFn: () => apiGet<TeamApprovalQueues>("/manager/team/approvals") });
  const detailQuery = useQuery({ queryKey: ["manager-team-member", selectedEmployeeId], queryFn: () => apiGet<TeamMemberDetail>(`/manager/team/${selectedEmployeeId}`), enabled: Boolean(selectedEmployeeId) });

  function invalidateTeamData() {
    void queryClient.invalidateQueries({ queryKey: ["manager-team-member"] });
    void queryClient.invalidateQueries({ queryKey: ["leave-me"] });
    void queryClient.invalidateQueries({ queryKey: ["attendance-me"] });
  }

  function updateLeaveCaches(updatedRequest: LeaveRequest) {
    queryClient.setQueryData<TeamApprovalQueues | undefined>(["manager-team-approvals"], (currentState) => currentState ? { ...currentState, leaveRequests: currentState.leaveRequests.filter((request) => request.id !== updatedRequest.id) } : currentState);
    queryClient.setQueryData<TeamMemberDetail | undefined>(["manager-team-member", updatedRequest.employee?.id ?? selectedEmployeeId], (currentState) => currentState ? { ...currentState, profile: { ...currentState.profile, leaveRequests: currentState.profile.leaveRequests.map((request) => request.id === updatedRequest.id ? updatedRequest : request) }, summary: { ...currentState.summary, pendingLeaveRequestCount: Math.max(currentState.summary.pendingLeaveRequestCount - (updatedRequest.status === "PENDING" ? 0 : 1), 0) } } : currentState);
  }

  function updateOvertimeCaches(updatedRequest: OvertimeRequest) {
    queryClient.setQueryData<TeamApprovalQueues | undefined>(["manager-team-approvals"], (currentState) => currentState ? { ...currentState, overtimeRequests: currentState.overtimeRequests.filter((request) => request.id !== updatedRequest.id) } : currentState);
    queryClient.setQueryData<TeamMemberDetail | undefined>(["manager-team-member", updatedRequest.employee?.id ?? selectedEmployeeId], (currentState) => currentState ? { ...currentState, profile: { ...currentState.profile, overtimeRequests: currentState.profile.overtimeRequests.map((request) => request.id === updatedRequest.id ? updatedRequest : request) } } : currentState);
  }

  const leaveDecisionMutation = useMutation({
    mutationFn: (payload: { requestId: string; status: "APPROVED" | "REJECTED"; note?: string }) => apiPatch<LeaveRequest>(`/leave/requests/${payload.requestId}/decision`, { status: payload.status, note: payload.note }),
    onSuccess: (updatedRequest, variables) => { updateLeaveCaches(updatedRequest); toast.success(variables.status === "APPROVED" ? "Leave request approved" : "Leave request rejected"); setApprovalDialog(null); setDecisionNote(""); invalidateTeamData(); },
    onError: () => { toast.error("Failed to process leave request"); },
  });

  const overtimeDecisionMutation = useMutation({
    mutationFn: (payload: { requestId: string; status: "APPROVED" | "REJECTED"; approvedMinutes?: number; note?: string; }) => apiPatch<OvertimeRequest>(`/attendance/overtime-requests/${payload.requestId}/decision`, payload),
    onSuccess: (updatedRequest, variables) => { updateOvertimeCaches(updatedRequest); toast.success(variables.status === "APPROVED" ? "Overtime request approved" : "Overtime request rejected"); setApprovalDialog(null); setDecisionNote(""); setApprovedMinutes(""); invalidateTeamData(); },
    onError: () => { toast.error("Failed to process overtime request"); },
  });

  const teamMembers = useMemo(() => teamQuery.data ?? [], [teamQuery.data]);
  const teamLeaveRequests = useMemo(() => approvalsQuery.data?.leaveRequests ?? [], [approvalsQuery.data?.leaveRequests]);
  const teamOvertimeRequests = useMemo(() => approvalsQuery.data?.overtimeRequests ?? [], [approvalsQuery.data?.overtimeRequests]);

  const filteredTeamMembers = useMemo(() => {
    const keyword = teamSearch.trim().toLowerCase();
    if (!keyword) return teamMembers;
    return teamMembers.filter((member) => matchesKeyword([member.fullName, member.employeeCode, member.currentDepartment?.name ?? "", member.currentPosition?.name ?? "", member.employmentStatus].join(" "), keyword));
  }, [teamMembers, teamSearch]);

  const filteredAttendanceItems = useMemo(() => {
    const allowedEmployeeIds = new Set(filteredTeamMembers.map((member) => member.id));
    return (attendanceQuery.data?.items ?? []).filter((item) => allowedEmployeeIds.has(item.employeeId));
  }, [attendanceQuery.data?.items, filteredTeamMembers]);

  const approvalQueue = useMemo(() => {
    const leaveItems = teamLeaveRequests.map((request) => ({ kind: "leave" as const, id: request.id, searchText: [request.employee?.fullName ?? "", request.employee?.employeeCode ?? "", request.leaveType.name, request.status].join(" "), request }));
    const otItems = teamOvertimeRequests.map((request) => ({ kind: "ot" as const, id: request.id, searchText: [request.employee?.fullName ?? "", request.employee?.employeeCode ?? "", request.overtimeDayType, request.status].join(" "), request }));
    const items = [...leaveItems, ...otItems];
    const keyword = approvalSearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = approvalFilter === "ALL" ? true : approvalFilter === "LEAVE" ? item.kind === "leave" : item.kind === "ot";
      return matchesType && (keyword ? matchesKeyword(item.searchText, keyword) : true);
    });
  }, [approvalFilter, approvalSearch, teamLeaveRequests, teamOvertimeRequests]);

  if (teamMembers.length > 0 && !selectedEmployeeId) {
     setSelectedEmployeeId(teamMembers[0].id);
  }

  const baseCardClass = "bg-white rounded-3xl card-pad border border-[#c2c6d3]/30 shadow-sm overflow-hidden flex flex-col h-full";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";

  return (
    <div className="page-shell max-w-7xl page-stack">
      
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-4xl font-extrabold tracking-tight text-[#00346f] font-headline">Team Management</h2>
        <p className="font-medium text-[#424751] mt-2">Oversee team attendance, manage schedules, and review pending approvals.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl flex items-center gap-5 shadow-sm border border-[#c2c6d3]/30 border-l-4 border-l-[#00346f]">
           <div className="w-12 h-12 rounded-2xl bg-[#d5e3fc] flex items-center justify-center text-[#00346f]"><Users className="size-6" /></div>
           <div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Team Size</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{attendanceQuery.data?.teamSize ?? teamMembers.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl flex items-center gap-5 shadow-sm border border-[#c2c6d3]/30 border-l-4 border-l-[#ffb694]">
           <div className="w-12 h-12 rounded-2xl bg-[#ffdbcc] flex items-center justify-center text-[#833301]"><CalendarRange className="size-6" /></div>
           <div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Pending Leave</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{teamLeaveRequests.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl flex items-center gap-5 shadow-sm border border-[#c2c6d3]/30 border-l-4 border-l-[#abc7ff]">
           <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#00346f]"><Clock className="size-6" /></div>
           <div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Pending OT</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{teamOvertimeRequests.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl flex items-center gap-5 shadow-sm border border-[#c2c6d3]/30 border-l-4 border-l-[#737783]">
           <div className="w-12 h-12 rounded-2xl bg-[#eceef0] flex items-center justify-center text-[#424751]"><ListChecks className="size-6" /></div>
           <div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Total OT (Mins)</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{formatMinutes(filteredAttendanceItems.reduce((sum, item) => sum + item.totalOvertimeMinutes, 0))}</p></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        
        {/* Roster List */}
        <div className={baseCardClass}>
          <div className="mb-6 space-y-4">
             <h3 className={headerTextClass}>Team Roster</h3>
             <Input value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} placeholder="Search by name, code, or role" className="bg-[#f7f9fb] border-none shadow-none h-11 rounded-xl" />
          </div>
          <ScrollArea className="flex-1 -mx-4 px-4 h-[400px]">
            <div className="space-y-3">
              {filteredTeamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedEmployeeId(member.id)}
                  className={`w-full rounded-2xl p-4 text-left transition-all border ${
                    selectedEmployeeId === member.id ? "bg-[#f2f4f6] border-[#00346f]/50" : "bg-white border-[#c2c6d3]/30 hover:border-[#00346f]/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className={`font-bold ${selectedEmployeeId === member.id ? 'text-[#00346f]' : 'text-[#191c1e]'}`}>{member.fullName}</div>
                      <div className="text-xs font-medium text-[#737783] mt-0.5">{member.currentPosition?.name}</div>
                    </div>
                    <Badge className="shadow-none rounded-md px-2 py-0.5 text-[9px] uppercase tracking-widest bg-[#e0e3e5] text-[#424751] hover:bg-[#c2c6d3]">{member.employmentStatus}</Badge>
                  </div>
                </button>
              ))}
              {filteredTeamMembers.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-[#737783] border border-dashed border-[#c2c6d3]/50 rounded-2xl">No team members match search.</div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Member Detail Panel */}
        <div className={baseCardClass}>
           <h3 className={`${headerTextClass} mb-6`}>Member Insights</h3>
           {detailQuery.isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#737783] animate-pulse">Loading member details...</div>
           ) : detailQuery.data ? (
              <div className="space-y-6">
                 {/* Top Hero Banner */}
                 <div className="bg-gradient-to-br from-[#00346f] to-[#004a99] p-8 rounded-3xl text-white relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    <div className="relative z-10">
                       <h4 className="text-3xl font-extrabold font-headline mb-1">{detailQuery.data.profile.fullName}</h4>
                       <p className="text-white/80 font-medium">{detailQuery.data.profile.currentPosition?.name} • {detailQuery.data.profile.currentDepartment?.name}</p>
                       <div className="mt-6 flex flex-wrap gap-2">
                          <Badge className="bg-white/10 text-white hover:bg-white/20 px-3 py-1 text-[10px] tracking-widest uppercase">{detailQuery.data.profile.employeeCode}</Badge>
                          <Badge className="bg-white/10 text-white hover:bg-white/20 px-3 py-1 text-[10px] tracking-widest uppercase">{detailQuery.data.profile.employmentStatus}</Badge>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20">
                       <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1.5">Current Salary</p>
                       <p className="text-xl font-bold font-headline text-[#00346f]">{detailQuery.data.profile.contracts?.[0] ? formatCurrency(detailQuery.data.profile.contracts[0].baseSalary) : "—"}</p>
                    </div>
                    <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20">
                       <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1.5">Avg Attendance</p>
                       <p className="text-xl font-bold font-headline text-[#00346f]">{detailQuery.data.summary.recentAttendanceCount} <span className="text-sm font-medium text-[#737783]">days/mo</span></p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#737783] mb-3">Recent Leave</h5>
                       <div className="space-y-3">
                          {detailQuery.data.profile.leaveRequests.length === 0 && <p className="text-sm text-[#737783] p-4 bg-[#f7f9fb] rounded-xl">No requests</p>}
                          {detailQuery.data.profile.leaveRequests.slice(0, 3).map((request) => (
                             <div key={request.id} className="bg-white border border-[#c2c6d3]/30 p-3 rounded-xl shadow-sm text-sm">
                                <div className="flex justify-between items-center mb-1">
                                   <span className="font-bold text-[#191c1e]">{request.leaveType.name}</span>
                                   <Badge className="text-[8px] px-1.5">{request.status}</Badge>
                                </div>
                                <div className="text-[11px] font-medium text-[#737783]">{formatDate(request.fromDate)} - {formatDate(request.toDate)}</div>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div>
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#737783] mb-3">Recent Attendance</h5>
                       <div className="space-y-3">
                          {detailQuery.data.profile.attendanceRecords.length === 0 && <p className="text-sm text-[#737783] p-4 bg-[#f7f9fb] rounded-xl">No records</p>}
                          {detailQuery.data.profile.attendanceRecords.slice(0, 3).map((record) => (
                             <div key={record.id} className="bg-white border border-[#c2c6d3]/30 p-3 rounded-xl shadow-sm flex items-center justify-between text-sm">
                                <span className="font-bold text-[#191c1e]">{formatDate(record.workDate)}</span>
                                <span className={`font-medium ${record.attendanceStatus === 'PRESENT' ? 'text-[#0e9f6e]' : 'text-[#737783]'}`}>{record.attendanceStatus.substring(0,3)}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#737783] border border-dashed border-[#c2c6d3]/50 rounded-2xl bg-[#f7f9fb]">
                  Select a team member to view details.
               </div>
           )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2 lg:items-start">
        <div className={baseCardClass}>
           <h3 className={`${headerTextClass} mb-4`}>Attendance Overview</h3>
           <div className="overflow-x-auto -mx-4 px-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f7f9fb]/50">
                    <TableHead className="font-bold text-[#737783] uppercase tracking-widest text-[10px]">Employee</TableHead>
                    <TableHead className="font-bold text-[#737783] uppercase tracking-widest text-[10px]">Worked</TableHead>
                    <TableHead className="font-bold text-[#737783] uppercase tracking-widest text-[10px]">OT</TableHead>
                    <TableHead className="font-bold text-[#737783] uppercase tracking-widest text-[10px]">Late</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendanceItems.slice(0, 6).map((item) => (
                    <TableRow key={item.employeeId}>
                      <TableCell className="font-bold text-[#191c1e]">{item.fullName}</TableCell>
                      <TableCell className="text-[#424751] font-medium">{formatMinutes(item.totalWorkedMinutes)}</TableCell>
                      <TableCell className="text-[#424751] font-medium">{formatMinutes(item.totalOvertimeMinutes)}</TableCell>
                      <TableCell className="text-[#424751] font-medium">{item.lateCount}</TableCell>
                    </TableRow>
                  ))}
                  {filteredAttendanceItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-[#737783]">No attendance records in current month.</TableCell></TableRow>}
                </TableBody>
              </Table>
           </div>
        </div>

        <div className={baseCardClass}>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className={headerTextClass}>Approval Queue</h3>
              <div className="page-actions sm:w-auto">
                 <Select value={approvalFilter} onValueChange={(v) => setApprovalFilter((v ?? "ALL") as ApprovalFilter)}>
                    <SelectTrigger className="h-9 w-full rounded-lg bg-[#f7f9fb] border-none font-medium text-xs sm:w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-lg border-[#c2c6d3]/30">
                       <SelectItem value="ALL" className="text-xs">All Req</SelectItem><SelectItem value="LEAVE" className="text-xs">Leave Only</SelectItem><SelectItem value="OT" className="text-xs">OT Only</SelectItem>
                    </SelectContent>
                 </Select>
                 <Input value={approvalSearch} onChange={(e) => setApprovalSearch(e.target.value)} placeholder="Search..." className="h-9 w-full rounded-lg bg-[#f7f9fb] border-none text-xs shadow-none sm:w-[150px]" />
              </div>
           </div>

           <div className="flex-1 min-h-[300px] overflow-y-auto pr-2 space-y-3">
              {approvalQueue.length === 0 && <div className="text-center p-8 text-sm text-[#737783] border border-dashed border-[#c2c6d3]/50 rounded-2xl bg-[#f7f9fb]">Queue clearly mapped! No pending requests.</div>}
              {approvalQueue.map((item) => (
                 <div key={item.id} className="bg-white border border-[#c2c6d3]/30 p-4 rounded-2xl shadow-sm hover:border-[#00346f]/50 transition-colors flex items-center justify-between gap-4">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#191c1e] text-sm">{item.request.employee?.fullName}</span>
                          <span className="text-[#737783] text-xs font-bold uppercase tracking-widest">• {item.kind === 'leave' ? item.request.leaveType.name : `OT ${item.request.overtimeDayType}`}</span>
                       </div>
                       <div className="text-xs text-[#737783] font-medium">
                          {item.kind === 'leave' ? `${formatDate(item.request.fromDate)} - ${formatDate(item.request.toDate)}` : `${formatDate(item.request.workDate)} - ${formatMinutes(item.request.totalMinutes)}`}
                       </div>
                    </div>
                    <Button onClick={() => { setDecisionNote(""); if (item.kind === 'ot') setApprovedMinutes(String(item.request.totalMinutes)); setApprovalDialog({ type: item.kind, item: item.request } as ApprovalDialogState); }} className="h-8 text-xs font-bold bg-[#eceef0] text-[#00346f] hover:bg-[#d7e2ff] shadow-none rounded-lg whitespace-nowrap">Review</Button>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <Dialog open={Boolean(approvalDialog)} onOpenChange={(nextOpen) => { if (!nextOpen) { setApprovalDialog(null); setDecisionNote(""); setApprovedMinutes(""); } }}>
         <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-8 bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-4">
               <DialogTitle className="text-2xl font-bold font-headline text-[#00346f]">{approvalDialog?.type === "leave" ? "Review Leave" : "Review Overtime"}</DialogTitle>
            </DialogHeader>
            {approvalDialog ? (
               <div className="space-y-6">
                  <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20">
                     <p className="font-bold text-[#191c1e] mb-1">{approvalDialog.item.employee?.fullName}</p>
                     <p className="text-sm font-medium text-[#424751] mb-2">{approvalDialog.type === "leave" ? approvalDialog.item.leaveType.name : `OT ${approvalDialog.item.overtimeDayType}`}</p>
                     <div className="inline-block px-3 py-1 bg-[#eceef0] rounded-md text-xs font-bold text-[#737783]">
                        {approvalDialog.type === "leave" ? `${formatDate(approvalDialog.item.fromDate)} - ${formatDate(approvalDialog.item.toDate)}` : `${formatDate(approvalDialog.item.workDate)} (${formatMinutes(approvalDialog.item.totalMinutes)})`}
                     </div>
                  </div>

                  {approvalDialog.type === "ot" && (
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Approved Minutes</label>
                        <Input type="number" min="1" className="h-11 rounded-xl bg-[#f7f9fb] border-none focus-visible:ring-[#00346f]/20 font-medium" value={approvedMinutes} onChange={(e) => setApprovedMinutes(e.target.value)} />
                     </div>
                  )}

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Decision Note</label>
                     <Textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Provide context to the employee..." className="min-h-24 rounded-xl bg-[#f7f9fb] border-none focus-visible:ring-[#00346f]/20 font-medium resize-none shadow-none" />
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-[#eceef0]">
                     <Button type="button" className="flex-1 rounded-xl h-12 bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#93000a] shadow-none font-bold" onClick={() => { if (approvalDialog.type === "leave") { leaveDecisionMutation.mutate({ requestId: approvalDialog.item.id, status: "REJECTED", note: decisionNote }); return; } overtimeDecisionMutation.mutate({ requestId: approvalDialog.item.id, status: "REJECTED", note: decisionNote }); }} disabled={leaveDecisionMutation.isPending || overtimeDecisionMutation.isPending}>Reject Request</Button>
                     <Button type="button" className="flex-1 rounded-xl h-12 bg-[#00346f] hover:opacity-90 shadow-none font-bold text-white" onClick={() => { if (approvalDialog.type === "leave") { leaveDecisionMutation.mutate({ requestId: approvalDialog.item.id, status: "APPROVED", note: decisionNote }); return; } overtimeDecisionMutation.mutate({ requestId: approvalDialog.item.id, status: "APPROVED", approvedMinutes: Number(approvedMinutes), note: decisionNote }); }} disabled={leaveDecisionMutation.isPending || overtimeDecisionMutation.isPending}>Approve</Button>
                  </div>
               </div>
            ) : null}
         </DialogContent>
      </Dialog>
    </div>
  );
}
