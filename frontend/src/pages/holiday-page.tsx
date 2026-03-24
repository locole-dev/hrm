import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowRightCircle,
  Search,
  Trash2,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { EmployeeProfile } from "@/types/api";

type HolidayItem = {
  id: string;
  name: string;
  holidayDate: string;
  holidayType: "PUBLIC_HOLIDAY" | "COMPANY_HOLIDAY" | "SPECIAL_DAY";
  durationType?: "FULL_DAY" | "HALF_DAY";
};

export function HolidayPage() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear().toString();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    holidayDate: `${currentYear}-01-01`,
    type: "PUBLIC_HOLIDAY" as HolidayItem["holidayType"],
  });

  const employeeQuery = useQuery({
    queryKey: ["employee-me"],
    queryFn: () => apiGet<EmployeeProfile>("/employees/me"),
  });

  const companyId = employeeQuery.data?.company?.id;

  const holidaysQuery = useQuery({
    queryKey: ["holidays", companyId, selectedYear],
    queryFn: () =>
      apiGet<HolidayItem[]>("/holidays", {
        companyId,
        year: selectedYear,
      }),
    enabled: Boolean(companyId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<HolidayItem>("/holidays", {
        companyId,
        year: Number(selectedYear),
        holidayDate: holidayForm.holidayDate,
        name: holidayForm.name.trim(),
        type: holidayForm.type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday created");
      setHolidayForm({
        name: "",
        holidayDate: `${selectedYear}-01-01`,
        type: "PUBLIC_HOLIDAY",
      });
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Failed to create holiday"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/holidays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Holiday removed from ledger");
    },
    onError: () => toast.error("Failed to delete holiday"),
  });

  const holidays = useMemo(() => holidaysQuery.data ?? [], [holidaysQuery.data]);
  const filteredHolidays = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return holidays;
    }

    return holidays.filter((holiday) => holiday.name.toLowerCase().includes(normalizedSearch));
  }, [holidays, search]);

  const availableYears = useMemo(() => {
    const years = new Set<string>([
      String(new Date().getFullYear() - 1),
      String(new Date().getFullYear()),
      String(new Date().getFullYear() + 1),
    ]);

    for (const holiday of holidays) {
      years.add(holiday.holidayDate.slice(0, 4));
    }

    return Array.from(years).sort();
  }, [holidays]);

  return (
    <div className="page-shell max-w-7xl page-stack">
      <div className="page-header">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#737783] tracking-[0.2em] uppercase">
            <span>Organization Settings</span>
            <ArrowRightCircle className="size-3" />
            <span className="text-[#00346f]">Holiday Management</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">
              Public Holidays
            </h2>
            <p className="text-[#424751] font-medium text-sm">
              Configure statutory and regional holidays for the {selectedYear} calendar cycle.
            </p>
          </div>
        </div>

        <div className="page-actions">
          <div className="h-11 px-4 rounded-2xl bg-white border border-[#c2c6d3]/40 flex items-center gap-3 shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#737783]">Active Year:</span>
            <select
              className="bg-transparent text-sm font-bold text-[#00346f] border-none outline-none pr-4"
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(event.target.value);
                setHolidayForm((currentState) => ({
                  ...currentState,
                  holidayDate: `${event.target.value}-01-01`,
                }));
              }}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-11 px-6 rounded-2xl bg-[#00346f] text-white text-[10px] font-bold uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="size-4" /> Initialize Holiday
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="size-12 rounded-2xl bg-[#f5f8ff] text-[#00346f] flex items-center justify-center">
              <CalendarDays className="size-6" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">
              Total Scheduled
            </p>
            <h4 className="text-3xl font-black font-headline text-[#191c1e]">
              {holidays.length} <span className="text-base text-[#737783]">Days</span>
            </h4>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="size-12 rounded-2xl bg-[#def7ec] text-[#006e00] flex items-center justify-center">
              <ShieldCheck className="size-6" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">
              Impact Status
            </p>
            <Badge className="bg-[#def7ec] text-[#006e00] border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
              Compliance Guaranteed
            </Badge>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#c2c6d3]/30 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="size-12 rounded-2xl bg-[#fff4de] text-[#b45d00] flex items-center justify-center">
              <AlertCircle className="size-6" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#737783] uppercase tracking-[0.1em] mb-1">
              Recent Activity
            </p>
            <h4 className="text-lg font-extrabold font-headline text-[#191c1e] truncate">
              {holidays[0]?.name || "None Scheduled"}
            </h4>
            <p className="text-[10px] font-bold text-[#737783] uppercase mt-1">Status Checked</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-[#c2c6d3]/30 shadow-sm overflow-hidden min-h-[500px]">
        <div className="card-pad flex flex-col gap-4 border-b border-[#eceef0] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#737783]" />
            <input
              type="text"
              placeholder="Search holidays, festivals..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#f7f9fb] border border-[#eceef0] rounded-2xl text-xs font-medium focus:outline-none focus:border-[#00346f] transition-all"
            />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#737783] whitespace-nowrap">
            {filteredHolidays.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-[#f7f9fb]/80 border-b border-[#eceef0]">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                  Event Name
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                  Date Pattern
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                  Category
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783]">
                  Duration
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#737783] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {filteredHolidays.map((holiday) => (
                <tr key={holiday.id} className="hover:bg-[#f7f9fb]/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-[#191c1e] text-sm tracking-tight">{holiday.name}</p>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-[#424751] uppercase tracking-wider">
                    {formatDate(holiday.holidayDate)}
                  </td>
                  <td className="px-8 py-5">
                    <Badge className="bg-[#f7f9fb] text-[#737783] border-none text-[8px] font-black uppercase tracking-widest rounded px-2 py-0.5">
                      {holiday.holidayType}
                    </Badge>
                  </td>
                  <td className="px-8 py-5">
                    <Badge className="bg-white border border-[#c2c6d3]/30 text-[#424751] text-[8px] font-black uppercase tracking-widest rounded px-2 py-0.5">
                      {holiday.durationType || "FULL_DAY"}
                    </Badge>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={() => deleteMutation.mutate(holiday.id)}
                        disabled={deleteMutation.isPending}
                        className="size-9 rounded-xl border border-[#eceef0] flex items-center justify-center text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-colors shadow-sm bg-white font-bold disabled:opacity-60"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHolidays.length === 0 && !holidaysQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <p className="text-[10px] font-bold text-[#737783] uppercase tracking-widest">
                      No holidays defined for {selectedYear}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] card-pad-lg bg-white border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black font-headline text-[#00346f] tracking-tight">
              Create Holiday
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                Holiday Name
              </label>
              <Input
                className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                value={holidayForm.name}
                onChange={(event) =>
                  setHolidayForm((currentState) => ({
                    ...currentState,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Holiday Date
                </label>
                <Input
                  type="date"
                  className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold"
                  value={holidayForm.holidayDate}
                  onChange={(event) =>
                    setHolidayForm((currentState) => ({
                      ...currentState,
                      holidayDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#737783] uppercase tracking-widest leading-none">
                  Type
                </label>
                <Select
                  value={holidayForm.type}
                  onValueChange={(value) =>
                    setHolidayForm((currentState) => ({
                      ...currentState,
                      type: (value as HolidayItem["holidayType"]) ?? "PUBLIC_HOLIDAY",
                    }))
                  }
                >
                  <SelectTrigger className="h-12 rounded-2xl bg-[#f7f9fb] border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-none">
                    <SelectItem value="PUBLIC_HOLIDAY" className="rounded-xl">
                      Public Holiday
                    </SelectItem>
                    <SelectItem value="COMPANY_HOLIDAY" className="rounded-xl">
                      Company Holiday
                    </SelectItem>
                    <SelectItem value="SPECIAL_DAY" className="rounded-xl">
                      Special Day
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="px-8 py-3 rounded-2xl bg-[#eceef0] text-[#737783] font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!companyId) {
                  toast.error("Company context is missing");
                  return;
                }

                if (!holidayForm.name.trim()) {
                  toast.error("Holiday name is required");
                  return;
                }

                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
              className="px-8 py-3 rounded-2xl bg-[#00346f] text-white font-bold shadow-xl hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100"
            >
              {createMutation.isPending ? "Saving..." : "Create Holiday"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
