import { 
  ShieldCheck, 
  Activity, 
  Zap, 
  Calculator, 
  Database, 
  Globe, 
  ChevronRight, 
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const baseCardClass = "bg-white rounded-3xl card-pad border border-[#c2c6d3]/30 shadow-sm overflow-hidden flex flex-col h-full";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";

  return (
    <div className="page-shell max-w-7xl page-stack">
      
      {/* Header Section */}
      <div className="page-header mb-4">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#006e00]">Global Control</p>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">Payroll Configuration</h2>
          <p className="text-[#424751] font-medium text-sm">{user?.email ?? "Alex Hamilton"} • Global HR Admin</p>
        </div>
        
        <div className="flex bg-white rounded-2xl p-2 border border-[#c2c6d3]/30 shadow-sm gap-2">
           <button className="h-10 px-6 rounded-xl bg-[#00346f] text-white text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-2">
              Save Configuration
           </button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_350px]">
        
        <div className="space-y-8">
           {/* Cycle Architecture Section */}
           <div className={baseCardClass}>
              <div className="flex items-center gap-4 mb-6">
                 <div className="size-12 rounded-2xl bg-[#d5e3fc] flex items-center justify-center text-[#00346f]"><Calculator className="size-6" /></div>
                 <div>
                    <h3 className={headerTextClass}>Cycle Architecture</h3>
                    <p className="text-xs font-medium text-[#737783] mt-0.5">Define your organization's compensation flow</p>
                 </div>
              </div>
              <p className="text-[#424751] text-sm leading-relaxed mb-8">
                 Define the rhythmic flow of your organization's compensation structure. Synchronize automated formulas with attendance logs to ensure editorial precision in every payslip.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#eceef0]">
                 <div className="p-6 bg-[#f7f9fb] rounded-2xl border border-[#eceef0]">
                    <h4 className="text-[11px] font-bold text-[#737783] uppercase tracking-widest mb-4">Live Sync Pulse</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-[#191c1e]">Time Logs</span>
                          <span className="text-[10px] font-black text-[#006e00]">98.4% Verified</span>
                       </div>
                       <div className="flex justify-between items-center text-xs font-medium text-[#737783]">
                          <span>Leave Accruals</span>
                          <span className="animate-pulse flex items-center gap-1.5"><Activity className="size-3" /> Syncing...</span>
                       </div>
                    </div>
                 </div>
                 <div className="p-6 bg-[#00346f] rounded-2xl text-white shadow-lg">
                    <h4 className="text-[11px] font-bold opacity-60 uppercase tracking-widest mb-4">Global Math Hub</h4>
                    <div className="space-y-3 font-mono text-[10px] bg-black/20 p-4 rounded-xl">
                       <p className="text-[#0e9f6e] opacity-80">// Standard Pay Formula</p>
                       <code className="block leading-relaxed">(Monthly_Base / Work_Days) * Present_Days</code>
                       <p className="text-[#0e9f6e] opacity-80 mt-2">// Overtime Multiplier</p>
                       <code className="block leading-relaxed">OT_Hours * (Hourly_Rate * 1.5)</code>
                    </div>
                 </div>
              </div>
           </div>

           {/* Active Payroll Cycles */}
           <div className={baseCardClass}>
              <h3 className={`${headerTextClass} mb-8`}>Active Payroll Cycles</h3>
              <div className="space-y-4">
                 {[
                    { name: "Standard HQ Monthly", group: "All Executive & Ops Staff", status: "Active" },
                    { name: "Contractor Bi-Weekly", group: "Remote & Freelance Tier", status: "Active" },
                 ].map((cycle, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-[#f7f9fb] rounded-2xl border border-[#eceef0] group hover:border-[#00346f]/30 transition-all cursor-pointer">
                       <div className="flex items-center gap-5">
                          <div className="size-10 rounded-xl bg-white border border-[#eceef0] flex items-center justify-center text-[#737783] group-hover:text-[#00346f] transition-colors"><Zap className="size-5" /></div>
                          <div>
                             <p className="font-bold text-[#191c1e] text-sm">{cycle.name}</p>
                             <p className="text-[10px] font-medium text-[#737783] mt-0.5">{cycle.group}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-[#00346f] bg-white px-3 py-1 rounded-md border border-[#eceef0] uppercase tracking-widest">{cycle.status}</span>
                          <ChevronRight className="size-4 text-[#c2c6d3]" />
                       </div>
                    </div>
                 ))}
                 <button className="w-full py-4 mt-2 border-2 border-dashed border-[#c2c6d3]/40 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-[#737783] hover:text-[#00346f] hover:border-[#00346f]/30 transition-all">+ Initialize New Cycle</button>
              </div>
           </div>
        </div>

        {/* Side Controls */}
        <div className="space-y-6">
           <div className="bg-[#191c1e] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 text-center">
                 <Globe className="size-10 text-[#d5e3fc] mx-auto mb-6" />
                 <h3 className="text-xl font-black font-headline mb-4">Sync Global Tax Tables?</h3>
                 <p className="text-sm text-white/60 leading-relaxed font-medium mb-8">
                    Architect HRM can automatically update statutory deduction thresholds based on regional government mandates.
                 </p>
                 <button className="w-full py-4 rounded-xl bg-white text-[#191c1e] text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">Enable 2024 compliance</button>
              </div>
              <div className="absolute top-0 left-0 -ml-16 -mt-16 size-48 bg-white/5 rounded-full blur-3xl"></div>
           </div>

           <div className={baseCardClass}>
              <h4 className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-6">Security & Logs</h4>
              <div className="space-y-4">
                  <div 
                    onClick={() => navigate('/settings/holidays')}
                    className="flex items-center gap-3 p-3 hover:bg-[#f7f9fb] rounded-xl transition-colors cursor-pointer group"
                  >
                     <div className="size-8 rounded-full bg-[#f7f9fb] group-hover:bg-[#d5e3fc] flex items-center justify-center text-[#737783] group-hover:text-[#00346f] transition-colors"><Globe className="size-4" /></div>
                     <span className="text-xs font-bold text-[#191c1e]">Holiday Management</span>
                     <ChevronRight className="size-3 text-[#c2c6d3] ml-auto" />
                  </div>
                  <div 
                    onClick={() => navigate('/settings/payroll-rules')}
                    className="flex items-center gap-3 p-3 hover:bg-[#f7f9fb] rounded-xl transition-colors cursor-pointer group"
                  >
                     <div className="size-8 rounded-full bg-[#f7f9fb] group-hover:bg-[#d5e3fc] flex items-center justify-center text-[#737783] group-hover:text-[#00346f] transition-colors"><Calculator className="size-4" /></div>
                     <span className="text-xs font-bold text-[#191c1e]">Statutory Rules</span>
                     <ChevronRight className="size-3 text-[#c2c6d3] ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 p-3 hover:bg-[#f7f9fb] rounded-xl transition-colors cursor-pointer group">
                     <div className="size-8 rounded-full bg-[#f7f9fb] group-hover:bg-[#d5e3fc] flex items-center justify-center text-[#737783] group-hover:text-[#00346f] transition-colors"><ShieldCheck className="size-4" /></div>
                     <span className="text-xs font-bold text-[#191c1e]">Audit History</span>
                     <ArrowRight className="size-3 text-[#c2c6d3] ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 p-3 hover:bg-[#f7f9fb] rounded-xl transition-colors cursor-pointer group">
                     <div className="size-8 rounded-full bg-[#f7f9fb] group-hover:bg-[#d5e3fc] flex items-center justify-center text-[#737783] group-hover:text-[#00346f] transition-colors"><Database className="size-4" /></div>
                     <span className="text-xs font-bold text-[#191c1e]">Data Integrity</span>
                     <ArrowRight className="size-3 text-[#c2c6d3] ml-auto" />
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
