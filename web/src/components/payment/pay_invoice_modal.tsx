import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { create_payment, confirm_payment, download_payment_receipt } from "@/lib/api/payment";
import { getApiErrorMessage } from "@/lib/api/apiClient";
import {
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  CheckCircle2,
  Download,
  Lock,
  ArrowRight,
} from "lucide-react";
import type { InvoiceDetailResponse } from "@/types/invoice";
import type { PaymentDetailResponse, PaymentMethod } from "@/types/payment";

interface PayInvoiceModalProps {
  invoice: InvoiceDetailResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: (payment: PaymentDetailResponse) => void;
}

export function PayInvoiceModal({
  invoice,
  open,
  onOpenChange,
  onPaymentSuccess,
}: PayInvoiceModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("client@upi");
  const [cardHolder, setCardHolder] = useState("Corporate Card");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8829");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const [step, setStep] = useState<"method" | "processing" | "success">("method");
  const [activePayment, setActivePayment] = useState<PaymentDetailResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invoice) return null;

  const handleInitiatePayment = async () => {
    setIsSubmitting(true);
    setStep("processing");
    try {
      // Step 1: Create payment order on backend
      const createdPayment = await create_payment({
        invoice_id: invoice.id,
        method,
      });
      setActivePayment(createdPayment);

      // Step 2: Automatically simulate Mock Razorpay signature & verification
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 12)}`;
      const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 16)}`;

      const confirmedPayment = await confirm_payment(createdPayment.id, {
        razorpay_order_id: createdPayment.razorpay_order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      setActivePayment(confirmedPayment);
      setStep("success");
      toast.success(`Payment ₹${confirmedPayment.amount.toLocaleString()} captured successfully!`);
      if (onPaymentSuccess) onPaymentSuccess(confirmedPayment);
    } catch (error) {
      console.error("Payment failure:", error);
      toast.error(getApiErrorMessage(error));
      setStep("method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!activePayment) return;
    try {
      toast.info("Downloading payment receipt...");
      await download_payment_receipt(activePayment.id, activePayment.receipt_number);
      toast.success("Receipt downloaded!");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleClose = () => {
    setStep("method");
    setActivePayment(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <DialogHeader className="pb-3 border-b border-[#e2e8f0]">
          <DialogTitle className="font-display text-[18px] font-bold text-[#0f172a] flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600" />
            Secure Payment Gateway
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[#64748b]">
            Tax Invoice #{invoice.invoice_number} · Total Due: ₹
            {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Steps */}
        {step === "method" && (
          <div className="py-3 space-y-4 text-xs">
            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Select Payment Channel</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("upi")}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    method === "upi"
                      ? "border-[#2457e6] bg-[#2457e6]/5 font-bold text-[#2457e6]"
                      : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                  }`}
                >
                  <QrCode className="h-4 w-4" /> UPI / QR Code
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    method === "card"
                      ? "border-[#2457e6] bg-[#2457e6]/5 font-bold text-[#2457e6]"
                      : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Credit / Debit Card
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("netbanking")}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    method === "netbanking"
                      ? "border-[#2457e6] bg-[#2457e6]/5 font-bold text-[#2457e6]"
                      : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                  }`}
                >
                  <Building2 className="h-4 w-4" /> Netbanking
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("wallet")}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    method === "wallet"
                      ? "border-[#2457e6] bg-[#2457e6]/5 font-bold text-[#2457e6]"
                      : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                  }`}
                >
                  <Wallet className="h-4 w-4" /> Corporate Wallet
                </button>
              </div>
            </div>

            {/* Dynamic Method Configuration */}
            {method === "upi" && (
              <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2">
                <Label htmlFor="upi-vpa" className="text-[11px] font-semibold text-[#0f172a]">
                  Virtual Payment Address (VPA) / UPI ID
                </Label>
                <Input
                  id="upi-vpa"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="text-xs bg-white"
                  placeholder="e.g. orgname@okicici"
                />
              </div>
            )}

            {method === "card" && (
              <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="card-name" className="text-[11px] font-semibold text-[#0f172a]">
                    Cardholder Name
                  </Label>
                  <Input
                    id="card-name"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="card-num" className="text-[11px] font-semibold text-[#0f172a]">
                    Card Number
                  </Label>
                  <Input
                    id="card-num"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
              </div>
            )}

            {method === "netbanking" && (
              <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] space-y-2">
                <Label htmlFor="bank-select" className="text-[11px] font-semibold text-[#0f172a]">
                  Select Corporate Bank
                </Label>
                <select
                  id="bank-select"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-xl bg-white text-[#0f172a]"
                >
                  <option value="HDFC Bank">HDFC Bank Corporate</option>
                  <option value="ICICI Bank">ICICI Bank Corporate</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="Axis Bank">Axis Bank Commercial</option>
                </select>
              </div>
            )}

            {method === "wallet" && (
              <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#64748b]">
                Pay using prepaid Kyros corporate wallet balance. Balance available: ₹50,000.00
              </div>
            )}

            {/* Total summary callout */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between font-bold text-emerald-900 text-xs">
              <span>Payable Amount:</span>
              <span className="text-sm">
                ₹{invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleInitiatePayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4"
              >
                Pay ₹{invoice.total_amount.toLocaleString()} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-emerald-600" />
            <p className="text-sm font-bold text-[#0f172a]">Verifying Razorpay Order & Signature...</p>
            <p className="text-xs text-[#64748b]">Simulating secure gateway authorization</p>
          </div>
        )}

        {step === "success" && activePayment && (
          <div className="py-6 space-y-5 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Payment Completed Successfully!</h3>
              <p className="text-xs text-[#64748b] mt-1">
                Receipt #{activePayment.receipt_number} generated for Invoice #{invoice.invoice_number}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Amount Paid:</span>
                <span className="font-bold text-[#0f172a]">₹{activePayment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Payment ID:</span>
                <span className="text-[#0f172a]">{activePayment.razorpay_payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Order ID:</span>
                <span className="text-[#0f172a]">{activePayment.razorpay_order_id}</span>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadReceipt}
                className="w-full sm:w-auto text-xs flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download Receipt PDF
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto bg-[#2457e6] hover:bg-[#1d4ed8] text-white text-xs font-semibold"
              >
                Done & Return
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
