import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  ArrowRightCircle,
  ShieldCheck,
  Zap,
  History,
  Info,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiGet, apiPatch } from "@/lib/api";
import type {
  PayrollConfigContext,
  PayrollRulesConfig,
  TaxBracketConfig,
} from "@/types/api";

type RuleFormState = {
  insuranceRule: {
    effectiveFrom: string;
    employeeBhxhRate: string;
    employeeBhytRate: string;
    employeeBhtnRate: string;
    employerBhxhRate: string;
    employerBhytRate: string;
    employerBhtnRate: string;
    salaryCap: string;
    notes: string;
  };
  taxRule: {
    effectiveFrom: string;
    personalDeduction: string;
    dependentDeduction: string;
    notes: string;
    brackets: Array<{
      bracketOrder: number;
      fromAmount: string;
      toAmount: string;
      rate: string;
      quickDeduction: string;
    }>;
  };
};

function createDefaultBrackets(): RuleFormState["taxRule"]["brackets"] {
  return [
    { bracketOrder: 1, fromAmount: "0", toAmount: "5000000", rate: "5", quickDeduction: "0" },
    { bracketOrder: 2, fromAmount: "5000001", toAmount: "10000000", rate: "10", quickDeduction: "250000" },
    { bracketOrder: 3, fromAmount: "10000001", toAmount: "18000000", rate: "15", quickDeduction: "750000" },
    { bracketOrder: 4, fromAmount: "18000001", toAmount: "32000000", rate: "20", quickDeduction: "1650000" },
    { bracketOrder: 5, fromAmount: "32000001", toAmount: "52000000", rate: "25", quickDeduction: "3250000" },
    { bracketOrder: 6, fromAmount: "52000001", toAmount: "80000000", rate: "30", quickDeduction: "5850000" },
    { bracketOrder: 7, fromAmount: "80000001", toAmount: "", rate: "35", quickDeduction: "9850000" },
  ];
}

function createDefaultForm(year: string): RuleFormState {
  return {
    insuranceRule: {
      effectiveFrom: `${year}-01-01`,
      employeeBhxhRate: "8",
      employeeBhytRate: "1.5",
      employeeBhtnRate: "1",
      employerBhxhRate: "17.5",
      employerBhytRate: "3",
      employerBhtnRate: "1",
      salaryCap: "49600000",
      notes: "",
    },
    taxRule: {
      effectiveFrom: `${year}-01-01`,
      personalDeduction: "11000000",
      dependentDeduction: "4400000",
      notes: "",
      brackets: createDefaultBrackets(),
    },
  };
}

function normalizeRuleForm(year: string, rules?: PayrollRulesConfig | null): RuleFormState {
  if (!rules) {
    return createDefaultForm(year);
  }

  return {
    insuranceRule: {
      effectiveFrom: rules.insuranceRule?.effectiveFrom?.slice(0, 10) ?? `${year}-01-01`,
      employeeBhxhRate: rules.insuranceRule?.employeeBhxhRate ?? "8",
      employeeBhytRate: rules.insuranceRule?.employeeBhytRate ?? "1.5",
      employeeBhtnRate: rules.insuranceRule?.employeeBhtnRate ?? "1",
      employerBhxhRate: rules.insuranceRule?.employerBhxhRate ?? "17.5",
      employerBhytRate: rules.insuranceRule?.employerBhytRate ?? "3",
      employerBhtnRate: rules.insuranceRule?.employerBhtnRate ?? "1",
      salaryCap: rules.insuranceRule?.salaryCap ?? "49600000",
      notes: rules.insuranceRule?.notes ?? "",
    },
    taxRule: {
      effectiveFrom: rules.taxRule?.effectiveFrom?.slice(0, 10) ?? `${year}-01-01`,
      personalDeduction: rules.taxRule?.personalDeduction ?? "11000000",
      dependentDeduction: rules.taxRule?.dependentDeduction ?? "4400000",
      notes: rules.taxRule?.notes ?? "",
      brackets:
        rules.taxRule?.brackets?.map((bracket: TaxBracketConfig) => ({
          bracketOrder: bracket.bracketOrder,
          fromAmount: bracket.fromAmount,
          toAmount: bracket.toAmount ?? "",
          rate: bracket.rate,
          quickDeduction: bracket.quickDeduction ?? "",
        })) ?? createDefaultBrackets(),
    },
  };
}

export function PayrollRulesPage() {
  const queryClient = useQueryClient();
  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [form, setForm] = useState<RuleFormState>(createDefaultForm(currentYear));

  const contextQuery = useQuery({
    queryKey: ["payroll-config-context"],
    queryFn: () => apiGet<PayrollConfigContext>("/payroll/config/context"),
  });

  useEffect(() => {
    if (contextQuery.data?.availableRuleYears?.length) {
      setSelectedYear(String(contextQuery.data.availableRuleYears[0]));
    }
  }, [contextQuery.data]);

  const rulesQuery = useQuery({
    queryKey: ["payroll-rules", contextQuery.data?.company.id, selectedYear],
    queryFn: () =>
      apiGet<PayrollRulesConfig>("/payroll/config/rules", {
        companyId: contextQuery.data?.company.id,
        year: selectedYear,
      }),
    enabled: Boolean(contextQuery.data?.company.id && selectedYear),
  });

  useEffect(() => {
    setForm(normalizeRuleForm(selectedYear, rulesQuery.data));
  }, [rulesQuery.data, selectedYear]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPatch("/payroll/config/rules", {
        companyId: contextQuery.data?.company.id,
        year: Number(selectedYear),
        insuranceRule: {
          ...form.insuranceRule,
          notes: form.insuranceRule.notes.trim() || undefined,
          salaryCap: form.insuranceRule.salaryCap || undefined,
        },
        taxRule: {
          ...form.taxRule,
          notes: form.taxRule.notes.trim() || undefined,
          brackets: form.taxRule.brackets.map((bracket) => ({
            bracketOrder: bracket.bracketOrder,
            fromAmount: bracket.fromAmount,
            toAmount: bracket.toAmount || undefined,
            rate: bracket.rate,
            quickDeduction: bracket.quickDeduction || undefined,
          })),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-rules"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-config-context"] });
      toast.success("Configuration saved successfully");
    },
    onError: () => toast.error("Failed to save payroll rules"),
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>(contextQuery.data?.availableRuleYears ?? []);
    years.add(Number(currentYear));
    years.add(Number(currentYear) + 1);
    return Array.from(years).sort((left, right) => right - left);
  }, [contextQuery.data?.availableRuleYears, currentYear]);

  const baseCardClass =
    "bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm relative overflow-hidden h-full flex flex-col justify-between";
  const headerTextClass = "text-xl font-bold font-headline text-[#191c1e]";

  if (contextQuery.isError) {
    return (
      <div className="page-shell max-w-3xl">
        <div className="bg-white rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm p-10 text-center">
          <h2 className="text-2xl font-black font-headline text-[#00346f]">Payroll Access Required</h2>
          <p className="text-sm font-medium text-[#737783] mt-3">
            Payroll rules can only be loaded for users with payroll permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-7xl page-stack">
      <div className="page-header">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
            <span>Payroll Control</span>
            <ArrowRightCircle className="size-3" />
            <span className="text-[#00346f]">Statutory Multipliers</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">
              Statutory Rules
            </h2>
            <p className="text-[#424751] font-medium text-sm">
              Configure threshold multipliers for BHXH, BHYT, and TNCN compliance ({selectedYear}).
            </p>
          </div>
        </div>

        <div className="page-actions">
          <div className="flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-[#c2c6d3]/40 bg-white px-4 sm:w-auto sm:justify-start">
            <span className="text-[10px] font-black uppercase text-[#737783]">Active Policy:</span>
            <select
              className="bg-transparent text-sm font-bold text-[#00346f] border-none outline-none pr-4"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year} Policy
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || rulesQuery.isLoading}
            className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-[10px] font-bold uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="size-4" /> {saveMutation.isPending ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-[1.5rem] bg-[#f0f4f8] text-[#424751] flex items-center justify-center">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h3 className={headerTextClass}>Social Insurance Multipliers</h3>
                <p className="text-xs font-medium text-[#737783] mt-0.5">
                  Define employee and employer contribution percentages.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-8 bg-[#f7f9fb] rounded-[2rem] border border-[#eceef0] space-y-6">
                <h4 className="text-[10px] font-black text-[#00346f] uppercase tracking-widest mb-4">
                  Employee Share
                </h4>
                <div className="space-y-6">
                  {[
                    { label: "Social Ins (BHXH)", key: "employeeBhxhRate" },
                    { label: "Health Ins (BHYT)", key: "employeeBhytRate" },
                    { label: "Unemployment (BHTN)", key: "employeeBhtnRate" },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-[#424751]">{field.label}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          value={form.insuranceRule[field.key as keyof RuleFormState["insuranceRule"]] as string}
                          onChange={(event) =>
                            setForm((currentState) => ({
                              ...currentState,
                              insuranceRule: {
                                ...currentState.insuranceRule,
                                [field.key]: event.target.value,
                              },
                            }))
                          }
                          className="w-20 h-9 bg-white border border-[#c2c6d3]/40 rounded-lg text-right px-2 text-xs font-bold text-[#00346f]"
                        />
                        <span className="text-xs font-bold text-[#737783]">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-[#f5f8ff] rounded-[2rem] border border-[#d5e3fc] space-y-6">
                <h4 className="text-[10px] font-black text-[#00346f] uppercase tracking-widest mb-4">
                  Employer Share
                </h4>
                <div className="space-y-6">
                  {[
                    { label: "Social Ins (BHXH)", key: "employerBhxhRate" },
                    { label: "Health Ins (BHYT)", key: "employerBhytRate" },
                    { label: "Unemployment (BHTN)", key: "employerBhtnRate" },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-[#424751]">{field.label}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          value={form.insuranceRule[field.key as keyof RuleFormState["insuranceRule"]] as string}
                          onChange={(event) =>
                            setForm((currentState) => ({
                              ...currentState,
                              insuranceRule: {
                                ...currentState.insuranceRule,
                                [field.key]: event.target.value,
                              },
                            }))
                          }
                          className="w-20 h-9 bg-white border border-[#c2c6d3]/40 rounded-lg text-right px-2 text-xs font-bold text-[#00346f]"
                        />
                        <span className="text-xs font-bold text-[#737783]">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Effective From
                </label>
                <Input
                  type="date"
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={form.insuranceRule.effectiveFrom}
                  onChange={(event) =>
                    setForm((currentState) => ({
                      ...currentState,
                      insuranceRule: {
                        ...currentState.insuranceRule,
                        effectiveFrom: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Salary Cap
                </label>
                <Input
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={form.insuranceRule.salaryCap}
                  onChange={(event) =>
                    setForm((currentState) => ({
                      ...currentState,
                      insuranceRule: {
                        ...currentState.insuranceRule,
                        salaryCap: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] card-pad-lg border border-[#c2c6d3]/30 shadow-sm space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-[1.5rem] bg-[#f5f8ff] text-[#00346f] flex items-center justify-center">
                  <Calculator className="size-6" />
                </div>
                <div>
                  <h3 className={headerTextClass}>Personal Income Tax (TNCN)</h3>
                  <p className="text-xs font-medium text-[#737783] mt-0.5">
                    Progressive tax brackets according to Circular 111/2013/TT-BTC.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setForm((currentState) => ({
                    ...currentState,
                    taxRule: {
                      ...currentState.taxRule,
                      brackets: [
                        ...currentState.taxRule.brackets,
                        {
                          bracketOrder: currentState.taxRule.brackets.length + 1,
                          fromAmount: "",
                          toAmount: "",
                          rate: "",
                          quickDeduction: "",
                        },
                      ],
                    },
                  }))
                }
                className="h-10 px-5 rounded-xl bg-white border border-[#c2c6d3]/30 text-[9px] font-black uppercase tracking-widest text-[#00346f] shadow-sm flex items-center gap-2"
              >
                <Plus className="size-3" /> Add Bracket
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Effective From
                </label>
                <Input
                  type="date"
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={form.taxRule.effectiveFrom}
                  onChange={(event) =>
                    setForm((currentState) => ({
                      ...currentState,
                      taxRule: {
                        ...currentState.taxRule,
                        effectiveFrom: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Personal Deduction
                </label>
                <Input
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={form.taxRule.personalDeduction}
                  onChange={(event) =>
                    setForm((currentState) => ({
                      ...currentState,
                      taxRule: {
                        ...currentState.taxRule,
                        personalDeduction: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Dependent Deduction
                </label>
                <Input
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={form.taxRule.dependentDeduction}
                  onChange={(event) =>
                    setForm((currentState) => ({
                      ...currentState,
                      taxRule: {
                        ...currentState.taxRule,
                        dependentDeduction: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#eceef0]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f7f9fb] border-b border-[#eceef0]">
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#737783]">
                      Bracket
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#737783]">
                      Income From
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#737783]">
                      Income To
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#737783]">
                      Rate (%)
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#737783]">
                      Quick Deduction
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-[#737783] text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
                  {form.taxRule.brackets.map((bracket, index) => (
                    <tr key={`${bracket.bracketOrder}-${index}`} className="hover:bg-[#f7f9fb]/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-[#737783] uppercase tracking-widest">
                        Tier {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={bracket.fromAmount}
                          onChange={(event) =>
                            setForm((currentState) => ({
                              ...currentState,
                              taxRule: {
                                ...currentState.taxRule,
                                brackets: currentState.taxRule.brackets.map((currentBracket, currentIndex) =>
                                  currentIndex === index
                                    ? { ...currentBracket, fromAmount: event.target.value }
                                    : currentBracket,
                                ),
                              },
                            }))
                          }
                          className="h-10 rounded-xl bg-white border border-[#c2c6d3]/40 font-bold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={bracket.toAmount}
                          onChange={(event) =>
                            setForm((currentState) => ({
                              ...currentState,
                              taxRule: {
                                ...currentState.taxRule,
                                brackets: currentState.taxRule.brackets.map((currentBracket, currentIndex) =>
                                  currentIndex === index
                                    ? { ...currentBracket, toAmount: event.target.value }
                                    : currentBracket,
                                ),
                              },
                            }))
                          }
                          className="h-10 rounded-xl bg-white border border-[#c2c6d3]/40 font-bold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={bracket.rate}
                          onChange={(event) =>
                            setForm((currentState) => ({
                              ...currentState,
                              taxRule: {
                                ...currentState.taxRule,
                                brackets: currentState.taxRule.brackets.map((currentBracket, currentIndex) =>
                                  currentIndex === index
                                    ? { ...currentBracket, rate: event.target.value }
                                    : currentBracket,
                                ),
                              },
                            }))
                          }
                          className="h-10 rounded-xl bg-white border border-[#c2c6d3]/40 font-bold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={bracket.quickDeduction}
                          onChange={(event) =>
                            setForm((currentState) => ({
                              ...currentState,
                              taxRule: {
                                ...currentState.taxRule,
                                brackets: currentState.taxRule.brackets.map((currentBracket, currentIndex) =>
                                  currentIndex === index
                                    ? { ...currentBracket, quickDeduction: event.target.value }
                                    : currentBracket,
                                ),
                              },
                            }))
                          }
                          className="h-10 rounded-xl bg-white border border-[#c2c6d3]/40 font-bold"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            setForm((currentState) => ({
                              ...currentState,
                              taxRule: {
                                ...currentState.taxRule,
                                brackets: currentState.taxRule.brackets
                                  .filter((_, currentIndex) => currentIndex !== index)
                                  .map((currentBracket, currentIndex) => ({
                                    ...currentBracket,
                                    bracketOrder: currentIndex + 1,
                                  })),
                              },
                            }))
                          }
                          disabled={form.taxRule.brackets.length === 1}
                          className="size-9 rounded-xl border border-[#eceef0] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-colors inline-flex items-center justify-center disabled:opacity-40"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#00346f] rounded-[3rem] card-pad-lg text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div className="size-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center">
                <Zap className="size-8" />
              </div>
              <h3 className="text-3xl font-black font-headline leading-tight tracking-tighter">
                Company Payroll Context
              </h3>
              <p className="text-sm text-white/60 leading-relaxed font-medium">
                {contextQuery.data?.company.name ?? "Loading company..."} with{" "}
                {contextQuery.data?.branches.length ?? 0} branch(es) configured for payroll.
              </p>
              <Badge className="bg-white text-[#00346f] border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
                {rulesQuery.data?.insuranceRule || rulesQuery.data?.taxRule ? "Seeded" : "Defaulting"}
              </Badge>
            </div>
            <div className="absolute top-0 left-0 -ml-16 -mt-16 size-64 bg-white/5 rounded-full blur-[100px]" />
          </div>

          <div className={baseCardClass}>
            <h3 className="text-[10px] font-black text-[#737783] uppercase tracking-widest">
              Policy Governance
            </h3>
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-4 p-4 hover:bg-[#f7f9fb] rounded-2xl transition-all">
                <div className="size-10 rounded-xl bg-[#f0f4f8] text-[#424751] flex items-center justify-center transition-all">
                  <History className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#191c1e]">Revision History</p>
                  <p className="text-[8px] font-bold text-[#737783] uppercase tracking-widest mt-0.5">
                    {form.taxRule.brackets.length} tax brackets loaded
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 hover:bg-[#f7f9fb] rounded-2xl transition-all">
                <div className="size-10 rounded-xl bg-[#f0f4f8] text-[#424751] flex items-center justify-center transition-all">
                  <Info className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#191c1e]">Compliance Guide</p>
                  <p className="text-[8px] font-bold text-[#737783] uppercase tracking-widest mt-0.5">
                    Vietnam payroll policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
