import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarRange,
  Clock,
  Plus,
  ArrowRightCircle,
  List,
  MoreHorizontal,
  Pause,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate, formatMinutes } from "@/lib/format";
import type {
  AttendanceDashboard,
  AttendanceMonthlySummary,
  EmployeeProfile,
} from "@/types/api";

type OvertimeFormState = {
  workDate: string;
  startTime: string;
  endTime: string;
  overtimeDayType: "WEEKDAY" | "WEEKEND" | "PUBLIC_HOLIDAY";
  requestedNote: string;
};

function minutesBetween(workDate: string, startTime: string, endTime: string) {
  const start = new Date(`${workDate}T${startTime}:00`);
  const end = new Date(`${workDate}T${endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function WorkspacePage() {
  const queryClient = useQueryClient();
  const current = new Date();

  const [viewMode, setViewMode] = useState<"TABLE" | "CALENDAR">("TABLE");
  const [isOvertimeOpen, setIsOvertimeOpen] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState<OvertimeFormState>({
    workDate: new Date().toISOString().split("T")[0],
    startTime: "18:30",
    endTime: "20:00",
    overtimeDayType: "WEEKDAY",
    requestedNote: "",
  });

  const profileQuery = useQuery({
    queryKey: ["employee-me"],
    queryFn: () => apiGet<EmployeeProfile>("/employees/me"),
  });

  const attendanceQuery = useQuery({
    queryKey: ["attendance-me"],
    queryFn: () => apiGet<AttendanceDashboard>("/attendance/me"),
  });

  const summaryQuery = useQuery({
    queryKey: ["attendance-summary-me", current.getFullYear(), current.getMonth() + 1],
    queryFn: () =>
      apiGet<AttendanceMonthlySummary>("/attendance/me/monthly-summary", {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
      }),
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiPost("/attendance/me/check-in", { note: "Self-service check-in" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-me"] });
      toast.success("Successfully checked in");
    },
    onError: () => toast.error("Check-in failed"),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => apiPost("/attendance/me/check-out", { note: "Self-service check-out" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-me"] });
      toast.success("Successfully checked out");
    },
    onError: () => toast.error("Check-out failed"),
  });

  const overtimeMutation = useMutation({
    mutationFn: () => {
      const totalMinutes = minutesBetween(
        overtimeForm.workDate,
        overtimeForm.startTime,
        overtimeForm.endTime,
      );

      if (!profileQuery.data?.id) {
        throw new Error("Employee context is missing");
      }

      if (!totalMinutes) {
        throw new Error("Invalid overtime interval");
      }

      return apiPost("/attendance/overtime-requests", {
        employeeId: profileQuery.data.id,
        workDate: overtimeForm.workDate,
        startAt: new Date(`${overtimeForm.workDate}T${overtimeForm.startTime}:00`).toISOString(),
        endAt: new Date(`${overtimeForm.workDate}T${overtimeForm.endTime}:00`).toISOString(),
        totalMinutes,
        overtimeDayType: overtimeForm.overtimeDayType,
        requestedNote: overtimeForm.requestedNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-me"] });
      queryClient.invalidateQueries({
        queryKey: ["attendance-summary-me", current.getFullYear(), current.getMonth() + 1],
      });
      toast.success("Overtime request submitted");
      setIsOvertimeOpen(false);
      setOvertimeForm({
        workDate: new Date().toISOString().split("T")[0],
        startTime: "18:30",
        endTime: "20:00",
        overtimeDayType: "WEEKDAY",
        requestedNote: "",
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to submit overtime request";
      toast.error(message);
    },
  });

  const employee = profileQuery.data;
  const attendance = attendanceQuery.data;
  const summary = summaryQuery.data;

  const records = attendance?.records ?? [];
  const lastRecord = records[0];
  const isCheckedIn = Boolean(lastRecord && !lastRecord.checkOutAt);
  const overtimeMinutes = minutesBetween(
    overtimeForm.workDate,
    overtimeForm.startTime,
    overtimeForm.endTime,
  );

  const baseCardClass =
    "bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm relative overflow-hidden";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";
  const currentTimeStr = current.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hours, mins] = currentTimeStr.split(":");
  const ampm = current.getHours() >= 12 ? "PM" : "AM";

  return (
    <div className="page-shell max-w-7xl page-stack">
      <div className="page-header">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
            <span>My Workspace</span>
            <ArrowRightCircle className="size-3" />
            <span className="text-[#00346f]">Time Tracking</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">
              Time Tracking
            </h2>
            <p className="text-[#424751] font-medium text-sm">
              Manage your daily attendance and submit overtime requests from one place.
            </p>
          </div>
        </div>

        <div className="page-actions">
          <button className="h-11 px-6 rounded-2xl bg-white border border-[#c2c6d3]/40 text-sm font-bold text-[#424751] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2">
            <List className="size-4" /> View Logs
          </button>
          <button
            onClick={() => setIsOvertimeOpen(true)}
            className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="size-4" /> Request Overtime
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">
                Active Shift
              </p>
              <p className="text-[11px] font-bold text-[#424751]">{formatDate(current.toISOString())}</p>
            </div>
            <Badge className="bg-[#f0f4f8] text-[#00346f] border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg">
              {employee?.defaultShift?.name ?? "Regular"}
            </Badge>
          </div>

          <div className="my-4">
            <h3 className="text-4xl font-black font-headline text-[#191c1e] tracking-tight">
              {hours}:{mins}
              <span className="text-xl ml-1 font-bold text-[#737783]">{ampm}</span>
            </h3>
            <p className="text-[10px] font-bold text-[#0e9f6e] uppercase tracking-wider flex items-center gap-1.5 mt-1">
              {isCheckedIn ? (
                <>
                  <CheckCircle2 className="size-3" /> Checked in since{" "}
                  {new Date(lastRecord.checkInAt!).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              ) : (
                <>
                  <AlertCircle className="size-3 text-[#ba1a1a]" />
                  <span className="text-[#ba1a1a]">Not checked in</span>
                </>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              disabled={checkInMutation.isPending || checkOutMutation.isPending}
              onClick={() => (isCheckedIn ? checkOutMutation.mutate() : checkInMutation.mutate())}
              className={`flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${
                isCheckedIn
                  ? "bg-[#ba1a1a] text-white shadow-lg shadow-[#ba1a1a]/20"
                  : "bg-[#00346f] text-white shadow-lg shadow-[#00346f]/20"
              }`}
            >
              {isCheckedIn ? "Check Out" : "Check In"}
            </button>
            <button className="size-11 rounded-2xl bg-[#f7f9fb] text-[#737783] flex items-center justify-center border border-[#eceef0] hover:bg-[#eceef0] transition-colors">
              <Pause className="size-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-3">
          <div className={baseCardClass}>
            <div className="flex justify-between items-start mb-6">
              <div className="size-10 rounded-2xl bg-[#f5f8ff] text-[#00346f] flex items-center justify-center">
                <Clock className="size-5" />
              </div>
              <Badge className="bg-[#def7ec] text-[#006e00] border-none text-[8px] font-black uppercase tracking-widest">
                +0.0%
              </Badge>
            </div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">
              Monthly Overtime
            </p>
            <h4 className="text-2xl font-black font-headline text-[#191c1e]">
              {formatMinutes(summary?.totalOvertimeMinutes ?? 0)}
            </h4>
            <p className="text-[9px] font-medium text-[#737783] mt-2 underline cursor-pointer">
              View breakdown
            </p>
          </div>

          <div className={baseCardClass}>
            <div className="flex justify-between items-start mb-6">
              <div className="size-10 rounded-2xl bg-[#fff4de] text-[#b45d00] flex items-center justify-center">
                <AlertCircle className="size-5" />
              </div>
              {summary?.lateCount ? <div className="size-2 rounded-full bg-[#ba1a1a]" /> : null}
            </div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">
              Lateness Status
            </p>
            <h4 className="text-2xl font-black font-headline text-[#191c1e]">
              {summary?.lateCount ?? 0} Days
            </h4>
            <p className="text-[9px] font-medium text-[#737783] mt-2">
              Check details for timestamps
            </p>
          </div>

          <div className={baseCardClass}>
            <div className="flex justify-between items-start mb-6">
              <div className="size-10 rounded-2xl bg-[#f0f4f8] text-[#424751] flex items-center justify-center">
                <CalendarRange className="size-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">
              Pending Requests
            </p>
            <h4 className="text-2xl font-black font-headline text-[#191c1e]">
              {(attendance?.overtimeRequests?.filter((request) => request.status === "PENDING").length ?? 0)} Issues
            </h4>
            <p className="text-[9px] font-medium text-[#737783] mt-2">Adjustments & Overtime</p>
          </div>

          <div className={baseCardClass}>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-4">
              Shift Schedule
            </p>
            <h4 className="text-2xl font-black font-headline text-[#191c1e] mb-6">
              {employee?.defaultShift
                ? formatMinutes(employee.defaultShift.endMinute - employee.defaultShift.startMinute)
                : "8h 00m"}
            </h4>
            <div className="h-1.5 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00346f] rounded-full"
                style={{ width: isCheckedIn ? "45%" : "0%" }}
              />
            </div>
            <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest mt-3 flex justify-between">
              <span>{formatMinutes(employee?.defaultShift?.startMinute ?? 540)}</span>
              <span>{formatMinutes(employee?.defaultShift?.endMinute ?? 1080)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className={headerTextClass}>
              Monthly Attendance Sheet - {current.toLocaleString("default", { month: "long" })}
            </h3>
            <div className="flex w-full flex-col rounded-xl border border-[#eceef0] bg-[#f7f9fb] p-1 sm:w-auto sm:flex-row">
              <button
                onClick={() => setViewMode("TABLE")}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                  viewMode === "TABLE"
                    ? "bg-white shadow-sm text-[#00346f]"
                    : "text-[#737783] hover:text-[#00346f]"
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode("CALENDAR")}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                  viewMode === "CALENDAR"
                    ? "bg-white shadow-sm text-[#00346f]"
                    : "text-[#737783] hover:text-[#00346f]"
                }`}
              >
                Calendar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fb]/80 border-y border-[#eceef0]">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                      Date
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                      Status
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                      Check In
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                      Check Out
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                      Work Hours
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                      Overtime
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center text-sm font-bold text-[#737783] uppercase tracking-widest">
                        No attendance records found for this period.
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="font-bold text-[#191c1e] text-sm leading-tight">
                            {formatDate(record.workDate)}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <Badge
                            className={`px-2 py-0.5 rounded shadow-none text-[8px] font-black uppercase tracking-widest border-none ${
                              record.attendanceStatus === "PRESENT"
                                ? "bg-[#def7ec] text-[#006e00]"
                                : record.attendanceStatus === "WEEKEND"
                                  ? "bg-[#f2f4f6] text-[#737783]"
                                  : record.attendanceStatus === "LATE"
                                    ? "bg-[#ffdad6] text-[#ba1a1a]"
                                    : "bg-[#fff4de] text-[#b45d00]"
                            }`}
                          >
                            {record.attendanceStatus}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-[#424751]">
                          {record.checkInAt
                            ? new Date(record.checkInAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-[#424751]">
                          {record.checkOutAt
                            ? new Date(record.checkOutAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-[#191c1e]">
                          {formatMinutes(record.workedMinutes)}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-[#00346f]">
                          {formatMinutes(record.overtimeMinutes)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="text-[#c2c6d3] hover:text-[#00346f] transition-colors">
                            <MoreHorizontal className="size-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#eceef0] bg-[#f7f9fb]/50 text-center">
              <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#737783] hover:text-[#00346f] flex items-center justify-center gap-2 mx-auto">
                Load Previous Days <ChevronDown className="size-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <h3 className={headerTextClass}>Recent Requests</h3>
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm flex-1 space-y-10">
            {attendance?.overtimeRequests?.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[11px] font-bold text-[#c2c6d3] uppercase tracking-widest">
                  No recent requests
                </p>
              </div>
            ) : null}

            {attendance?.overtimeRequests?.slice(0, 3).map((item, index) => (
              <div key={item.id} className="flex gap-4 relative">
                {index < 2 ? (
                  <div className="absolute left-5 top-10 bottom-[-40px] w-px bg-[#eceef0]" />
                ) : null}
                <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 z-10 bg-[#f7f9fb] text-[#00346f]">
                  <Clock className="size-5" />
                </div>
                <div className="space-y-1 pt-1">
                  <p className="font-bold text-[#191c1e] text-sm">
                    Overtime: {formatDate(item.workDate)}
                  </p>
                  <p className="text-[11px] font-medium text-[#737783]">Status: {item.status}</p>
                  <p className="text-[10px] font-bold text-[#c2c6d3] uppercase tracking-widest mt-2">
                    {formatMinutes(item.totalMinutes)}
                  </p>
                </div>
              </div>
            ))}

            <button className="w-full mt-4 py-3 rounded-2xl bg-[#f7f9fb] text-[10px] font-bold uppercase tracking-widest text-[#00346f] hover:bg-[#eceef0] transition-colors flex items-center justify-center gap-2">
              View Full History <ArrowRight className="size-3" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={isOvertimeOpen} onOpenChange={setIsOvertimeOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] card-pad-lg bg-white border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black font-headline text-[#00346f] tracking-tight">
              Request Overtime
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Work Date
              </label>
              <Input
                type="date"
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={overtimeForm.workDate}
                onChange={(event) =>
                  setOvertimeForm((currentState) => ({
                    ...currentState,
                    workDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Start Time
                </label>
                <Input
                  type="time"
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={overtimeForm.startTime}
                  onChange={(event) =>
                    setOvertimeForm((currentState) => ({
                      ...currentState,
                      startTime: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  End Time
                </label>
                <Input
                  type="time"
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={overtimeForm.endTime}
                  onChange={(event) =>
                    setOvertimeForm((currentState) => ({
                      ...currentState,
                      endTime: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Day Type
              </label>
              <Select
                value={overtimeForm.overtimeDayType}
                onValueChange={(value) =>
                  setOvertimeForm((currentState) => ({
                    ...currentState,
                    overtimeDayType: (value as OvertimeFormState["overtimeDayType"]) ?? "WEEKDAY",
                  }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="WEEKDAY" className="rounded-xl">
                    Weekday
                  </SelectItem>
                  <SelectItem value="WEEKEND" className="rounded-xl">
                    Weekend
                  </SelectItem>
                  <SelectItem value="PUBLIC_HOLIDAY" className="rounded-xl">
                    Public Holiday
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-[1.25rem] bg-[#f7f9fb] border border-[#eceef0] px-5 py-4">
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                Requested Duration
              </p>
              <p className="text-lg font-black text-[#00346f] mt-1">
                {formatMinutes(overtimeMinutes)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Note
              </label>
              <textarea
                className="w-full h-32 rounded-[1.25rem] bg-[#f7f9fb] border-none p-5 font-medium text-sm focus:ring-2 focus:ring-[#00346f]/10 outline-none"
                placeholder="Describe the reason for the overtime request..."
                value={overtimeForm.requestedNote}
                onChange={(event) =>
                  setOvertimeForm((currentState) => ({
                    ...currentState,
                    requestedNote: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => setIsOvertimeOpen(false)}
              className="px-8 py-3 rounded-2xl bg-[#eceef0] text-[#737783] font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => overtimeMutation.mutate()}
              disabled={overtimeMutation.isPending || overtimeMinutes <= 0}
              className="px-8 py-3 rounded-2xl bg-[#00346f] text-white font-bold shadow-xl hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {overtimeMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
