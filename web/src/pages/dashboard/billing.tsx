import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader, Sidebar } from "@/components/shared/dashboard_layout";
import { InvoiceStats } from "@/components/invoice/invoice_stats";
import { InvoiceFilters } from "@/components/invoice/invoice_filters";
import { InvoiceTable } from "@/components/invoice/invoice_table";
import { InvoiceDetailDialog } from "@/components/invoice/invoice_detail_dialog";
import { GenerateInvoiceDialog } from "@/components/invoice/generate_invoice_dialog";
import { PayInvoiceModal } from "@/components/payment/pay_invoice_modal";
import { PaymentHistoryDialog } from "@/components/payment/payment_history_dialog";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import {
  dateInRange,
  EMPTY_DATE_RANGE,
  type DateRange,
} from "@/components/shared/date_range_filter";
import {
  get_invoices,
  get_invoice,
  update_invoice_status,
  download_invoice_pdf,
} from "@/lib/api/invoice";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import { useAuth } from "@/hooks/useAuth";
import type { InvoiceDetailResponse, InvoiceStatus } from "@/types/invoice";
import type { PaymentDetailResponse } from "@/types/payment";

export function Billing() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [invoices, setInvoices] = useState<InvoiceDetailResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [createdRange, setCreatedRange] = useState<DateRange>(EMPTY_DATE_RANGE);
  const [isLoading, setIsLoading] = useState(true);

  // Active detail modal
  const [activeInvoice, setActiveInvoice] = useState<InvoiceDetailResponse | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Payment modals
  const [activePayInvoice, setActivePayInvoice] = useState<InvoiceDetailResponse | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const invoiceData = await get_invoices();
        if (cancelled) return;
        setInvoices(invoiceData);
        // Keep an open detail dialog in sync (refunds change amount_paid)
        setActiveInvoice((prev) =>
          prev ? (invoiceData.find((inv) => inv.id === prev.id) ?? prev) : prev
        );
      } catch (error) {
        console.error("Failed to load invoices:", error);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [historyRefreshKey]);

  const handleAddInvoice = (newInvoice: InvoiceDetailResponse) => {
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const handleStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const updated = await update_invoice_status(invoiceId, newStatus);
      setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
      if (activeInvoice && activeInvoice.id === invoiceId) {
        setActiveInvoice(updated);
      }
      toast.success(`Invoice ${updated.invoice_number} status updated to '${newStatus}'`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      toast.info(`Downloading PDF for ${invoiceNumber}...`);
      await download_invoice_pdf(invoiceId, invoiceNumber);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleOpenDetail = (invoice: InvoiceDetailResponse) => {
    // Show the row immediately, then refresh with the latest server state
    setActiveInvoice(invoice);
    setDetailModalOpen(true);
    void (async () => {
      try {
        const fresh = await get_invoice(invoice.id);
        setInvoices((prev) => prev.map((inv) => (inv.id === fresh.id ? fresh : inv)));
        setActiveInvoice((prev) => (prev && prev.id === fresh.id ? fresh : prev));
      } catch {
        // Keep the row data if the refresh fails (offline / permission edge cases)
      }
    })();
  };

  const handlePayInvoice = (invoice: InvoiceDetailResponse) => {
    setActivePayInvoice(invoice);
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = (payment: PaymentDetailResponse) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === payment.invoice_id
          ? { ...inv, status: "paid" as InvoiceStatus, amount_paid: payment.amount }
          : inv
      )
    );
    if (activeInvoice && activeInvoice.id === payment.invoice_id) {
      setActiveInvoice((prev) =>
        prev ? { ...prev, status: "paid" as InvoiceStatus, amount_paid: payment.amount } : null
      );
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      inv.invoice_number.toLowerCase().includes(term) ||
      (inv.client_name && inv.client_name.toLowerCase().includes(term)) ||
      (inv.client_gstin && inv.client_gstin.toLowerCase().includes(term));

    const matchesStatus = selectedStatus === "all" || inv.status === selectedStatus;
    const matchesDate = dateInRange(inv.created_at, createdRange);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setCreatedRange(EMPTY_DATE_RANGE);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#f4f6fa]">
        <Sidebar />
        <main className="flex-1 lg:ml-65">
          <div className="flex flex-col items-center justify-center h-screen gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
            <div className="text-sm font-medium text-[#64748b]">
              Loading billing statements & invoices...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] font-sans antialiased text-[#17243b]">
      <Sidebar />
      <main className="flex-1 lg:ml-65 min-w-0">
        <DashboardHeader
          title="Billing & Invoices"
          subtitle="View client billing statements, tax invoices, GST breakdowns, and download PDF statements"
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalOpen(true)}
                className="text-xs font-semibold border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a] flex items-center gap-1.5"
              >
                <Receipt className="h-4 w-4 text-[#2457e6]" /> Payment History
              </Button>
              {isAdmin && <GenerateInvoiceDialog onAddInvoice={handleAddInvoice} />}
            </div>
          }
        />

        <div className="p-6 lg:p-8 space-y-6">
          <InvoiceStats invoices={invoices} />

          <InvoiceFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            createdRange={createdRange}
            onCreatedRangeChange={setCreatedRange}
            onReset={handleResetFilters}
          />

          <InvoiceTable
            invoices={filteredInvoices}
            onSelectInvoice={handleOpenDetail}
            onDownloadPdf={handleDownloadPdf}
            onStatusChange={handleStatusChange}
            onPayInvoice={handlePayInvoice}
          />
        </div>
      </main>

      <InvoiceDetailDialog
        invoice={activeInvoice}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onDownloadPdf={handleDownloadPdf}
        onStatusChange={handleStatusChange}
        onPayInvoice={handlePayInvoice}
      />

      <PayInvoiceModal
        invoice={activePayInvoice}
        open={payModalOpen}
        onOpenChange={setPayModalOpen}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <PaymentHistoryDialog
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        onRefund={() => setHistoryRefreshKey((key) => key + 1)}
      />
    </div>
  );
}
