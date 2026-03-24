import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  CreditCard,
  Edit2,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  ArrowLeft,
  X
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  DepartmentListItem,
  EmployeeListResponse,
  EmployeeProfile,
  Position,
} from "@/types/api";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmployeeDetailPage() {
  const queryClient = useQueryClient();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isBankingOpen, setIsBankingOpen] = useState(false);
  
  const [employeeForm, setEmployeeForm] = useState({
    companyEmail: "", personalEmail: "", phoneNumber: "", address: "",
    emergencyContactName: "", emergencyContactPhone: "", bankAccountName: "",
    bankAccountNumber: "", employmentStatus: "", currentDepartmentId: "",
    currentPositionId: "", currentManagerEmployeeId: "", startDate: "", endDate: "",
    birthDate: "", gender: "", nationalId: "",
  });
  const [contractForm, setContractForm] = useState({
    contractType: "INDEFINITE",
    contractNumber: "",
    startDate: "",
    endDate: "",
    baseSalary: "",
    salaryBasisAmount: "",
    salaryCurrency: "VND",
    isPrimary: true,
    isActive: true,
  });

  const employeeQuery = useQuery({
    queryKey: ["employee-detail", id],
    queryFn: () => apiGet<EmployeeProfile>(`/employees/${id}`),
    enabled: Boolean(id),
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiGet<DepartmentListItem[]>("/departments"),
  });

  const positionsQuery = useQuery({
    queryKey: ["positions"],
    queryFn: () => apiGet<Position[]>("/positions"),
  });

  const managersQuery = useQuery({
    queryKey: ["employee-managers"],
    queryFn: () => apiGet<EmployeeListResponse>("/employees", { page: 1, limit: 100 }),
  });

  const employee = employeeQuery.data;

  function primeEmployeeForm() {
    if (!employee) return;
    setEmployeeForm({
      companyEmail: employee.companyEmail ?? "", personalEmail: employee.personalEmail ?? "",
      phoneNumber: employee.phoneNumber ?? "", address: employee.address ?? "",
      emergencyContactName: employee.emergencyContactName ?? "", emergencyContactPhone: employee.emergencyContactPhone ?? "",
      bankAccountName: employee.bankAccountName ?? "", bankAccountNumber: employee.bankAccountNumber ?? "",
      employmentStatus: employee.employmentStatus ?? "", currentDepartmentId: employee.currentDepartment?.id ?? "",
      currentPositionId: employee.currentPosition?.id ?? "", currentManagerEmployeeId: employee.manager?.id ?? "",
      startDate: employee.startDate ? employee.startDate.slice(0, 10) : "",
      endDate: employee.endDate ? employee.endDate.slice(0, 10) : "",
      birthDate: employee.birthDate ? employee.birthDate.slice(0, 10) : "",
      gender: employee.gender ?? "UNDISCLOSED",
      nationalId: employee.nationalId ?? "",
    });
  }

  function primeContractForm() {
    const activeContract = employee?.contracts?.[0];

    setContractForm({
      contractType: activeContract?.contractType ?? "INDEFINITE",
      contractNumber: activeContract?.contractNumber ?? "",
      startDate: activeContract?.startDate?.slice(0, 10) ?? employee?.startDate?.slice(0, 10) ?? "",
      endDate: activeContract?.endDate?.slice(0, 10) ?? "",
      baseSalary: activeContract?.baseSalary ? String(activeContract.baseSalary) : "",
      salaryBasisAmount: activeContract?.salaryBasisAmount ? String(activeContract.salaryBasisAmount) : "",
      salaryCurrency: activeContract?.salaryCurrency ?? "VND",
      isPrimary: activeContract?.isPrimary ?? true,
      isActive: activeContract?.isActive ?? true,
    });
  }

  function buildEmployeeUpdatePayload() {
    return {
      ...employeeForm,
      companyEmail: employeeForm.companyEmail || undefined,
      currentDepartmentId: employeeForm.currentDepartmentId || undefined,
      currentPositionId: employeeForm.currentPositionId || undefined,
      currentManagerEmployeeId: employeeForm.currentManagerEmployeeId || null,
      startDate: employeeForm.startDate || undefined,
      birthDate: employeeForm.birthDate || null,
      endDate: employeeForm.endDate || null,
      gender: employeeForm.gender || undefined,
      employmentStatus: employeeForm.employmentStatus || undefined,
    };
  }

  const updateEmployeeMutation = useMutation({
    mutationFn: () =>
      apiPatch<EmployeeProfile>(`/employees/${id}`, buildEmployeeUpdatePayload()),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(["employee-detail", id], updatedEmployee);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee profile updated");
      setIsEditOpen(false);
      setIsBankingOpen(false);
    },
    onError: () => toast.error("Failed to update employee profile"),
  });

  const createContractMutation = useMutation({
    mutationFn: () =>
      apiPost<EmployeeProfile>(`/employees/${id}/contracts`, {
        ...contractForm,
        endDate: contractForm.endDate || undefined,
        salaryBasisAmount: contractForm.salaryBasisAmount || undefined,
      }),
    onSuccess: (updatedEmployee) => {
      queryClient.setQueryData(["employee-detail", id], updatedEmployee);
      toast.success("Contract saved successfully");
      setIsContractOpen(false);
    },
    onError: () => toast.error("Failed to save contract"),
  });

  if (!employee) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4 text-[#c2c6d3]">
          <UserRound className="size-12" />
          <p className="font-bold uppercase tracking-widest text-[10px]">Retrieving Global ID...</p>
        </div>
      </div>
    );
  }

  const selectedDepartmentName =
    departmentsQuery.data?.find(
      (department) => department.id === employeeForm.currentDepartmentId,
    )?.name ??
    employee.currentDepartment?.name ??
    "Not assigned";
  const selectedPositionName =
    positionsQuery.data?.find(
      (position) => position.id === employeeForm.currentPositionId,
    )?.name ??
    employee.currentPosition?.name ??
    "Not assigned";
  const selectedManagerName =
    managersQuery.data?.items.find(
      (manager) => manager.id === employeeForm.currentManagerEmployeeId,
    )?.fullName ??
    employee.manager?.fullName ??
    "No manager";

  return (
    <div className="page-shell max-w-7xl">
      
      {/* Dynamic Breadcrumbs & Actions */}
      <div className="page-header mb-8 lg:mb-12">
        <div className="space-y-4">
           <nav className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
              <Link to="/employees" className="hover:text-[#00346f] transition-colors">Directory</Link>
              <ChevronRight className="size-3" />
              <span className="text-[#00346f]">Profile Detail</span>
           </nav>
           <div className="space-y-1">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">{employee.fullName}</h2>
              <p className="text-[#424751] font-medium text-sm">
                 {employee.currentPosition?.name ?? "Employee"} • <span className="text-[#00346f] font-bold">#{employee.employeeCode}</span>
              </p>
           </div>
        </div>
        
        <div className="page-actions">
           <button 
              onClick={() => navigate('/employees')}
              className="h-11 px-6 rounded-2xl bg-white border border-[#c2c6d3]/40 text-sm font-bold text-[#424751] hover:bg-[#f7f9fb] transition-colors flex items-center gap-2"
           >
              <ArrowLeft className="size-4" /> Back to List
           </button>
           <button 
              onClick={() => { primeEmployeeForm(); setIsEditOpen(true); }}
              className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
           >
              <Edit2 className="size-4" /> Edit Profile
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Identity Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[2.5rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
              <div className="relative mb-8">
                 <img 
                    alt={employee.fullName} 
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${employee.employeeCode}&backgroundColor=eceef0`} 
                    className="size-40 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white bg-[#eceef0]" 
                 />
                 <div className="absolute -bottom-2 -right-2 size-12 rounded-2xl bg-[#00346f] text-white flex items-center justify-center shadow-lg border-2 border-white">
                    <ShieldCheck className="size-6" />
                 </div>
              </div>
              
              <h3 className="text-2xl font-black font-headline text-[#191c1e]">{employee.fullName}</h3>
              <p className="text-[#00346f] font-bold uppercase tracking-widest text-[11px] mt-1">{employee.currentPosition?.name || "Position TBD"}</p>
              
              <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
                 <div className="bg-[#f7f9fb] p-4 rounded-2xl border border-[#eceef0]">
                    <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">Status</p>
                    <p className="text-lg font-black text-[#191c1e] uppercase tracking-tighter">{employee.employmentStatus}</p>
                 </div>
                 <div className="bg-[#f7f9fb] p-4 rounded-2xl border border-[#eceef0]">
                    <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">Onboarding</p>
                    <div className="flex items-center justify-center gap-1 text-[#191c1e] font-black text-xs">
                       {formatDate(employee.startDate)}
                    </div>
                 </div>
              </div>
              
              <div className="w-full mt-8 pt-8 border-t border-[#eceef0] space-y-6">
                 <div className="flex items-center gap-4 group">
                    <div className="size-10 rounded-xl bg-[#f7f9fb] flex items-center justify-center text-[#737783] group-hover:bg-[#00346f] group-hover:text-white transition-colors"><Mail className="size-5" /></div>
                    <div className="text-left overflow-hidden">
                       <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest leading-none">Company Email</p>
                       <p className="text-sm font-bold text-[#191c1e] truncate">{employee.companyEmail}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 group">
                    <div className="size-10 rounded-xl bg-[#f7f9fb] flex items-center justify-center text-[#737783] group-hover:bg-[#00346f] group-hover:text-white transition-colors"><Phone className="size-5" /></div>
                    <div className="text-left">
                       <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest leading-none">Phone Contact</p>
                       <p className="text-sm font-bold text-[#191c1e]">{employee.phoneNumber || "Not provided"}</p>
                    </div>
                 </div>
              </div>
              
              <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 bg-[#00346f]/5 rounded-full blur-3xl"></div>
           </div>

           {/* Reporting Line Card */}
           <div className="bg-[#f7f9fb] rounded-3xl p-8 border border-[#c2c6d3]/30">
              <h4 className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-6">Reporting Line</h4>
              <div className="flex items-center gap-4">
                 <div className="size-12 rounded-2xl bg-white border border-[#eceef0] shadow-sm flex items-center justify-center text-[#00346f] font-black text-lg">
                    {employee.manager?.fullName ? employee.manager.fullName.substring(0, 2).toUpperCase() : "MT"}
                 </div>
                 <div>
                    <p className="font-bold text-[#191c1e]">{employee.manager?.fullName || "Marcus Thorne"}</p>
                    <p className="text-xs text-[#737783] font-medium uppercase tracking-wider">{employee.manager?.currentPosition?.name || "HR Director"}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Main Profile Content Area */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Navigation Tabs */}
           <div className="flex gap-10 border-b border-[#c2c6d3]/30 pb-4 overflow-x-auto whitespace-nowrap">
              {['overview', 'contracts', 'documents'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative font-bold text-sm tracking-wide transition-all pb-4 -mb-[18px] capitalize ${activeTab === tab ? 'text-[#00346f]' : 'text-[#737783] hover:text-[#00346f]'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00346f] rounded-full"></div>}
                </button>
              ))}
           </div>

           {activeTab === 'overview' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-white rounded-3xl p-8 border border-[#c2c6d3]/30 shadow-sm">
                   <h4 className="text-xl font-bold font-headline text-[#191c1e] mb-10">Personal Information</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                      {[
                        { label: "Full Legal Name", value: employee.fullName },
                        { label: "Date of Birth", value: employee.birthDate ? formatDate(employee.birthDate) : "—" },
                        { label: "Gender Identity", value: employee.gender || "—" },
                        { label: "National Identifier", value: employee.nationalId || "—" },
                        { label: "Residential Address", value: employee.address || "—" },
                        { label: "Emergency Contact", value: employee.emergencyContactName || "—" },
                        { label: "Contact Secondary", value: employee.emergencyContactPhone || "—" },
                        { label: "Onboarding Date", value: formatDate(employee.startDate) }
                      ].map((item, i) => (
                        <div key={i} className="space-y-2">
                           <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest leading-none">{item.label}</p>
                           <p className="font-bold text-[#191c1e] text-sm">{item.value}</p>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-[#c2c6d3]/30 shadow-sm">
                   <h4 className="text-xl font-bold font-headline text-[#191c1e] mb-8">Employment Evolution</h4>
                   <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#eceef0]">
                      {employee.orgHistories?.length ? employee.orgHistories.map((h) => (
                        <div key={h.id} className="relative">
                           <div className="absolute -left-[30px] top-1 size-[18px] rounded-full bg-white border-4 border-[#00346f] z-10 shadow-sm"></div>
                           <div className="space-y-1">
                              <p className="font-bold text-[#191c1e] text-base">{h.position.name}</p>
                              <p className="text-[11px] font-bold text-[#737783] uppercase tracking-widest">{h.department.name} • {formatDate(h.effectiveFrom)} {h.effectiveTo ? `- ${formatDate(h.effectiveTo)}` : '— Present'}</p>
                              {h.note && <p className="text-sm font-medium text-[#424751] mt-3 bg-[#f7f9fb] p-4 rounded-2xl border border-[#eceef0] italic leading-relaxed">"{h.note}"</p>}
                           </div>
                        </div>
                      )) : (
                        <div className="space-y-4">
                           <div className="relative">
                              <div className="absolute -left-[30px] top-1 size-[18px] rounded-full bg-white border-4 border-[#00346f] z-10 shadow-sm"></div>
                              <div className="space-y-1">
                                 <p className="font-bold text-[#191c1e] text-base">{employee.currentPosition?.name || 'Position Initialized'}</p>
                                 <p className="text-[11px] font-bold text-[#737783] uppercase tracking-widest">{employee.currentDepartment?.name || 'HQ Deployment'} • {formatDate(employee.startDate)} — Present</p>
                                 <p className="text-sm font-medium text-[#424751] mt-3 bg-[#f7f9fb] p-4 rounded-2xl border border-[#eceef0] italic">Initial company onboarding and role assignment.</p>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'contracts' && (
             <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white rounded-3xl p-8 border border-[#c2c6d3]/30 shadow-sm">
                   <div className="flex justify-between items-center mb-8">
                      <h4 className="text-xl font-bold font-headline text-[#191c1e]">Contract Allocation</h4>
                      <button
                        onClick={() => {
                          primeContractForm();
                          setIsContractOpen(true);
                        }}
                        className="text-[#00346f] text-[10px] font-bold uppercase tracking-widest border border-[#c2c6d3]/40 px-4 py-2 rounded-xl hover:bg-[#f7f9fb] transition-colors"
                      >
                        + New Contract
                      </button>
                   </div>
                   
                   <div className="space-y-4">
                      {employee.contracts?.map((c) => (
                        <div key={c.id} className="p-6 rounded-2xl border border-[#eceef0] flex items-center justify-between hover:border-[#00346f]/30 transition-all group">
                           <div className="flex items-center gap-5">
                              <div className="size-12 rounded-2xl bg-[#f7f9fb] flex items-center justify-center text-[#737783] group-hover:bg-[#00346f] group-hover:text-white transition-colors"><FileText className="size-6" /></div>
                              <div>
                                 <p className="font-bold text-[#191c1e] leading-tight">{c.contractType}</p>
                                 <p className="text-[11px] font-bold text-[#737783] uppercase tracking-widest mt-1">Ref: {c.contractNumber || "LEG-2023-01"} • {formatDate(c.startDate)}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-black text-[#191c1e] font-headline">{formatCurrency(c.baseSalary)}</p>
                              <p className="text-[10px] font-bold text-[#0e9f6e] uppercase tracking-widest">Active Status</p>
                           </div>
                        </div>
                      ))}
                      {!employee.contracts?.length && <div className="p-12 text-center text-[#737783] font-bold bg-[#f7f9fb] rounded-2xl border-dashed border-2 border-[#c2c6d3]/30 uppercase tracking-widest text-[10px]">No Active Contracts Found</div>}
                   </div>
                </div>
                
                <div className="bg-[#191c1e] rounded-[2.5rem] card-pad-lg text-white shadow-xl relative overflow-hidden">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                      <div className="space-y-4">
                         <div className="flex items-center gap-2 opacity-60">
                            <CreditCard className="size-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Disbursement Channel</span>
                         </div>
                         <p className="text-3xl font-black font-headline tracking-tighter">{employee.bankAccountNumber || "•••• •••• •••• 1248"}</p>
                         <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest">{employee.bankAccountName || "Registered via Barclays London"}</p>
                      </div>
                      <button 
                        onClick={() => { primeEmployeeForm(); setIsBankingOpen(true); }}
                        className="h-12 px-8 rounded-full bg-white text-[#191c1e] text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Edit Banking
                      </button>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'documents' && (
             <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white rounded-3xl p-8 border border-[#c2c6d3]/30 shadow-sm">
                   <div className="flex justify-between items-center mb-8">
                      <h4 className="text-xl font-bold font-headline text-[#191c1e]">Secure Documents</h4>
                      <button onClick={() => toast.info("Document upload coming soon")} className="text-[#00346f] text-[10px] font-bold uppercase tracking-widest border border-[#c2c6d3]/40 px-4 py-2 rounded-xl hover:bg-[#f7f9fb] transition-colors">+ Add Material</button>
                   </div>
                   
                   <div className="grid gap-4">
                      {[
                        { name: "Identification & Passport.pdf", type: "Security", size: "2.4 MB", date: formatDate(employee.startDate) },
                        { name: "Academic Credentials.zip", type: "Credentials", size: "15.8 MB", date: formatDate(employee.startDate) },
                        { name: "Professional Indemnity.pdf", type: "Compliance", size: "1.1 MB", date: "Jan 12, 2024" }
                      ].map((doc, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-[#eceef0] flex items-center justify-between hover:bg-[#f7f9fb] transition-all cursor-pointer group">
                           <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-white border border-[#eceef0] flex items-center justify-center text-[#737783] group-hover:text-[#00346f] transition-colors"><FileText className="size-5" /></div>
                              <div>
                                 <p className="font-bold text-[#191c1e] text-sm group-hover:text-[#00346f] transition-colors">{doc.name}</p>
                                 <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">{doc.type} • {doc.size}</p>
                              </div>
                           </div>
                           <button className="flex size-9 items-center justify-center rounded-full bg-[#f2f4f6] text-[#737783] transition-all hover:bg-[#00346f] hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><ChevronRight className="size-4" /></button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[min(880px,calc(100vh-2rem))] w-[min(1100px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] max-w-none flex-col rounded-[2rem] border-none bg-white p-0 shadow-2xl overflow-hidden"
        >
          <div className="relative shrink-0 bg-[#00346f] px-8 py-8 text-white md:px-10">
            <DialogClose
              className="absolute right-5 top-5 inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
            <div className="space-y-6">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-3xl font-black font-headline tracking-tight text-white md:text-4xl">
                  Edit Employee Profile
                </DialogTitle>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/75">
                  Update identity, contact details, and reporting structure without leaving the profile page.
                </p>
              </DialogHeader>
              <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  {employee.employeeCode}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  {employee.currentDepartment?.name ?? "No department"}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  {employee.currentPosition?.name ?? "No position"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="border-b border-[#eceef0] bg-[#f7f9fb] px-8 py-8 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#737783]">
                    Current Snapshot
                  </p>
                  <h4 className="mt-3 text-2xl font-black font-headline text-[#191c1e]">
                    {employee.fullName}
                  </h4>
                  <p className="mt-1 text-sm font-medium text-[#737783]">
                    Keep role, status, and contact details aligned with the backend record.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Employment Status", value: employeeForm.employmentStatus || "ACTIVE" },
                    { label: "Department", value: selectedDepartmentName },
                    { label: "Position", value: selectedPositionName },
                    { label: "Reporting Manager", value: selectedManagerName },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-[#e4e8ef] bg-white px-4 py-4 shadow-sm"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#737783]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#191c1e] break-words">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden px-8 py-8 md:px-10">
              <Tabs defaultValue="identity" className="min-h-full">
                <div className="sticky top-0 z-10 -mx-8 border-b border-[#eceef0] bg-white/95 px-8 pb-5 backdrop-blur md:-mx-10 md:px-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#737783]">
                      Editing Workspace
                    </p>
                    <h5 className="text-xl font-black font-headline text-[#191c1e]">
                      Choose the data group to update
                    </h5>
                  </div>
                  <TabsList className="mt-4 grid w-full grid-cols-2 overflow-hidden rounded-[1.25rem] border border-[#dbe3ef] bg-[#f7f9fb] p-2 group-data-horizontal/tabs:h-auto">
                    <TabsTrigger
                      value="identity"
                      className="h-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.16em] text-[#737783] data-active:bg-white data-active:text-[#00346f] data-active:shadow-sm"
                    >
                      Contact & Identity
                    </TabsTrigger>
                    <TabsTrigger
                      value="employment"
                      className="h-12 rounded-2xl text-[11px] font-black uppercase tracking-[0.16em] text-[#737783] data-active:bg-white data-active:text-[#00346f] data-active:shadow-sm"
                    >
                      Employment Settings
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="identity" className="mt-0 space-y-5 pt-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#737783]">
                      Contact & Identity
                    </p>
                    <h5 className="text-xl font-black font-headline text-[#191c1e]">
                      Personal record
                    </h5>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {[
                      { label: "Company Email", key: "companyEmail", type: "email", span: "" },
                      { label: "Personal Email", key: "personalEmail", type: "email", span: "" },
                      { label: "Phone Number", key: "phoneNumber", type: "tel", span: "" },
                      { label: "National ID", key: "nationalId", type: "text", span: "" },
                      { label: "Birth Date", key: "birthDate", type: "date", span: "" },
                      { label: "Residential Address", key: "address", type: "text", span: "md:col-span-2" },
                      { label: "Emergency Contact", key: "emergencyContactName", type: "text", span: "" },
                      { label: "Emergency Phone", key: "emergencyContactPhone", type: "tel", span: "" },
                    ].map((field) => (
                      <div key={field.key} className={`space-y-2 ${field.span}`}>
                        <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                          {field.label}
                        </label>
                        <Input
                          type={field.type}
                          className="h-12 rounded-2xl border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-[#00346f]/10"
                          value={employeeForm[field.key as keyof typeof employeeForm]}
                          onChange={(e) =>
                            setEmployeeForm((currentState) => ({
                              ...currentState,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="employment" className="mt-0 space-y-5 pt-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#737783]">
                      Employment Settings
                    </p>
                    <h5 className="text-xl font-black font-headline text-[#191c1e]">
                      Organization mapping
                    </h5>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        className="h-12 rounded-2xl border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-[#00346f]/10"
                        value={employeeForm.startDate}
                        onChange={(e) =>
                          setEmployeeForm((currentState) => ({
                            ...currentState,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                        End Date
                      </label>
                      <Input
                        type="date"
                        className="h-12 rounded-2xl border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-[#00346f]/10"
                        value={employeeForm.endDate}
                        onChange={(e) =>
                          setEmployeeForm((currentState) => ({
                            ...currentState,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                        Gender
                      </label>
                      <Select
                        value={employeeForm.gender}
                        onValueChange={(value) =>
                          setEmployeeForm((currentState) => ({
                            ...currentState,
                            gender: value ?? "UNDISCLOSED",
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 w-full rounded-lg border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-none shadow-2xl">
                          <SelectItem value="MALE" className="rounded-md">Male</SelectItem>
                          <SelectItem value="FEMALE" className="rounded-md">Female</SelectItem>
                          <SelectItem value="UNDISCLOSED" className="rounded-md">Undisclosed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                        Employment Status
                      </label>
                      <Select
                        value={employeeForm.employmentStatus}
                        onValueChange={(value) =>
                          setEmployeeForm((currentState) => ({
                            ...currentState,
                            employmentStatus: value ?? "ACTIVE",
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 w-full rounded-lg border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-none shadow-2xl">
                          <SelectItem value="ACTIVE" className="rounded-md">Active Staff</SelectItem>
                          <SelectItem value="PROBATION" className="rounded-md">Probation Cycle</SelectItem>
                          <SelectItem value="TERMINATED" className="rounded-md">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                        Department
                      </label>
                      <Select
                        value={employeeForm.currentDepartmentId}
                        onValueChange={(value) =>
                          setEmployeeForm((currentState) => ({
                            ...currentState,
                            currentDepartmentId: value ?? "",
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 w-full rounded-lg border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-none shadow-2xl">
                          {departmentsQuery.data?.map((department) => (
                            <SelectItem key={department.id} value={department.id} className="rounded-md">
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                        Position
                      </label>
                      <Select
                        value={employeeForm.currentPositionId}
                        onValueChange={(value) =>
                          setEmployeeForm((currentState) => ({
                            ...currentState,
                            currentPositionId: value ?? "",
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 w-full rounded-lg border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-none shadow-2xl">
                          {positionsQuery.data?.map((position) => (
                            <SelectItem key={position.id} value={position.id} className="rounded-md">
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                        Reporting Manager
                      </label>
                      <Select
                        value={employeeForm.currentManagerEmployeeId || "none"}
                        onValueChange={(value) =>
                          setEmployeeForm((currentState) => ({
                            ...currentState,
                            currentManagerEmployeeId: value === "none" ? "" : value ?? "",
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 w-full rounded-lg border border-[#dbe3ef] bg-white px-4 font-semibold text-[#191c1e] shadow-sm">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          className="max-h-64 min-w-64 w-[min(var(--radix-select-trigger-width),24rem)] rounded-lg border-none shadow-2xl"
                        >
                          <SelectItem value="none" className="rounded-md">No manager</SelectItem>
                          {managersQuery.data?.items
                            .filter((manager) => manager.id !== employee.id)
                            .map((manager) => (
                              <SelectItem key={manager.id} value={manager.id} className="rounded-md">
                                {manager.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#eceef0] bg-[#f8fafc] px-8 py-5 md:px-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#737783]">
                Changes sync directly with the employee master record.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className="px-8 py-3 rounded-2xl font-bold bg-white text-[#737783] ring-1 ring-[#dbe3ef] transition-colors hover:bg-[#f1f5f9]"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-3 rounded-2xl font-bold bg-[#00346f] text-white shadow-xl hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
                  onClick={() => updateEmployeeMutation.mutate()}
                  disabled={updateEmployeeMutation.isPending}
                >
                  {updateEmployeeMutation.isPending ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Banking Dialog */}
      <Dialog open={isBankingOpen} onOpenChange={setIsBankingOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl card-pad-lg bg-white">
          <DialogHeader className="mb-8">
             <DialogTitle className="text-3xl font-black font-headline text-[#00346f] tracking-tight">Disbursement Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">Bank Account Name</label>
                <Input className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold" value={employeeForm.bankAccountName} onChange={(e) => setEmployeeForm(c => ({...c, bankAccountName: e.target.value}))} />
             </div>
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">Bank Account Number</label>
                <Input className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold" value={employeeForm.bankAccountNumber} onChange={(e) => setEmployeeForm(c => ({...c, bankAccountNumber: e.target.value}))} />
             </div>
          </div>
          <div className="flex justify-end gap-4 mt-10">
            <button className="px-8 py-3 rounded-xl font-bold bg-[#eceef0] text-[#737783]" onClick={() => setIsBankingOpen(false)}>Cancel</button>
            <button className="px-8 py-3 rounded-xl font-bold bg-[#0034a1] text-white" onClick={() => updateEmployeeMutation.mutate()}>Save Account</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Modal */}
      <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] card-pad-lg bg-white">
           <DialogHeader><DialogTitle className="text-2xl font-black font-headline text-[#00346f]">Contract Profile</DialogTitle></DialogHeader>
           <div className="grid gap-6 md:grid-cols-2 mt-8">
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">Contract Type</label>
                 <Select
                   value={contractForm.contractType}
                   onValueChange={(value) =>
                     setContractForm((currentState) => ({
                       ...currentState,
                       contractType: value ?? "INDEFINITE",
                     }))
                   }
                 >
                   <SelectTrigger className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"><SelectValue /></SelectTrigger>
                   <SelectContent className="rounded-2xl shadow-2xl border-none">
                      <SelectItem value="PROBATION" className="rounded-xl">Probation</SelectItem>
                      <SelectItem value="FIXED_TERM" className="rounded-xl">Fixed Term</SelectItem>
                      <SelectItem value="INDEFINITE" className="rounded-xl">Indefinite</SelectItem>
                      <SelectItem value="PART_TIME" className="rounded-xl">Part Time</SelectItem>
                      <SelectItem value="INTERN" className="rounded-xl">Intern</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">Contract Number</label>
                 <Input className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold" value={contractForm.contractNumber} onChange={(e) => setContractForm((currentState) => ({ ...currentState, contractNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">Start Date</label>
                 <Input type="date" className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold" value={contractForm.startDate} onChange={(e) => setContractForm((currentState) => ({ ...currentState, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">End Date</label>
                 <Input type="date" className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold" value={contractForm.endDate} onChange={(e) => setContractForm((currentState) => ({ ...currentState, endDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">Base Salary</label>
                 <Input type="number" min="0" className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold" value={contractForm.baseSalary} onChange={(e) => setContractForm((currentState) => ({ ...currentState, baseSalary: e.target.value }))} />
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">Salary Basis</label>
                 <Input type="number" min="0" className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold" value={contractForm.salaryBasisAmount} onChange={(e) => setContractForm((currentState) => ({ ...currentState, salaryBasisAmount: e.target.value }))} />
              </div>
           </div>
           <div className="flex justify-end mt-10 gap-3">
              <button className="px-8 py-3 rounded-xl bg-[#eceef0] text-[#737783] font-bold" onClick={() => setIsContractOpen(false)}>Cancel</button>
              <button
                className="px-8 py-3 rounded-xl bg-[#00346f] text-white font-bold"
                onClick={() => createContractMutation.mutate()}
                disabled={createContractMutation.isPending || !contractForm.startDate || !contractForm.baseSalary}
              >
                {createContractMutation.isPending ? "Saving..." : "Save Contract"}
              </button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
