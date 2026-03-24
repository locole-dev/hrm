import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, PencilLine, Building2 } from "lucide-react";

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { CreatePositionPayload, Position } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function PositionsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePositionPayload>({
    companyId: "company-1",
    name: "",
    code: "",
    level: 1,
    isActive: true,
  });

  const positionsQuery = useQuery({
    queryKey: ["positions"],
    queryFn: () => apiGet<Position[]>("/positions"),
  });

  const defaultCompanyId = positionsQuery.data?.[0]?.company?.id ?? "";

  const saveMutation = useMutation({
    mutationFn: () =>
      editingPositionId
        ? apiPatch<Position>(`/positions/${editingPositionId}`, form)
        : apiPost<Position>("/positions", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success(editingPositionId ? "Position updated" : "Position created");
      setIsDialogOpen(false);
      setEditingPositionId(null);
    },
    onError: () => toast.error("Failed to save position"),
  });

  return (
    <div className="page-shell max-w-5xl page-stack">
      
      {/* Header Section */}
      <div className="page-header">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7b2f00]">Organization</p>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-[#00346f]">Job Positions</h2>
          <p className="text-[#424751] font-medium text-sm">Manage hierarchical and structural positions within the company.</p>
        </div>
        
        <div className="page-actions">
            <button 
                onClick={() => {
                   setEditingPositionId(null);
                   setForm({ companyId: defaultCompanyId, name: "", code: "", level: 1, isActive: true });
                   setIsDialogOpen(true);
                }}
                disabled={!defaultCompanyId && (positionsQuery.data?.length ?? 0) === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#00346f] to-[#004a99] text-white shadow-md hover:bg-[#004a99] transition-colors rounded-xl font-bold text-sm justify-center whitespace-nowrap disabled:opacity-50"
            >
                <Plus className="size-4" />
                Add Position
            </button>
        </div>
      </div>

      <Card className="rounded-3xl border border-[#c2c6d3]/30 bg-white shadow-sm overflow-hidden flex flex-col h-full">
        <CardContent className="p-0">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-[#f2f4f6]/50">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#737783]">Position Name</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#737783] w-32">Level</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#737783] w-48 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {positionsQuery.isLoading ? (
                  <tr><td colSpan={3} className="p-8 text-center text-[#737783]">Loading...</td></tr>
              ) : (positionsQuery.data ?? []).map((position) => (
                <tr key={position.id} className="hover:bg-[#f7f9fb] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-[#eceef0] border border-[#c2c6d3]/30 flex items-center justify-center text-[#424751]"><Building2 className="size-5" /></div>
                       <div>
                          <p className="font-bold text-[#00346f]">{position.name}</p>
                          <p className="text-xs text-[#424751] font-medium uppercase tracking-widest mt-0.5">Code: {position.code || "—"} • {position._count?.currentEmployees ?? 0} Employees</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[#424751] font-extrabold font-headline">{position.level ?? 1}</td>
                  <td className="px-6 py-5 text-right">
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-xl bg-white border border-[#c2c6d3]/40 text-[#424751] hover:text-[#00346f] hover:border-[#00346f]/50 hover:bg-[#eceef0] transition shadow-sm"
                      onClick={() => {
                        setEditingPositionId(position.id);
                        setForm({
                          companyId: position.company?.id ?? defaultCompanyId,
                          name: position.name,
                          code: position.code ?? "",
                          level: position.level ?? 1,
                          isActive: position.isActive ?? true,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <PencilLine className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {positionsQuery.data?.length === 0 && (
                  <tr><td colSpan={3} className="p-12 text-center text-[#737783] border-dashed border-b border-[#c2c6d3]">No positions found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-8 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold font-headline text-[#00346f]">{editingPositionId ? "Edit Position" : "Create Position"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-1.5">
               <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Position Name</label>
               <Input className="h-11 rounded-xl bg-[#f7f9fb] border-none focus-visible:ring-2 focus-visible:ring-[#00346f]/20 shadow-none font-medium text-[#191c1e]" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Senior Developer" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Position Code</label>
               <Input className="h-11 rounded-xl bg-[#f7f9fb] border-none focus-visible:ring-2 focus-visible:ring-[#00346f]/20 shadow-none font-medium text-[#191c1e]" value={form.code ?? ""} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="e.g. S-DEV-1" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[11px] font-bold text-[#737783] uppercase tracking-wider">Level</label>
               <Input className="h-11 rounded-xl bg-[#f7f9fb] border-none focus-visible:ring-2 focus-visible:ring-[#00346f]/20 shadow-none font-medium text-[#191c1e]" type="number" min={1} value={String(form.level ?? 1)} onChange={(event) => setForm((current) => ({ ...current, level: Number(event.target.value) }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#eceef0]">
            <button className="px-6 py-3 rounded-xl font-bold bg-[#eceef0] text-[#424751] hover:bg-[#e0e3e5] transition-colors" onClick={() => setIsDialogOpen(false)}>Cancel</button>
            <button className="px-6 py-3 rounded-xl font-bold bg-[#00346f] text-white shadow-sm hover:opacity-90 transition-opacity" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Record"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
