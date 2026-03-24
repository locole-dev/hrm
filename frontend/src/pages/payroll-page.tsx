import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ChevronRight,
  CreditCard,
  FileDown,
  TrendingUp,
  Plus,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  PaginatedResponse,
  PayrollConfigContext,
  PayrollPeriod,
} from "@/types/api";

type PayslipRow = {
  id: string;
  status: string;
  grossIncome: string;
  netIncome: string;
  insuranceDeductionTotal?: string;
  taxDeductionTotal?: string;
  attendanceDeductionTotal?: string;
  employee?: {
    id: string;
    fullName: string;
    employeeCode: string;
    currentDepartment?: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type CreatePeriodFormState = {
  branchId: string;
  year: string;
  month: string;
  periodStart: string;
  periodEnd: string;
};

function buildPeriodDefaults(context?: PayrollConfigContext | null): CreatePeriodFormState {
  const now = new Date();
  const latestYear = context?.latestPayrollPeriod?.year ?? now.getFullYear();
  const latestMonth = context?.latestPayrollPeriod?.month ?? now.getMonth() + 1;
  const nextMonth = latestMonth === 12 ? 1 : latestMonth + 1;
  const nextYear = latestMonth === 12 ? latestYear + 1 : latestYear;
  const firstDay = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const lastDate = new Date(nextYear, nextMonth, 0).getDate();
  const lastDay = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;

  return {
    branchId: context?.defaultBranchId ?? context?.branches[0]?.id ?? "",
    year: String(nextYear),
    month: String(nextMonth),
    periodStart: firstDay,
    periodEnd: lastDay,
  };
}

export function PayrollPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("breakdown");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [isCycleOpen, setIsCycleOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cycleNote, setCycleNote] = useState("");
  const [createPeriodForm, setCreatePeriodForm] = useState<CreatePeriodFormState>(
    buildPeriodDefaults(null),
  );

  const contextQuery = useQuery({
    queryKey: ["payroll-config-context"],
    queryFn: () => apiGet<PayrollConfigContext>("/payroll/config/context"),
  });

  const periodsQuery = useQuery({
    queryKey: ["payroll-periods"],
    queryFn: () => apiGet<PaginatedResponse<PayrollPeriod>>("/payroll/periods", { page: 1, limit: 24 }),
  });

  const periods = useMemo(() => periodsQuery.data?.items ?? [], [periodsQuery.data?.items]);

  const activePeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriodId) ?? periods[0] ?? null,
    [periods, selectedPeriodId],
  );

  const payslipsQuery = useQuery({
    queryKey: ["payroll-payslips", activePeriod?.id],
    queryFn: () => apiGet<PayslipRow[]>(`/payroll/periods/${activePeriod?.id}/payslips`),
    enabled: Boolean(activePeriod?.id),
  });

  const createPeriodMutation = useMutation({
    mutationFn: () =>
      apiPost<PayrollPeriod>("/payroll/periods", {
        companyId: contextQuery.data?.company.id,
        branchId: createPeriodForm.branchId || undefined,
        year: Number(createPeriodForm.year),
        month: Number(createPeriodForm.month),
        periodStart: createPeriodForm.periodStart,
        periodEnd: createPeriodForm.periodEnd,
      }),
    onSuccess: (period) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setSelectedPeriodId(period.id);
      setIsCreateOpen(false);
      toast.success("Payroll period created");
    },
    onError: () => toast.error("Failed to create payroll period"),
  });

  const runDraftMutation = useMutation({
    mutationFn: () =>
      apiPost(`/payroll/periods/${activePeriod?.id}/run-draft`, {
        note: cycleNote.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-payslips"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      toast.success("Payroll draft generated");
    },
    onError: () => toast.error("Failed to run payroll draft"),
  });

  const publishMutation = useMutation({
    mutationFn: () => apiPatch(`/payroll/periods/${activePeriod?.id}/publish`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-payslips"] });
      toast.success("Payroll published");
    },
    onError: () => toast.error("Failed to publish payroll"),
  });

  const toggleLockMutation = useMutation({
    mutationFn: () =>
      apiPatch(
        `/payroll/periods/${activePeriod?.id}/${activePeriod?.status === "LOCKED" ? "unlock" : "lock"}`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      toast.success(activePeriod?.status === "LOCKED" ? "Payroll period unlocked" : "Payroll period locked");
    },
    onError: () => toast.error("Failed to update payroll lock state"),
  });

  const payslips = payslipsQuery.data ?? [];
  const totals = payslips.reduce(
    (accumulator, payslip) => ({
      gross: accumulator.gross + Number(payslip.grossIncome || 0),
      deductions:
        accumulator.deductions +
        Number(payslip.insuranceDeductionTotal || 0) +
        Number(payslip.taxDeductionTotal || 0) +
        Number(payslip.attendanceDeductionTotal || 0),
      net: accumulator.net + Number(payslip.netIncome || 0),
    }),
    { gross: 0, deductions: 0, net: 0 },
  );

  const isLoading = contextQuery.isLoading || periodsQuery.isLoading || Boolean(activePeriod?.id && payslipsQuery.isLoading);
  const isMutating =
    createPeriodMutation.isPending ||
    runDraftMutation.isPending ||
    publishMutation.isPending ||
    toggleLockMutation.isPending;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4 text-[#c2c6d3]">
          <Banknote className="size-12" />
          <p className="font-bold uppercase tracking-widest text-[10px]">
            Synchronizing payroll ledger...
          </p>
        </div>
      </div>
    );
  }

  if (contextQuery.isError || periodsQuery.isError) {
    return (
      <div className="page-shell max-w-3xl">
        <div className="bg-white rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm p-10 text-center">
          <h2 className="text-2xl font-black font-headline text-[#00346f]">Payroll Access Required</h2>
          <p className="text-sm font-medium text-[#737783] mt-3">
            This screen needs payroll permissions from the backend before data can be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl">
      <div className="page-header mb-8 lg:mb-12">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
            <span>Financial Ops</span>
            <ChevronRight className="size-3" />
            <span className="text-[#00346f]">Disbursement Control</span>
          </nav>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">
            Payroll Administration
          </h2>
        </div>

        <div className="page-actions">
          <button
            onClick={() => {
              setCreatePeriodForm(buildPeriodDefaults(contextQuery.data));
              setIsCreateOpen(true);
            }}
            className="h-12 px-6 rounded-2xl bg-white border border-[#c2c6d3]/30 flex items-center justify-center text-[#737783] hover:bg-[#f7f9fb] transition-colors gap-2"
          >
            <Plus className="size-4" />
            New Period
          </button>
          <button
            onClick={() => toggleLockMutation.mutate()}
            disabled={!activePeriod || isMutating}
            title={activePeriod?.status === "LOCKED" ? "Unlock selected period" : "Lock selected period"}
            className="h-12 w-full rounded-2xl bg-white border border-[#c2c6d3]/30 flex items-center justify-center text-[#737783] hover:bg-[#f7f9fb] transition-colors disabled:opacity-60 sm:w-12"
          >
            {activePeriod?.status === "LOCKED" ? <Unlock className="size-5" /> : <Lock className="size-5" />}
          </button>
          <button
            onClick={() => setIsCycleOpen(true)}
            disabled={!activePeriod}
            className="h-12 px-8 rounded-2xl bg-[#0e9f6e] text-white text-[13px] font-black tracking-tight shadow-xl shadow-[#0e9f6e]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-60 disabled:hover:scale-100"
          >
            <FileDown className="size-5" />
            Run Cycle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#191c1e] rounded-[2.5rem] card-pad-lg text-white shadow-2xl relative overflow-hidden">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-6">
            Aggregate Net Disbursement
          </p>
          <h3 className="text-4xl font-black font-headline tracking-tighter mb-2">
            {formatCurrency(totals.net)}
          </h3>
          <p className="text-[11px] font-bold text-[#0e9f6e] uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="size-3" /> {payslips.length} payslips in current cycle
          </p>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="bg-white rounded-[2.5rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm">
          <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-6">
            Accrued Deductions
          </p>
          <h3 className="text-4xl font-black font-headline tracking-tighter text-[#191c1e] mb-2">
            {formatCurrency(totals.deductions)}
          </h3>
          <p className="text-[11px] font-bold text-[#737783] uppercase tracking-widest leading-none">
            Tax & Statutory Social Hub
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm">
          <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-6">
            Active Period
          </p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-black font-headline tracking-tighter text-[#191c1e]">
              {activePeriod ? `${activePeriod.month}/${activePeriod.year}` : "--"}
            </h3>
          </div>
          <p className="text-[11px] font-bold text-[#00346f] uppercase tracking-widest mt-2 flex items-center gap-2">
            {activePeriod?.status ?? "No cycle"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-[#c2c6d3]/30 overflow-hidden shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#eceef0] px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10 lg:py-8">
          <h4 className="text-xl font-black font-headline text-[#191c1e]">Monthly Breakdown</h4>
          <div className="flex gap-4 items-center flex-wrap">
            <Select
              value={activePeriod?.id ?? ""}
              onValueChange={(value) => setSelectedPeriodId(value)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl bg-white border-[#c2c6d3]/30 text-[10px] font-bold uppercase tracking-widest sm:w-56">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {periods.map((period) => (
                  <SelectItem
                    key={period.id}
                    value={period.id}
                    className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    {period.month}/{period.year} {period.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex bg-[#f7f9fb] rounded-xl p-1 border border-[#c2c6d3]/20">
              {["breakdown", "analytics"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab ? "bg-white shadow-sm text-[#00346f]" : "text-[#737783] hover:text-[#00346f]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f9fb]/50 border-b border-[#eceef0]">
                <th className="px-10 py-6 text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                  Colleague
                </th>
                <th className="px-10 py-6 text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                  Department
                </th>
                <th className="px-10 py-6 text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                  Gross Allocation
                </th>
                <th className="px-10 py-6 text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                  Net Payout
                </th>
                <th className="px-10 py-6 text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                  Status
                </th>
                <th className="px-10 py-6" />
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip) => (
                <tr
                  key={payslip.id}
                  className="border-b border-[#eceef0] hover:bg-[#f7f9fb]/40 transition-colors group"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-[#737783] font-bold text-xs">
                        {payslip.employee?.fullName?.substring(0, 2).toUpperCase() || "EE"}
                      </div>
                      <div>
                        <p className="font-bold text-[#191c1e] text-sm leading-tight">
                          {payslip.employee?.fullName}
                        </p>
                        <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mt-1">
                          #{payslip.employee?.employeeCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-bold text-[#424751] uppercase tracking-widest">
                      {payslip.employee?.currentDepartment?.name || "Corporate"}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-bold text-[#191c1e] text-sm">
                      {formatCurrency(Number(payslip.grossIncome || 0))}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <p className="font-black text-[#00346f] text-base font-headline">
                      {formatCurrency(Number(payslip.netIncome || 0))}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-2 rounded-full ${
                          payslip.status === "PUBLISHED" ? "bg-[#0e9f6e]" : "bg-[#e3a008]"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-[#191c1e] uppercase tracking-widest">
                        {payslip.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="flex h-10 items-center gap-2 rounded-xl border border-[#eceef0] bg-white px-4 text-[9px] font-bold uppercase tracking-widest text-[#737783] shadow-sm transition-all hover:bg-[#00346f] hover:text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <CreditCard className="size-3.5" /> View Ledger
                    </button>
                  </td>
                </tr>
              ))}
              {!payslips.length ? (
                <tr>
                  <td colSpan={6} className="px-10 py-16 text-center text-sm font-bold text-[#737783] uppercase tracking-widest">
                    No payslips generated for this period yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 bg-[#f7f9fb]/30 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10 lg:py-8">
          <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">
            Showing {payslips.length} global entries
          </p>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#00346f]">
            {contextQuery.data?.company.name}
          </div>
        </div>
      </div>

      <Dialog open={isCycleOpen} onOpenChange={setIsCycleOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] card-pad-lg bg-white border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black font-headline text-[#191c1e] tracking-tight">
              Cycle Authorization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#f7f9fb] border border-[#eceef0]">
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mb-1">
                Selected Period
              </p>
              <p className="text-3xl font-black text-[#00346f] font-headline">
                {activePeriod ? `${activePeriod.month}/${activePeriod.year}` : "--"}
              </p>
              <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest mt-2">
                Status: {activePeriod?.status ?? "N/A"}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Run Note
              </label>
              <Input
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={cycleNote}
                onChange={(event) => setCycleNote(event.target.value)}
                placeholder="Optional note for this payroll run"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-10">
            <button
              onClick={() => runDraftMutation.mutate()}
              disabled={!activePeriod || isMutating}
              className="w-full py-4 rounded-2xl bg-[#00346f] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#00346f]/20 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {runDraftMutation.isPending ? "Running Draft..." : "Run Draft"}
            </button>
            <button
              onClick={() => publishMutation.mutate()}
              disabled={!activePeriod || isMutating}
              className="w-full py-4 rounded-2xl bg-[#0e9f6e] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#0e9f6e]/20 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {publishMutation.isPending ? "Publishing..." : "Publish Payslips"}
            </button>
            <button
              onClick={() => toggleLockMutation.mutate()}
              disabled={!activePeriod || isMutating}
              className="w-full py-4 rounded-2xl bg-[#eceef0] text-[#737783] font-bold text-xs uppercase tracking-widest disabled:opacity-60"
            >
              {toggleLockMutation.isPending
                ? "Updating..."
                : activePeriod?.status === "LOCKED"
                  ? "Unlock Period"
                  : "Lock Period"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] card-pad-lg bg-white border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black font-headline text-[#00346f] tracking-tight">
              Create Payroll Period
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Branch
              </label>
              <Select
                value={createPeriodForm.branchId}
                onValueChange={(value) =>
                  setCreatePeriodForm((currentState) => ({
                    ...currentState,
                    branchId: value ?? "",
                  }))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {(contextQuery.data?.branches ?? []).map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="rounded-xl">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Year
              </label>
              <Input
                type="number"
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={createPeriodForm.year}
                onChange={(event) =>
                  setCreatePeriodForm((currentState) => ({
                    ...currentState,
                    year: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Month
              </label>
              <Input
                type="number"
                min="1"
                max="12"
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={createPeriodForm.month}
                onChange={(event) =>
                  setCreatePeriodForm((currentState) => ({
                    ...currentState,
                    month: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Period Start
              </label>
              <Input
                type="date"
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={createPeriodForm.periodStart}
                onChange={(event) =>
                  setCreatePeriodForm((currentState) => ({
                    ...currentState,
                    periodStart: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Period End
              </label>
              <Input
                type="date"
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={createPeriodForm.periodEnd}
                onChange={(event) =>
                  setCreatePeriodForm((currentState) => ({
                    ...currentState,
                    periodEnd: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-10">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-8 py-3 rounded-2xl bg-[#eceef0] text-[#737783] font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!contextQuery.data?.company.id) {
                  toast.error("Company context is missing");
                  return;
                }

                createPeriodMutation.mutate();
              }}
              disabled={createPeriodMutation.isPending}
              className="px-8 py-3 rounded-2xl bg-[#00346f] text-white font-bold shadow-xl hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {createPeriodMutation.isPending ? "Creating..." : "Create Period"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
