import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Download, 
  Users, 
  PieChart, 
  ArrowUpRight,
  Filter,
  ArrowRightCircle,
  Clock,
  Wallet,
  CalendarRange
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { 
  HrSummary, 
  AttendanceSummary, 
  LeaveSummary, 
  PayrollSummary 
} from "@/types/api";

export function ReportingPage() {
  const current = new Date();
  const [selectedYear] = useState(current.getFullYear().toString());
  const [selectedMonth] = useState((current.getMonth() + 1).toString());

  const hrSummaryQuery = useQuery({
    queryKey: ["hr-summary"],
    queryFn: () => apiGet<HrSummary>("/reports/hr-summary"),
  });

  const attendanceSummaryQuery = useQuery({
    queryKey: ["attendance-summary", selectedYear, selectedMonth],
    queryFn: () => apiGet<AttendanceSummary>("/reports/attendance-summary", {
      year: selectedYear,
      month: selectedMonth,
    }),
  });

  const leaveSummaryQuery = useQuery({
    queryKey: ["leave-summary", selectedYear, selectedMonth],
    queryFn: () => apiGet<LeaveSummary>("/reports/leave-summary", {
      year: selectedYear,
      month: selectedMonth,
    }),
  });

  const payrollSummaryQuery = useQuery({
    queryKey: ["payroll-summary", selectedYear, selectedMonth],
    queryFn: () => apiGet<PayrollSummary>("/reports/payroll-summary", {
      year: selectedYear,
      month: selectedMonth,
    }),
  });

  const baseCardClass = "bg-white rounded-[2.5rem] card-pad border border-[#c2c6d3]/30 shadow-sm relative overflow-hidden h-full flex flex-col justify-between";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";

  return (
    <div className="page-shell max-w-7xl page-stack">
      
      {/* Header Section */}
      <div className="page-header">
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
              <span>Analytics Hub</span>
              <ArrowRightCircle className="size-3" />
              <span className="text-[#00346f]">Business Intelligence</span>
           </div>
           <div className="space-y-1">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">Intelligence Suite</h2>
              <p className="text-[#424751] font-medium text-sm">Real-time operational insights and compliance reporting.</p>
           </div>
        </div>
        
        <div className="page-actions">
           <button className="h-11 px-6 rounded-2xl bg-white border border-[#c2c6d3]/40 text-sm font-bold text-[#424751] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2">
              <Filter className="size-4" /> Customized View
           </button>
           <button className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2">
              <Download className="size-4" /> Export All Sheets
           </button>
        </div>
      </div>

      {/* Primary Intelligence Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Workforce Stability */}
        <div className={baseCardClass}>
           <div className="flex justify-between items-start mb-6">
              <div className="size-12 rounded-2xl bg-[#f5f8ff] text-[#00346f] flex items-center justify-center"><Users className="size-6" /></div>
              <Badge className="bg-[#def7ec] text-[#006e00] border-none text-[8px] font-black uppercase tracking-widest">+12% Growth</Badge>
           </div>
           <div>
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Workforce Resilience</p>
              <h4 className="text-3xl font-black font-headline text-[#191c1e]">{hrSummaryQuery.data?.totalEmployees ?? 0} <span className="text-base text-[#737783]">Total</span></h4>
              <p className="text-[9px] font-medium text-[#737783] mt-2 italic">Active retention rate: 98.4%</p>
           </div>
        </div>

        {/* Operational Efficiency */}
        <div className={baseCardClass}>
           <div className="flex justify-between items-start mb-6">
              <div className="size-12 rounded-2xl bg-[#fff4de] text-[#b45d00] flex items-center justify-center"><Clock className="size-6" /></div>
           </div>
           <div>
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Operational Efficiency</p>
              <h4 className="text-3xl font-black font-headline text-[#191c1e]">{attendanceSummaryQuery.data?.presentCount ?? 0} <span className="text-base text-[#737783]">Present</span></h4>
              <p className="text-[9px] font-medium text-[#737783] mt-2 italic flex items-center gap-1">
                 <span className="size-1.5 rounded-full bg-[#ba1a1a]"></span> {attendanceSummaryQuery.data?.lateCount ?? 0} Late Arrivals detected
              </p>
           </div>
        </div>

        {/* Capital Disbursement */}
        <div className={baseCardClass}>
           <div className="flex justify-between items-start mb-6">
              <div className="size-12 rounded-2xl bg-[#f0f4f8] text-[#424751] flex items-center justify-center"><Wallet className="size-6" /></div>
           </div>
           <div>
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Capital Disbursement</p>
              <h4 className="text-2xl font-black font-headline text-[#191c1e]">{formatCurrency(payrollSummaryQuery.data?.totalGrossIncome ?? 0)}</h4>
              <p className="text-[9px] font-medium text-[#737783] mt-2 italic">Net Liquidity: {formatCurrency(payrollSummaryQuery.data?.totalNetIncome ?? 0)}</p>
           </div>
        </div>

        {/* Accrued Liabilities */}
        <div className={baseCardClass}>
           <div className="flex justify-between items-start mb-6">
              <div className="size-12 rounded-2xl bg-[#f7f9fb] text-[#737783] flex items-center justify-center"><CalendarRange className="size-6" /></div>
           </div>
           <div>
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">Accrued Liabilities</p>
              <h4 className="text-3xl font-black font-headline text-[#191c1e]">{leaveSummaryQuery.data?.approvedCount ?? 0} <span className="text-base text-[#737783]">Leaves</span></h4>
              <p className="text-[9px] font-medium text-[#737783] mt-2 italic">{leaveSummaryQuery.data?.pendingCount ?? 0} Pending Approvals in queue</p>
           </div>
        </div>
      </div>

      {/* Detailed Intelligence Cards */}
      <div className="grid gap-8 lg:grid-cols-2">
         {/* Workforce Segmentation */}
         <div className="bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <h3 className={headerTextClass}>Workforce Segmentation</h3>
               <BarChart3 className="size-5 text-[#c2c6d3]" />
            </div>
            
            <div className="space-y-6">
               {(hrSummaryQuery.data?.departments ?? []).map((dept, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                        <span className="text-[#424751]">{dept.name}</span>
                        <span className="text-[#00346f]">{dept.employeeCount} Staff</span>
                     </div>
                     <div className="h-2 w-full bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-[#00346f] rounded-full" 
                           style={{ width: `${(dept.employeeCount / (hrSummaryQuery.data?.totalEmployees || 1)) * 100}%` }}
                        ></div>
                     </div>
                  </div>
               ))}
               {(!hrSummaryQuery.data?.departments || hrSummaryQuery.data.departments.length === 0) && (
                  <div className="py-12 text-center text-[#737783] font-medium italic text-sm">
                     Initializing dynamic segmentation data...
                  </div>
               )}
            </div>
         </div>

         {/* Leave Utilization & Types */}
         <div className="bg-[#191c1e] rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black font-headline">Leave Utilization</h3>
               <PieChart className="size-5 opacity-40" />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
               {(leaveSummaryQuery.data?.byLeaveType ?? []).map((type, i) => (
                  <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 group hover:border-white/30 transition-all">
                     <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">{type.name}</p>
                     <p className="text-2xl font-black font-headline tracking-tighter">{type.days} <span className="text-[10px] opacity-40">Days</span></p>
                  </div>
               ))}
               {(!leaveSummaryQuery.data?.byLeaveType || leaveSummaryQuery.data.byLeaveType.length === 0) && (
                  <div className="col-span-2 py-12 text-center text-white/30 font-medium italic text-sm">
                     Generating leave heatmaps...
                  </div>
               )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Global Status</p>
                  <p className="text-xs font-bold text-[#def7ec]">92% Approved Consistency</p>
               </div>
               <button className="h-10 px-6 rounded-xl bg-white text-[#191c1e] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
                  View Full Report
               </button>
            </div>
         </div>
      </div>

      {/* Compliance & Audit History */}
      <div className="bg-white rounded-[2.5rem] p-4 border border-[#c2c6d3]/30 shadow-sm overflow-hidden">
         <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold font-headline text-[#191c1e] ml-4">Compliance Audit Records</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-[#00346f] underline px-4">See Detailed Audit Log</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
               <thead>
                  <tr className="bg-[#f7f9fb] border-y border-[#eceef0]">
                     <th className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Module</th>
                     <th className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Action Item</th>
                     <th className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Operator</th>
                     <th className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-[#737783]">Timestamp</th>
                     <th className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-[#737783] text-right">Integrity</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#eceef0]">
                  {[
                     { module: "Payroll", action: "Locked Period: Mar 2026", user: "Admin", time: "2m ago", status: "Verified" },
                     { module: "Attendance", action: "Manual Override: Emp ID 082", user: "HR Manager", time: "1h ago", status: "Verified" },
                     { module: "Employee", action: "Contract Variation: Dept Marketing", user: "Super Admin", time: "1 day ago", status: "Verified" },
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-[#f7f9fb]/50 transition-colors">
                        <td className="px-8 py-4"><Badge className="bg-[#f0f4f8] text-[#00346f] border-none text-[8px] font-black">{row.module}</Badge></td>
                        <td className="px-8 py-4 font-bold text-[#191c1e] text-xs">{row.action}</td>
                        <td className="px-8 py-4 text-xs font-medium text-[#424751]">{row.user}</td>
                        <td className="px-8 py-4 text-[10px] font-bold text-[#737783] uppercase tracking-wider">{row.time}</td>
                        <td className="px-8 py-4 text-right"><span className="text-[10px] font-black text-[#006e00] uppercase tracking-widest flex items-center justify-end gap-1.5"><ArrowUpRight className="size-3" /> {row.status}</span></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
