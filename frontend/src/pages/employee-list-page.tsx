import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MoreHorizontal, 
  UserRound,
  TrendingUp
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { apiGet, apiPost } from "@/lib/api";
import type { 
  CreateEmployeePayload, 
  DepartmentListItem, 
  EmployeeListResponse, 
  EmployeeProfile, 
  Position 
} from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function EmployeeListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    departmentId: "all",
    positionId: "all",
    status: "all"
  });
  const [createForm, setCreateForm] = useState<CreateEmployeePayload>({
    companyId: "",
    branchId: "",
    employeeCode: "",
    companyEmail: "",
    firstName: "",
    lastName: "",
    currentDepartmentId: "",
    currentPositionId: "",
    startDate: new Date().toISOString().split("T")[0],
    gender: "UNDISCLOSED"
  });

  const employeesQuery = useQuery({
    queryKey: ["employees", page, search, filters],
    queryFn: () => {
      const params: Record<string, string | number> = {
        page,
        limit: 10,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filters.departmentId !== "all") {
        params.departmentId = filters.departmentId;
      }

      if (filters.positionId !== "all") {
        params.positionId = filters.positionId;
      }

      if (filters.status !== "all") {
        params.employmentStatus = filters.status;
      }

      return apiGet<EmployeeListResponse>("/employees", params);
    },
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

  const createEmployeeMutation = useMutation({
    mutationFn: (data: CreateEmployeePayload) => apiPost<EmployeeProfile>("/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-managers"] });
      toast.success("Employee onboarded successfully");
      setCreateDialogOpen(false);
    },
    onError: () => toast.error("Failed to onboard employee"),
  });

  const defaultDepartment = departmentsQuery.data?.[0] ?? null;
  const defaultPosition = positionsQuery.data?.[0] ?? null;
  const isCreateOpen = searchParams.get("create") === "1";
  const selectedDepartmentId = createForm.currentDepartmentId || defaultDepartment?.id || "";
  const selectedPositionId = createForm.currentPositionId || defaultPosition?.id || "";

  const managerOptions = useMemo(
    () =>
      (managersQuery.data?.items ?? []).filter(
        (manager) => manager.id !== createForm.currentManagerEmployeeId,
      ),
    [createForm.currentManagerEmployeeId, managersQuery.data?.items],
  );

  const employees = employeesQuery.data?.items ?? [];
  const total = employeesQuery.data?.total ?? 0;
  const limit = employeesQuery.data?.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const updateField = (key: keyof CreateEmployeePayload, value: string) => {
    setCreateForm(prev => ({ ...prev, [key]: value }));
  };

  function setCreateDialogOpen(nextOpen: boolean) {
    const nextParams = new URLSearchParams(searchParams);

    if (nextOpen) {
      nextParams.set("create", "1");
    } else {
      nextParams.delete("create");
    }

    setSearchParams(nextParams, { replace: true });
  }

  function resetCreateForm() {
    setCreateForm({
      companyId: defaultPosition?.company?.id ?? "",
      branchId: defaultDepartment?.branch?.id ?? "",
      employeeCode: "",
      companyEmail: "",
      firstName: "",
      lastName: "",
      currentDepartmentId: defaultDepartment?.id ?? "",
      currentPositionId: defaultPosition?.id ?? "",
      currentManagerEmployeeId: "",
      startDate: new Date().toISOString().split("T")[0],
      gender: "UNDISCLOSED",
    });
  }

  function handleCreateEmployee() {
    const selectedDepartment = departmentsQuery.data?.find(
      (department) => department.id === selectedDepartmentId,
    );
    const selectedPosition = positionsQuery.data?.find(
      (position) => position.id === selectedPositionId,
    );

    const payload: CreateEmployeePayload = {
      ...createForm,
      companyId:
        selectedPosition?.company?.id ??
        createForm.companyId ??
        defaultPosition?.company?.id ??
        "",
      branchId:
        selectedDepartment?.branch?.id ??
        createForm.branchId ??
        defaultDepartment?.branch?.id ??
        "",
      currentDepartmentId: selectedDepartmentId,
      currentPositionId: selectedPositionId,
      currentManagerEmployeeId: createForm.currentManagerEmployeeId || undefined,
    };

    if (
      !payload.companyId ||
      !payload.branchId ||
      !payload.employeeCode ||
      !payload.companyEmail ||
      !payload.firstName ||
      !payload.lastName ||
      !payload.currentDepartmentId ||
      !payload.currentPositionId
    ) {
      toast.error("Please complete the onboarding form");
      return;
    }

    createEmployeeMutation.mutate(payload, {
      onSuccess: () => {
        resetCreateForm();
      },
    });
  }

  return (
    <div className="page-shell max-w-7xl page-stack animate-in fade-in duration-700">
      
      {/* Search and Action Header */}
      <div className="page-header mb-4">
        <div className="max-w-2xl flex-1 space-y-3">
           <h2 className="text-4xl font-black font-headline tracking-tighter text-[#00346f]">Employee Directory</h2>
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737783] size-5 group-focus-within:text-[#00346f] transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources, roles, or people..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#c2c6d3]/30 rounded-2xl text-[13px] font-medium placeholder:text-[#c2c6d3] focus:ring-4 focus:ring-[#00346f]/5 focus:border-[#00346f]/30 transition-all outline-none shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>
        
        <div className="page-actions">
           <button 
              onClick={() => setIsFilterOpen(true)}
              className="h-12 w-full rounded-2xl bg-white border border-[#c2c6d3]/30 flex items-center justify-center text-[#737783] hover:bg-[#f7f9fb] transition-colors sm:w-12"
           >
              <Filter className="size-5" />
           </button>
           <button 
              onClick={() => toast.success("Exporting directory to CSV...")}
              className="h-12 w-full rounded-2xl bg-white border border-[#c2c6d3]/30 flex items-center justify-center text-[#737783] hover:bg-[#f7f9fb] transition-colors sm:w-12"
           >
              <TrendingUp className="size-5" />
           </button>
           <button 
              onClick={() => {
                resetCreateForm();
                setCreateDialogOpen(true);
              }}
              className="h-12 px-8 rounded-2xl bg-[#00346f] text-white text-[13px] font-black tracking-tight shadow-xl shadow-[#00346f]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
           >
              <Plus className="size-5" strokeWidth={3} /> Onboard New Hire
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Directory Table Area */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-[2rem] border border-[#c2c6d3]/30 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left border-collapse">
                 <thead>
                    <tr className="border-b border-[#eceef0]">
                       <th className="px-8 py-6 text-[10px] font-black text-[#737783] uppercase tracking-[0.2em]">Employee Focus</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#737783] uppercase tracking-[0.2em] hidden md:table-cell">Status Cluster</th>
                       <th className="px-8 py-6"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#eceef0]">
                    {employees.map((emp: EmployeeProfile) => (
                       <tr 
                          key={emp.id} 
                          className="hover:bg-[#f7f9fb] transition-all cursor-pointer group"
                          onClick={() => navigate(`/employees/${emp.id}`)}
                       >
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-5">
                                <div className="size-12 rounded-2xl bg-[#eceef0] overflow-hidden flex-shrink-0 border-2 border-white shadow-sm ring-1 ring-[#eceef0]">
                                   <img 
                                      alt={emp.fullName} 
                                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${emp.employeeCode}&backgroundColor=eceef0`} 
                                      className="size-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                   />
                                </div>
                                <div className="space-y-0.5">
                                   <p className="font-bold text-[#191c1e] text-sm group-hover:text-[#00346f] transition-colors">{emp.fullName}</p>
                                   <p className="text-[11px] font-medium text-[#737783]">{emp.currentPosition?.name || "Architect"}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6 hidden md:table-cell">
                             <Badge className={cn(
                                "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border-none",
                                emp.employmentStatus === "ACTIVE" ? "bg-[#d1fadf] text-[#006e00]" : "bg-[#fef0c7] text-[#833301]"
                             )}>
                                {emp.employmentStatus}
                             </Badge>
                             <p className="text-[10px] text-[#c2c6d3] mt-1.5 font-bold tracking-widest">{emp.currentDepartment?.name || "HQ"}</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button className="rounded-xl border border-[#eceef0] bg-white p-2 shadow-sm transition-all hover:text-[#00346f] opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><MoreHorizontal className="size-5" /></button>
                          </td>
                       </tr>
                    ))}
                    {employees.length === 0 && !employeesQuery.isLoading && (
                      <tr>
                        <td colSpan={3} className="px-8 py-20 text-center text-[#737783] font-bold uppercase tracking-widest text-[10px]">No staff found in directory</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
           
           {/* Pagination */}
           <div className="mt-auto flex flex-col gap-4 border-t border-[#eceef0] bg-[#f7f9fb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8 lg:py-6">
              <p className="text-[11px] font-bold text-[#737783] uppercase tracking-widest">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                 <button 
                    disabled={page === 1}
                    onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                    className="size-10 rounded-xl bg-white border border-[#c2c6d3]/30 flex items-center justify-center text-[#737783] disabled:opacity-30 hover:bg-[#eceef0] transition-colors"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                 <button 
                    disabled={page === totalPages}
                    onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
                    className="size-10 rounded-xl bg-white border border-[#c2c6d3]/30 flex items-center justify-center text-[#737783] disabled:opacity-30 hover:bg-[#eceef0] transition-colors"
                  >
                    <ChevronRight className="size-5" />
                  </button>
              </div>
           </div>
        </div>

        {/* Informational Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#00346f] rounded-[2.5rem] card-pad text-white shadow-2xl relative overflow-hidden flex min-h-[280px] flex-col justify-between">
              <div className="relative z-10">
                 <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                    <UserRound className="size-6 text-[#d5e3fc]" />
                 </div>
                 <h3 className="text-2xl font-black font-headline tracking-tight mb-2 leading-tight">Sync Global Workforce</h3>
                 <p className="text-white/60 text-sm font-medium leading-relaxed">Automate onboarding workflows and centralize employee lifecycle data.</p>
              </div>
              <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10">
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Latest Sync: Oct 12</p>
                 <TrendingUp className="size-4 text-[#0e9f6e]" />
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 bg-white/5 rounded-full blur-3xl"></div>
           </div>

           <div className="bg-white rounded-[2rem] card-pad border border-[#c2c6d3]/30 shadow-sm space-y-6">
              <h4 className="text-[10px] font-black text-[#737783] uppercase tracking-[0.2em]">Directory Pulse</h4>
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-[#f7f9fb] flex items-center justify-center text-[#00346f]"><Mail className="size-4" /></div>
                    <div>
                       <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Global Comms</p>
                       <p className="text-sm font-bold text-[#191c1e]">Active Reach 98%</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-[#f7f9fb] flex items-center justify-center text-[#ba1a1a]"><Phone className="size-4" /></div>
                    <div>
                       <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">Connect Hub</p>
                       <p className="text-sm font-bold text-[#191c1e]">12 Open Requests</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] card-pad-lg bg-white">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black font-headline text-[#00346f]">Refine Directory</DialogTitle></DialogHeader>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">Global Department</label>
                <Select value={filters.departmentId} onValueChange={(v) => setFilters(p => ({...p, departmentId: v ?? "all"}))}>
                   <SelectTrigger className="h-12 rounded-xl bg-[#f7f9fb] border-none font-bold"><SelectValue /></SelectTrigger>
                   <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="all" className="rounded-xl">All Departments</SelectItem>
                      {departmentsQuery.data?.map((department) => (
                        <SelectItem key={department.id} value={department.id} className="rounded-xl">
                          {department.name}
                        </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">Employment Status</label>
                <Select value={filters.status} onValueChange={(v) => setFilters(p => ({...p, status: v ?? "all"}))}>
                   <SelectTrigger className="h-12 rounded-xl bg-[#f7f9fb] border-none font-bold"><SelectValue /></SelectTrigger>
                   <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="all" className="rounded-xl">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE" className="rounded-xl">Active Staff</SelectItem>
                      <SelectItem value="PROBATION" className="rounded-xl">Probation</SelectItem>
                      <SelectItem value="TERMINATED" className="rounded-xl">Terminated</SelectItem>
                   </SelectContent>
                </Select>
             </div>
          </div>
          <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-[#eceef0]">
             <button
               className="px-6 py-3 rounded-xl bg-[#eceef0] text-[#737783] font-bold text-xs"
               onClick={() => {
                 setFilters({
                   departmentId: "all",
                   positionId: "all",
                   status: "all",
                 });
                 setIsFilterOpen(false);
               }}
             >
               Reset
             </button>
             <button className="px-6 py-3 rounded-xl bg-[#00346f] text-white font-bold text-xs shadow-lg" onClick={() => setIsFilterOpen(false)}>Apply Clusters</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl card-pad-lg bg-white">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black font-headline text-[#00346f] tracking-tighter">Initialize New Identity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Code</label>
              <Input placeholder="ARCH-1024" value={createForm.employeeCode} onChange={(e) => updateField("employeeCode", e.target.value)} className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Company Email</label>
              <Input placeholder="alex@architect.com" value={createForm.companyEmail} onChange={(e) => updateField("companyEmail", e.target.value)} className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">First Name</label>
              <Input placeholder="Alex" value={createForm.firstName} onChange={(e) => updateField("firstName", e.target.value)} className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Last Name</label>
              <Input placeholder="Hamilton" value={createForm.lastName} onChange={(e) => updateField("lastName", e.target.value)} className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Onboarding Date</label>
              <Input type="date" value={createForm.startDate} onChange={(e) => updateField("startDate", e.target.value)} className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium text-sm" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Gender</label>
              <Select
                value={createForm.gender || "UNDISCLOSED"}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }

                  updateField("gender", value);
                }}
              >
                <SelectTrigger className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl border-[#c2c6d3]/30 shadow-lg">
                  <SelectItem value="UNDISCLOSED" className="rounded-xl">Undisclosed</SelectItem>
                  <SelectItem value="MALE" className="rounded-xl">Male</SelectItem>
                  <SelectItem value="FEMALE" className="rounded-xl">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Department</label>
              <Select
                value={selectedDepartmentId}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }

                  const selectedDepartment = departmentsQuery.data?.find(
                    (department) => department.id === value,
                  );

                  setCreateForm((currentState) => ({
                    ...currentState,
                    currentDepartmentId: value,
                    branchId: selectedDepartment?.branch?.id ?? currentState.branchId,
                  }));
                }}
              >
                <SelectTrigger className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl border-[#c2c6d3]/30 shadow-lg">
                  {departmentsQuery.data?.map((department) => (
                    <SelectItem key={department.id} value={department.id} className="rounded-xl">
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Position</label>
              <Select
                value={selectedPositionId}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }

                  const selectedPosition = positionsQuery.data?.find(
                    (position) => position.id === value,
                  );

                  setCreateForm((currentState) => ({
                    ...currentState,
                    currentPositionId: value,
                    companyId: selectedPosition?.company?.id ?? currentState.companyId,
                  }));
                }}
              >
                <SelectTrigger className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl border-[#c2c6d3]/30 shadow-lg">
                  {positionsQuery.data?.map((position) => (
                    <SelectItem key={position.id} value={position.id} className="rounded-xl">
                      {position.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Reporting Manager</label>
              <Select
                value={createForm.currentManagerEmployeeId || "none"}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }

                  updateField("currentManagerEmployeeId", value === "none" ? "" : value);
                }}
              >
                <SelectTrigger className="h-11 rounded-xl bg-[#f7f9fb] border-none font-medium"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl border-[#c2c6d3]/30 shadow-lg max-h-64">
                  <SelectItem value="none" className="rounded-xl">No manager</SelectItem>
                  {managerOptions.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id} className="rounded-xl">
                      {manager.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-10">
            <button className="px-8 py-3 rounded-xl font-bold bg-[#eceef0] text-[#737783] text-[13px] tracking-tight" onClick={() => setCreateDialogOpen(false)}>Cancel</button>
            <button
              className="px-8 py-3 rounded-xl font-bold bg-[#00346f] text-white shadow-xl shadow-[#00346f]/10 text-[13px] tracking-tight hover:scale-105 transition-transform"
              onClick={handleCreateEmployee}
              disabled={createEmployeeMutation.isPending}
            >
              {createEmployeeMutation.isPending ? "Saving..." : "Confirm Identity"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
