import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Users, FileBarChart, CalendarRange, Clock, CreditCard, Wallet, PlaneTakeoff, ShieldAlert, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiDownload, apiGet } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  AttendanceSummary,
  HrSummary,
  LeaveSummary,
  PayrollSummary,
} from "@/types/api";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getUTCFullYear()));
  const [month, setMonth] = useState(String(now.getUTCMonth() + 1));

  const params = {
    year: Number(year),
    month: Number(month),
  };

  const hrSummaryQuery = useQuery({
    queryKey: ["reports", "hr-summary"],
    queryFn: () => apiGet<HrSummary>("/reports/hr-summary"),
  });

  const attendanceSummaryQuery = useQuery({
    queryKey: ["reports", "attendance-summary", params],
    queryFn: () => apiGet<AttendanceSummary>("/reports/attendance-summary", params),
  });

  const leaveSummaryQuery = useQuery({
    queryKey: ["reports", "leave-summary", params],
    queryFn: () => apiGet<LeaveSummary>("/reports/leave-summary", params),
  });

  const payrollSummaryQuery = useQuery({
    queryKey: ["reports", "payroll-summary", params],
    queryFn: () => apiGet<PayrollSummary>("/reports/payroll-summary", params),
  });

  async function handleExport(endpoint: string, filename: string) {
    const blob = await apiDownload(endpoint, params);
    saveBlob(blob, filename);
  }

  const baseCardClass = "bg-white rounded-3xl card-pad border border-[#c2c6d3]/30 shadow-sm overflow-hidden flex flex-col h-full";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";

  return (
    <div className="page-shell max-w-7xl page-stack">
      
      {/* Header Section */}
      <div className="page-header mb-4">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b2f00]">Analytics</p>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">Reports Engine</h2>
          <p className="text-[#424751] max-w-lg font-medium text-sm">Retrieve insights and export aggregate statistics on human resources, attendance, leave, and payroll data.</p>
        </div>
        
        <div className="w-full rounded-2xl border border-[#c2c6d3]/30 bg-white p-2 shadow-sm md:w-auto">
           <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#737783] uppercase tracking-wider px-3 border-r border-[#c2c6d3]/30">Period</span>
              <Input type="number" value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 w-14 border-none bg-transparent px-2 text-center font-bold text-[#191c1e] shadow-none focus-visible:ring-0" />
              <span className="text-[#c2c6d3] font-bold">/</span>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="h-9 w-20 border-none bg-transparent px-2 text-center font-bold text-[#191c1e] shadow-none focus-visible:ring-0" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full mb-8">
        <div className="bg-white p-6 rounded-3xl flex items-center gap-5 shadow-sm border border-[#c2c6d3]/30 border-l-4 border-l-[#00346f]">
           <div className="w-12 h-12 rounded-2xl bg-[#d5e3fc] flex items-center justify-center text-[#00346f]"><Users className="size-6" /></div>
           <div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Total Employees</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{hrSummaryQuery.data?.totalEmployees ?? 0}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl flex items-center gap-5 shadow-sm border border-[#c2c6d3]/30 border-l-4 border-l-[#0e9f6e]">
           <div className="w-12 h-12 rounded-2xl bg-[#def7ec] flex items-center justify-center text-[#0e9f6e]"><ListChecks className="size-6" /></div>
           <div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Active Employees</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{hrSummaryQuery.data?.activeEmployees ?? 0}</p></div>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="mb-8 grid h-auto w-full grid-cols-1 rounded-2xl border border-[#c2c6d3]/30 bg-[#f7f9fb] p-2 sm:grid-cols-3">
          <TabsTrigger value="attendance" className="h-11 rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#00346f] text-[#737783] font-bold text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="h-11 rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#00346f] text-[#737783] font-bold text-sm">Leave</TabsTrigger>
          <TabsTrigger value="payroll" className="h-11 rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#00346f] text-[#737783] font-bold text-sm">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-0 outline-none">
          <div className={baseCardClass}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
               <h3 className={headerTextClass}>Attendance Aggregate</h3>
               <Button onClick={() => handleExport("/reports/attendance-summary/export.csv", `attendance-summary-${year}-${month}.csv`)} className="h-11 w-full rounded-xl bg-gradient-to-br from-[#00346f] to-[#004a99] px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto">
                  <Download className="size-4 mr-2" />
                  Export to CSV
               </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20"><div className="text-[#424751] mb-2"><FileBarChart className="size-5" /></div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">Total Records</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{attendanceSummaryQuery.data?.totalRecords ?? 0}</p></div>
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20"><div className="text-[#0e9f6e] mb-2"><CalendarRange className="size-5" /></div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">Total Present</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{attendanceSummaryQuery.data?.presentCount ?? 0}</p></div>
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20"><div className="text-[#93000a] mb-2"><ShieldAlert className="size-5" /></div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">Total Late</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{attendanceSummaryQuery.data?.lateCount ?? 0}</p></div>
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20"><div className="text-[#00346f] mb-2"><Clock className="size-5" /></div><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">Total Overtime</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{Math.floor((attendanceSummaryQuery.data?.totalOvertimeMinutes ?? 0)/60)}<span className="text-sm text-[#737783] ml-1">hrs</span></p></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leave" className="mt-0 outline-none">
          <div className={baseCardClass}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
               <h3 className={headerTextClass}>Global Leave Insights</h3>
               <Button onClick={() => handleExport("/reports/leave-summary/export.csv", `leave-summary-${year}-${month}.csv`)} className="h-11 w-full rounded-xl bg-gradient-to-br from-[#00346f] to-[#004a99] px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto">
                  <Download className="size-4 mr-2" />
                  Export to CSV
               </Button>
            </div>
            
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20 flex items-center justify-between"><div className="space-y-1"><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Total Requests</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{leaveSummaryQuery.data?.totalRequests ?? 0}</p></div></div>
                  <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20 flex items-center justify-between border-l-4 border-l-[#0e9f6e]"><div className="space-y-1"><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Approved</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{leaveSummaryQuery.data?.approvedCount ?? 0}</p></div></div>
                  <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20 flex items-center justify-between border-l-4 border-l-[#ffb694]"><div className="space-y-1"><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Pending</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{leaveSummaryQuery.data?.pendingCount ?? 0}</p></div></div>
               </div>

               <div>
                 <h4 className="text-[11px] font-bold text-[#737783] uppercase tracking-wider mb-4">Breakdown by Leave Type</h4>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {(leaveSummaryQuery.data?.byLeaveType ?? []).map((item) => (
                      <div key={item.code} className="bg-white rounded-2xl border border-[#c2c6d3]/30 p-4 shadow-sm text-center">
                        <PlaneTakeoff className="size-5 mx-auto mb-2 text-[#00346f]" />
                        <div className="font-bold text-[#191c1e] text-sm mb-1">{item.name}</div>
                        <div className="text-xl font-extrabold text-[#00346f]">{item.days} <span className="text-xs text-[#737783] font-medium">days</span></div>
                      </div>
                    ))}
                    {(leaveSummaryQuery.data?.byLeaveType?.length === 0 || !leaveSummaryQuery.data?.byLeaveType) && <div className="p-8 text-center border-dashed border border-[#c2c6d3]/50 rounded-2xl bg-[#f7f9fb] text-[#737783] text-sm sm:col-span-2 md:col-span-4">No leave data available for this period.</div>}
                 </div>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="mt-0 outline-none">
          <div className={baseCardClass}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
               <h3 className={headerTextClass}>Payroll Expenditures</h3>
               <Button onClick={() => handleExport("/reports/payroll-summary/export.csv", `payroll-summary-${year}-${month}.csv`)} className="h-11 w-full rounded-xl bg-gradient-to-br from-[#00346f] to-[#004a99] px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 sm:w-auto">
                  <Download className="size-4 mr-2" />
                  Export to CSV
               </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20 flex flex-col justify-between h-32"><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest"><FileBarChart className="size-4 mb-2 inline-block mr-2" />Payroll Periods</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{payrollSummaryQuery.data?.totalPeriods ?? 0}</p></div>
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20 flex flex-col justify-between h-32"><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest"><Users className="size-4 mb-2 inline-block mr-2" />Total Payslips</p><p className="text-2xl font-extrabold font-headline text-[#191c1e]">{payrollSummaryQuery.data?.totalPayslips ?? 0}</p></div>
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20 border-l-4 border-l-[#737783] flex flex-col justify-between h-32"><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest"><CreditCard className="size-4 mb-2 inline-block mr-2 text-[#737783]" />Total Gross Pay</p><p className="text-xl sm:text-2xl font-extrabold font-headline text-[#191c1e]">{formatCurrency(payrollSummaryQuery.data?.totalGrossIncome ?? 0)}</p></div>
               <div className="bg-[#f7f9fb] p-5 rounded-2xl border border-[#c2c6d3]/20 border-l-4 border-l-[#00346f] flex flex-col justify-between h-32"><p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest"><Wallet className="size-4 mb-2 inline-block mr-2 text-[#00346f]" />Total Net Disbursed</p><p className="text-xl sm:text-2xl font-extrabold font-headline text-[#00346f]">{formatCurrency(payrollSummaryQuery.data?.totalNetIncome ?? 0)}</p></div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
