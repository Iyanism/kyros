import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientStatusBadge } from "./client_status_badge";
import type { ClientResponse } from "@/types/client";
import { Trash2 } from "lucide-react";

interface ClientsTableProps {
  clients: ClientResponse[];
  onToggleStatus: (clientId: string) => void;
  onDelete: (clientId: string) => void;
}

export function ClientsTable({ clients, onToggleStatus, onDelete }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-[16px] border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
        <div className="text-center py-12 text-[#94a3b8] text-sm">No clients found matching your criteria</div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-[#f8fafc] border-b border-[#e2e8f0]">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-4 whitespace-nowrap">
              Client Name
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              Contact
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              Address
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              City
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              State
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              PIN
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap">
              GSTIN
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 whitespace-nowrap w-31.5 min-w-31.5">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#64748b] px-3 pr-6 whitespace-nowrap text-right w-42.5 min-w-42.5">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="hover:bg-[#f8fafc]/60 border-b border-[#f1f5f9]">
              <TableCell className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2457e6]/10 text-[#2457e6] font-bold text-xs border border-[#2457e6]/20">
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#0f172a] leading-tight truncate max-w-40">
                      {client.name}
                    </div>
                    <div className="text-[11px] text-[#64748b] leading-tight truncate max-w-40">{client.email}</div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="px-3 text-[12px] font-medium text-[#64748b] whitespace-nowrap">{client.phone_number}</TableCell>

              <TableCell className="px-3 text-[12px] font-medium text-[#475569] max-w-45 truncate" title={client.address}>
                {client.address}
              </TableCell>

              <TableCell className="px-3 text-[12px] font-medium text-[#475569] whitespace-nowrap">{client.city}</TableCell>

              <TableCell className="px-3 text-[12px] font-medium text-[#475569] whitespace-nowrap">{client.state}</TableCell>

              <TableCell className="px-3 text-[12px] font-medium text-[#64748b] whitespace-nowrap">{client.pin_code}</TableCell>

              <TableCell className="px-3 text-[11px] font-medium text-[#64748b] whitespace-nowrap max-w-30 truncate" title={client.gstin ?? ""}>
                {client.gstin || "—"}
              </TableCell>

              <TableCell className="px-3 w-31.5 min-w-31.5">
                <div className="w-25.5">
                  <ClientStatusBadge isActive={client.is_active} />
                </div>
              </TableCell>

              <TableCell className="px-3 pr-6 text-right w-42.5 min-w-42.5">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(client.id)}
                    className={`inline-flex items-center justify-center whitespace-nowrap text-[11px] font-semibold px-2.5 py-1 rounded-md transition border ${
                      client.is_active
                        ? "text-[#b91c1c] border-[#fecaca] hover:bg-[#fef2f2]"
                        : "text-[#15803d] border-[#bbf7d0] hover:bg-[#f0fdf4]"
                    }`}
                  >
                    {client.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(client.id)}
                    aria-label={`Delete ${client.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8f0] text-[#64748b] hover:text-[#b91c1c] hover:border-[#fecaca] hover:bg-[#fef2f2] transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
