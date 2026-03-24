import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  TrendingUp,
  MoreHorizontal,
  Building2,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CreateDepartmentPayload,
  DepartmentListItem,
  EmployeeListResponse,
  EmployeeProfile,
} from "@/types/api";

type DepartmentFormState = {
  branchId: string;
  name: string;
  code: string;
  managerEmployeeId: string;
  isActive: string;
};

function createEmptyForm(branchId = ""): DepartmentFormState {
  return {
    branchId,
    name: "",
    code: "",
    managerEmployeeId: "none",
    isActive: "true",
  };
}

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(createEmptyForm());

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiGet<DepartmentListItem[]>("/departments"),
  });

  const currentEmployeeQuery = useQuery({
    queryKey: ["employee-me"],
    queryFn: () => apiGet<EmployeeProfile>("/employees/me"),
  });

  const managersQuery = useQuery({
    queryKey: ["employee-managers"],
    queryFn: () => apiGet<EmployeeListResponse>("/employees", { page: 1, limit: 100 }),
  });

  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
  const totalStaff = useMemo(
    () => departments.reduce((sum, department) => sum + (department.summary?.employeeCount || 0), 0),
    [departments],
  );

  const branchOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    for (const department of departments) {
      if (department.branch?.id) {
        map.set(department.branch.id, {
          id: department.branch.id,
          name: department.branch.name,
        });
      }
    }

    if (currentEmployeeQuery.data?.branch?.id) {
      map.set(currentEmployeeQuery.data.branch.id, {
        id: currentEmployeeQuery.data.branch.id,
        name: currentEmployeeQuery.data.branch.name,
      });
    }

    return Array.from(map.values());
  }, [currentEmployeeQuery.data, departments]);

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<DepartmentListItem>("/departments", {
        branchId: departmentForm.branchId,
        name: departmentForm.name.trim(),
        code: departmentForm.code.trim() || undefined,
        managerEmployeeId:
          departmentForm.managerEmployeeId === "none" ? undefined : departmentForm.managerEmployeeId,
      } satisfies CreateDepartmentPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created");
      setIsDialogOpen(false);
      setEditingDepartmentId(null);
    },
    onError: () => toast.error("Failed to create department"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiPatch<DepartmentListItem>(`/departments/${editingDepartmentId}`, {
        name: departmentForm.name.trim(),
        code: departmentForm.code.trim() || undefined,
        managerEmployeeId:
          departmentForm.managerEmployeeId === "none" ? null : departmentForm.managerEmployeeId,
        isActive: departmentForm.isActive === "true",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated");
      setIsDialogOpen(false);
      setEditingDepartmentId(null);
    },
    onError: () => toast.error("Failed to update department"),
  });

  function openCreateDialog() {
    setEditingDepartmentId(null);
    setDepartmentForm(createEmptyForm(branchOptions[0]?.id ?? ""));
    setIsDialogOpen(true);
  }

  function openEditDialog(department: DepartmentListItem) {
    setEditingDepartmentId(department.id);
    setDepartmentForm({
      branchId: department.branch?.id ?? branchOptions[0]?.id ?? "",
      name: department.name,
      code: department.code ?? "",
      managerEmployeeId: department.managerEmployee?.id ?? "none",
      isActive: department.isActive ? "true" : "false",
    });
    setIsDialogOpen(true);
  }

  const baseCardClass =
    "bg-white rounded-3xl card-pad border border-[#c2c6d3]/30 shadow-sm overflow-hidden flex flex-col h-full";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-shell max-w-7xl page-stack">
      <div className="page-header mb-4">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#006e00]">
            Hierarchy & Clusters
          </p>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">
            Organization Structure
          </h2>
          <p className="text-[#424751] font-medium text-sm max-w-2xl leading-relaxed">
            A real-time overview of the organization's structural hierarchy, leadership paths, and
            departmental clusters.
          </p>
        </div>

        <button
          onClick={openCreateDialog}
          className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="size-4" />
          New Department
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] card-pad-lg border border-[#c2c6d3]/30 shadow-md relative overflow-hidden flex flex-col items-center text-center">
            <div className="size-24 rounded-full bg-[#f7f9fb] shadow-xl border-4 border-white mb-6 flex items-center justify-center font-bold text-2xl text-[#00346f]">
              ADMIN
            </div>
            <h3 className="text-3xl font-black font-headline text-[#191c1e]">Organization Root</h3>
            <p className="text-[#00346f] font-bold uppercase tracking-widest text-[11px] mt-1">
              Global Management Control
            </p>

            <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#eceef0] bg-[#f7f9fb] px-6 py-4 text-center">
                <p className="text-2xl font-black text-[#191c1e]">{departments.length}</p>
                <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest">
                  Departments
                </p>
              </div>
              <div className="rounded-2xl border border-[#eceef0] bg-[#f7f9fb] px-6 py-4 text-center">
                <p className="text-2xl font-black text-[#191c1e]">{totalStaff}</p>
                <p className="text-[9px] font-bold text-[#737783] uppercase tracking-widest">
                  Total Staff
                </p>
              </div>
            </div>
            <div className="absolute top-0 left-0 -ml-12 -mt-12 size-48 bg-[#00346f]/5 rounded-full blur-3xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((department) => (
              <div
                key={department.id}
                className="bg-white rounded-3xl card-pad border border-[#c2c6d3]/30 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="size-12 rounded-2xl bg-[#f7f9fb] flex items-center justify-center text-[#00346f] group-hover:bg-[#00346f] group-hover:text-white transition-colors">
                    <Building2 className="size-6" />
                  </div>
                  <button
                    onClick={() => openEditDialog(department)}
                    className="text-[#c2c6d3] hover:text-[#00346f] transition-colors"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                </div>
                <h4 className="text-xl font-bold font-headline text-[#191c1e] mb-1">
                  {department.name}
                </h4>
                <p className="text-xs font-bold text-[#737783] uppercase tracking-widest truncate">
                  Leadership: {department.managerEmployee?.fullName || "Unassigned"}
                </p>
                <p className="text-[11px] font-medium text-[#737783] mt-2">
                  {department.branch?.name || "No branch"} · {department.isActive ? "Active" : "Inactive"}
                </p>

                <div className="mt-8 pt-6 border-t border-[#eceef0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#424751]">Structure Weight</span>
                    <span className="text-xs font-bold text-[#191c1e]">
                      {department.summary?.employeeCount || 0} Members
                    </span>
                  </div>
                  <div className="w-full bg-[#f7f9fb] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00346f] h-full transition-all"
                      style={{
                        width: `${totalStaff > 0 ? ((department.summary?.employeeCount || 0) / totalStaff) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => openEditDialog(department)}
                  className="mt-6 w-full py-3 rounded-xl bg-[#f7f9fb] text-[10px] font-bold uppercase tracking-[0.2em] text-[#00346f] flex items-center justify-center gap-2 hover:bg-[#eceef0] transition-colors"
                >
                  Edit Cluster <ChevronRight className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className={baseCardClass}>
            <h3 className={`${headerTextClass} mb-8`}>Quick Insights</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[#737783] mb-3">
                  <MapPin className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Global Offices
                  </span>
                </div>
                <p className="text-2xl font-black text-[#191c1e]">Active Clusters</p>
                <p className="text-[11px] font-medium text-[#737783] mt-1">
                  {branchOptions.length || 1} branch configuration loaded
                </p>
              </div>

              <div className="pt-6 border-t border-[#eceef0]">
                <div className="flex items-center gap-2 text-[#737783] mb-3">
                  <TrendingUp className="size-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Staffing Level
                  </span>
                </div>
                <p className="text-2xl font-black text-[#0e9f6e]">{totalStaff} Personnel</p>
                <p className="text-[11px] font-medium text-[#737783] mt-1">
                  Aggregate workforce count
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#00346f] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheck className="size-8 text-[#d5e3fc] mb-4" />
              <h3 className="text-xl font-bold font-headline mb-3 text-white">
                Security Compliance
              </h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                All departmental structures are verified for compliance. Role-based access control
                is active across the hierarchy.
              </p>
              <button
                onClick={openCreateDialog}
                className="mt-8 size-10 rounded-full bg-white text-[#00346f] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 bg-white/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl card-pad-lg bg-white">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black font-headline text-[#00346f] tracking-tight">
              {editingDepartmentId ? "Edit Department" : "Create Department"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Department Name
              </label>
              <Input
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={departmentForm.name}
                onChange={(event) =>
                  setDepartmentForm((currentState) => ({
                    ...currentState,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Department Code
              </label>
              <Input
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={departmentForm.code}
                onChange={(event) =>
                  setDepartmentForm((currentState) => ({
                    ...currentState,
                    code: event.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Branch
              </label>
              <Select
                value={departmentForm.branchId}
                onValueChange={(value) =>
                  setDepartmentForm((currentState) => ({
                    ...currentState,
                    branchId: value ?? "",
                  }))
                }
                disabled={Boolean(editingDepartmentId)}
              >
                <SelectTrigger className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-none">
                  {branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="rounded-xl">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Department Manager
              </label>
              <Select
                value={departmentForm.managerEmployeeId}
                onValueChange={(value) =>
                  setDepartmentForm((currentState) => ({
                    ...currentState,
                    managerEmployeeId: value ?? "none",
                  }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-none max-h-64">
                  <SelectItem value="none" className="rounded-xl">
                    No manager
                  </SelectItem>
                  {managersQuery.data?.items.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id} className="rounded-xl">
                      {manager.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingDepartmentId ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Status
                </label>
                <Select
                  value={departmentForm.isActive}
                  onValueChange={(value) =>
                    setDepartmentForm((currentState) => ({
                      ...currentState,
                      isActive: value ?? "true",
                    }))
                  }
                >
                  <SelectTrigger className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-none">
                    <SelectItem value="true" className="rounded-xl">
                      Active
                    </SelectItem>
                    <SelectItem value="false" className="rounded-xl">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-4 mt-10">
            <button
              className="px-8 py-3 rounded-2xl font-bold bg-[#eceef0] text-[#737783]"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-8 py-3 rounded-2xl font-bold bg-[#00346f] text-white shadow-xl hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
              onClick={() => {
                if (!departmentForm.name.trim()) {
                  toast.error("Department name is required");
                  return;
                }

                if (!editingDepartmentId && !departmentForm.branchId) {
                  toast.error("Branch is required");
                  return;
                }

                if (editingDepartmentId) {
                  updateMutation.mutate();
                  return;
                }

                createMutation.mutate();
              }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : editingDepartmentId ? "Save Changes" : "Create Department"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
