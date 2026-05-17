"use client";

import { useMemo, useState } from "react";
import { BillingStatus, BillingItemType } from "@/types/billing/enums";
import { adminUpdateInvoiceAction, adminApproveReceiptAction, adminRejectReceiptAction, adminCreateBillAction, getReceiptSignedUrl } from "@/lib/actions/billing.actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  Search,
  Filter,
  TrendingUp,
  AlertOctagon,
  Clock,
  List,
  Eye,
  Check,
  X,
  Send,
  Download,
  FileEdit,
  Image as ImageIcon,
  Plus,
  Trash,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const INVOICE_STATUSES: BillingStatus[] = [
  BillingStatus.PAID,
  BillingStatus.UNPAID,
  BillingStatus.OVERDUE,
  BillingStatus.PAID_LATE,
  BillingStatus.PARTIALLY_PAID,
];

import { useRealtimeSync } from "@/lib/realtime-sync";

export default function AdminBillingClient({ adminId, bills, summary, activeTenants }: { adminId: string, bills: any[], summary: any, activeTenants: any[] }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  // Sync billing data in real-time
  useRealtimeSync('billing', undefined, '*');

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [invoicesPage, setInvoicesPage] = useState(1);

  // Modals state
  const [viewedReceipt, setViewedReceipt] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [editingBill, setEditingBill] = useState<any>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<{ type: BillingItemType, amount: number }[]>([
    { type: BillingItemType.ROOM_RENT, amount: 0 }
  ]);
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editStatus, setEditStatus] = useState<BillingStatus>(BillingStatus.UNPAID);
  const [isSaving, setIsSaving] = useState(false);

  // Create Bill Modal State
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [newBillAssignmentId, setNewBillAssignmentId] = useState("");
  const [newBillDueDate, setNewBillDueDate] = useState<string>("");
  const [newBillNotes, setNewBillNotes] = useState<string>("");
  const [newBillItems, setNewBillItems] = useState<{ type: BillingItemType, amount: number }[]>([
    { type: BillingItemType.ROOM_RENT, amount: 0 }
  ]);
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    variant: "success" | "warning";
    title: string;
    message: string;
    reloadOnClose: boolean;
  }>({
    open: false,
    variant: "warning",
    title: "",
    message: "",
    reloadOnClose: false,
  });

  const showFeedback = (
    variant: "success" | "warning",
    message: string,
    options?: { title?: string; reloadOnClose?: boolean }
  ) => {
    setFeedbackModal({
      open: true,
      variant,
      title: options?.title || (variant === "success" ? "Success" : "Attention"),
      message,
      reloadOnClose: Boolean(options?.reloadOnClose),
    });
  };

  const closeFeedback = () => {
    const shouldReload = feedbackModal.reloadOnClose;
    setFeedbackModal((prev) => ({ ...prev, open: false, reloadOnClose: false }));
    if (shouldReload) {
      window.location.reload();
    }
  };

  const looksLikeJson = (value?: string | null) => {
    const trimmed = String(value || "").trim();
    return trimmed.startsWith("{") || trimmed.startsWith("[");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case BillingStatus.PAID: return "bg-green-100 text-green-700 border-green-200";
      case BillingStatus.UNPAID: return "bg-slate-100 text-slate-700 border-slate-200";
      case BillingStatus.PENDING: return "bg-amber-100 text-amber-700 border-amber-200 animate-pulse";
      case BillingStatus.OVERDUE: return "bg-red-100 text-red-700 border-red-200";
      case BillingStatus.FAILED: return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch =
      bill.billing_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.accommodation_assignment?.users ? `${bill.accommodation_assignment.users.first_name} ${bill.accommodation_assignment.users.last_name}` : "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || bill.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const invoicesPerPage = 5;
  const totalInvoicesPages = Math.max(1, Math.ceil(filteredBills.length / invoicesPerPage));
  const safeInvoicesPage = Math.max(1, Math.min(invoicesPage, totalInvoicesPages));
  const startInvoiceIndex = (safeInvoicesPage - 1) * invoicesPerPage;
  const paginatedBills = useMemo(
    () => filteredBills.slice(startInvoiceIndex, startInvoiceIndex + invoicesPerPage),
    [filteredBills, startInvoiceIndex]
  );

  const getVisibleInvoicePages = () => {
    const pages: number[] = [];
    let start = Math.max(1, safeInvoicesPage - 1);
    let end = Math.min(totalInvoicesPages, start + 2);
    start = Math.max(1, end - 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const toggleSelection = (id: string) => {
    setSelectedBillIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedBillIds.length === filteredBills.length) {
      setSelectedBillIds([]);
    } else {
      setSelectedBillIds(filteredBills.map(b => b.billing_id));
    }
  };

  const openReceiptViewer = async (bill: any) => {
    setViewedReceipt(bill);
    setReceiptUrl(null);
    const receiptPath = bill.transaction_reference || bill.receipt_files?.[bill.receipt_files.length - 1];

    if (receiptPath) {
      try {
        const signedUrl = await getReceiptSignedUrl(receiptPath);
        if (signedUrl) setReceiptUrl(signedUrl);
      } catch (e) {
        console.error("Failed to fetch receipt url:", e);
      }
    }
  };

  const handleApprove = async () => {
    if (!viewedReceipt) return;
    await adminApproveReceiptAction(viewedReceipt.billing_id, adminId);
    setViewedReceipt(null);
    router.refresh(); //[CHANGES] window.location.reload() to router.refresh() for faster loading
  };

  const markAsPaid = async (billingId: string) => {
    await adminApproveReceiptAction(billingId, adminId);
    window.location.reload();
  };

  const handleReject = async () => {
    if (!viewedReceipt) return;
    await adminRejectReceiptAction(viewedReceipt.billing_id, adminId);
    setViewedReceipt(null);
    window.location.reload();
  };

  const openEditor = (bill: any) => {
    setEditingBill(bill);
    setEditNotes(looksLikeJson(bill.internal_notes) ? "" : (bill.internal_notes || ""));
    const existingItems = Array.isArray(bill.billing_item) && bill.billing_item.length > 0
      ? bill.billing_item
        .map((item: any) => ({
          type: item.type as BillingItemType,
          amount: Number(item.amount || 0),
        }))
        .filter((item: any) => Number.isFinite(item.amount))
      : [{ type: BillingItemType.ROOM_RENT, amount: Number(bill.amount || 0) }];

    setEditItems(existingItems.length ? existingItems : [{ type: BillingItemType.ROOM_RENT, amount: 0 }]);
    setEditDueDate(bill.due_date ? format(new Date(bill.due_date), "yyyy-MM-dd") : "");
    const currentStatus = bill.status as BillingStatus;
    setEditStatus(INVOICE_STATUSES.includes(currentStatus) ? currentStatus : BillingStatus.UNPAID);
  };

  const saveEdits = async () => {
    if (!editingBill) return;
    if (editItems.length === 0) return showFeedback("warning", "Add at least one invoice line item.");
    if (editItems.some(item => item.amount <= 0)) return showFeedback("warning", "All line items must have an amount greater than 0.");

    // console.log('Saving invoice:', editingBill.billing_id, 'Items:', editItems, 'Amount:', editItems.reduce((s, i) => s + i.amount, 0));

    setIsSaving(true);
    try {
      await adminUpdateInvoiceAction(
        editingBill.billing_id,
        {
          internal_notes: editNotes,
          due_date: editDueDate ? new Date(`${editDueDate}T00:00:00`).toISOString() : undefined,
          status: editStatus,
        },
        editItems,
        adminId,
      );
      setEditingBill(null);
      showFeedback("success", "Invoice updated successfully.", { reloadOnClose: true });
    } catch (error) {
      showFeedback("warning", error instanceof Error ? error.message : "Failed to save invoice changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendReminders = async () => {
    if (selectedBillIds.length === 0) return showFeedback("warning", "Select invoices first!");

    for (const id of selectedBillIds) {
      await adminUpdateInvoiceAction(id, { reminded_at: new Date().toISOString() });
    }
    showFeedback("success", `Reminders registered for ${selectedBillIds.length} invoices.`, { reloadOnClose: true });
  };

  const exportSelected = () => {
    if (selectedBillIds.length === 0) return showFeedback("warning", "Select invoices first!");
    window.print();
  };

  const handleCreateBill = async () => {
    if (!newBillAssignmentId) return showFeedback("warning", "Select a tenant!");
    if (!newBillDueDate) return showFeedback("warning", "Select a due date!");
    if (newBillItems.some(item => item.amount <= 0)) return showFeedback("warning", "All items must have an amount greater than 0!");

    setIsSubmittingBill(true);
    try {
      const dueDate = new Date(newBillDueDate);
      const billingPeriodDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

      // Automatically sum amount for the parent status based on the items attached.
      const totalAmount = newBillItems.reduce((acc, curr) => acc + curr.amount, 0);

      const payload = {
        assignment_id: newBillAssignmentId,
        amount: totalAmount,
        billing_period_date: billingPeriodDate,
        due_date: dueDate,
        status: BillingStatus.UNPAID,
        payment_method: "cash",
        internal_notes: newBillNotes
      };

      const result = await adminCreateBillAction(payload, newBillItems);
      const billingId = (result as any)?.data?.billing_id as string | undefined;
      const mode = (result as any)?.mode as string | undefined;

      if (billingId) {
        setSearchQuery(billingId);
      }

      showFeedback("success", mode === "updated" ? "Invoice updated for this assignment." : "Bill created successfully!", { reloadOnClose: true });
      setIsCreatingBill(false);
    } catch (error) {
      showFeedback("warning", error instanceof Error ? error.message : "Failed to create bill.");
    } finally {
      setIsSubmittingBill(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/dashboard")}
        className="flex items-center gap-2 text-[#44291B]/60 hover:text-[#44291B] hover:bg-[#F6F8D5] -ml-2 mb-2 transition-all group w-fit"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
      </Button>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-[#44291B] tracking-tight">Billing Management</h1>
        <p className="mt-1 mb-4 text-sm text-[#44291B] font-medium">Overview of all tenant invoices, payments, and revenue.</p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-[#5591AB] text-white p-6 rounded-2xl border border-[#4b839b] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold tracking-wide uppercase text-white/90">Total Revenue</h3>
            <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-4xl font-extrabold text-white">₱{summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-[#F59E0B] text-white p-6 rounded-2xl border border-[#d98a0a] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold tracking-wide uppercase text-white/90">Unpaid Balance</h3>
            <div className="p-2 bg-white/20 rounded-lg"><Clock className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-4xl font-extrabold text-white">₱{summary.unpaidBalance.toLocaleString()}</p>
        </div>
        <div className="bg-[#EF4444] text-white p-6 rounded-2xl border border-[#d63d3d] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold tracking-wide uppercase text-white/90">Overdue</h3>
            <div className="p-2 bg-white/20 rounded-lg"><AlertOctagon className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-4xl font-extrabold text-white">₱{summary.overdueBalance.toLocaleString()}</p>
        </div>
        <div className="bg-[#0D2A6B] text-white p-6 rounded-2xl border border-[#0a245c] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold tracking-wide uppercase text-white/90">Total Transactions</h3>
            <div className="p-2 bg-white/20 rounded-lg"><List className="w-5 h-5 text-white" /></div>
          </div>
          <p className="text-4xl font-extrabold text-white">{summary.transactionCount}</p>
        </div>
      </div>

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4  bg-[#FDFFF4] p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex  bg-[#FDFFF4] border border-slate-200 rounded-xl overflow-hidden flex-1 max-w-md">
          <div className="pl-3 flex items-center justify-center text-slate-400">
            <Search className="w-4 h-4  bg-[#FDFFF4]" />
          </div>
          <input
            type="text"
            placeholder="Search tenant or invoice #"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setInvoicesPage(1);
            }}
            className="w-full px-3 py-2  bg-[#FDFFF4] text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setInvoicesPage(1);
            }}
          >
            <SelectTrigger className="h-10 min-w-[180px] rounded-xl border border-[#cfd6e4] bg-[#FDFFF4] px-3 text-sm font-medium text-[#30435f] flex items-center gap-2 hover:bg-[#F6F8D5] transition-colors">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder="All Statuses" />
              </div>
            </SelectTrigger>
            <SelectContent className="z-[70] rounded-xl border border-[#cfd6e4] bg-[#FDFFF4] text-[#44291B]">
              <SelectItem value="ALL" className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">All Statuses</SelectItem>
              {INVOICE_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-sm font-medium focus:bg-[#F6F8D5] focus:text-[#44291B] cursor-pointer">
                  {s.replace(/_/g, " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <button
            onClick={sendReminders}
            className="flex items-center gap-2 text-sm font-medium text-[#44291B]  bg-[#FDFFF4] border border-slate-200 px-4 py-2 rounded-xl hover:bg-[#F6F8D5] transition"
          >
            <Send className="w-4 h-4" /> Remind
          </button>

          <button
            onClick={exportSelected}
            className="flex items-center gap-2 text-sm font-medium text-[#44291B]  bg-[#FDFFF4] border border-slate-200 px-4 py-2 rounded-xl hover:bg-[#F6F8D5] transition"
          >
            <Download className="w-4 h-4" /> PDF
          </button>

          <button
            onClick={() => setIsCreatingBill(true)}
            className="flex items-center gap-2 text-sm font-medium text-sm font-medium text-white bg-[#264384] hover:opacity-90 px-4 py-2 rounded-xl transition h-auto w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#FDFFF4] border text-sm  border-[#cfd6e4] rounded-2xl shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto text-[#44291B]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FDFFF4] border-b border-[#cfd6e4]">
                <th className="px-6 py-4 font-semibold w-12 pt-[18px]">
                  <input type="checkbox" checked={selectedBillIds.length === filteredBills.length && filteredBills.length > 0} onChange={handleSelectAll} className="rounded border-slate-300" />
                </th>
                <th className="px-6 py-4 font-semibold">Tenant / Property</th>
                <th className="px-6 py-4 font-semibold">Invoice #</th>
                <th className="px-6 py-4 font-semibold">Amount / Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBills.map((bill: any) => (
                <tr key={bill.billing_id} className="border-b border-[#e2e4c0] last:border-0 hover:bg-[#F6F8D5] transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      onChange={() => toggleSelection(bill.billing_id)}
                      checked={selectedBillIds.includes(bill.billing_id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#44291B] flex items-center gap-2">
                      {bill.accommodation_assignment?.users ? `${bill.accommodation_assignment.users.first_name} ${bill.accommodation_assignment.users.last_name}` : "Unknown Tenant"}
                    </p>
                    <p className="text-xs text-[#44291B]/70">Prop: {bill.accommodation_assignment?.accommodation_application?.preferred_accommodation_id || "N/A"}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {bill.billing_id.split("-")[0]}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#44291B]">₱{bill.amount.toLocaleString()}</p>
                    <p className="text-xs text-[#44291B]/70 text-nowrap">Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusColor(bill.status)}`}>
                      {bill.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                    {bill.method && <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{bill.method}</p>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditor(bill)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition tooltip-trigger"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>

                      <button
                        disabled={!bill.transaction_reference}
                        onClick={() => openReceiptViewer(bill)}
                        className={`p-2 rounded-lg transition ${bill.transaction_reference ? 'text-[#264384] bg-[#AFBFE1] hover:bg-[#5273BC] hover:text-white' : 'text-slate-300 bg-slate-50 cursor-not-allowed'}`}
                      >
                        {bill.status === BillingStatus.PENDING ? <Eye className="w-4 h-4 animate-pulse" /> : <Receipt className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No billing records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredBills.length > 0 && (
          <div className="px-6 py-4 bg-[#FDFFF4] border-t border-[#cfd6e4] flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing {paginatedBills.length} of {filteredBills.length} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setInvoicesPage(p => Math.max(1, p - 1))}
                disabled={safeInvoicesPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-50 hover:bg-[#E3E3E3] transition-colors h-8"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </button>
              <div className="flex items-center px-3 text-xs font-bold text-slate-700">
                {safeInvoicesPage} / {totalInvoicesPages || 1}
              </div>
              <button
                onClick={() => setInvoicesPage(p => Math.min(totalInvoicesPages, p + 1))}
                disabled={safeInvoicesPage === totalInvoicesPages || totalInvoicesPages === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-transparent rounded-lg disabled:opacity-50 hover:bg-[#E3E3E3] transition-colors h-8"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECEIPT VIEWER MODAL */}
      <Dialog open={Boolean(viewedReceipt)} onOpenChange={(open) => { if (!open) setViewedReceipt(null); }}>
        <DialogPortal>
          <DialogOverlay className="bg-slate-900/40 backdrop-blur-[8px] print:hidden" />
          {viewedReceipt && (
            <DialogContent
              showCloseButton={false}
              className="z-[60] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-[#FDFFF4] shadow-[0_20px_60px_rgba(15,23,42,0.25)] flex flex-col max-h-[90vh] p-0 gap-0 text-sm"
            >
              <DialogTitle className="sr-only">Receipt Viewer</DialogTitle>
              <DialogDescription className="sr-only">
                Preview uploaded receipt for invoice verification and perform approval actions.
              </DialogDescription>
              <div className="p-6 border-b border-slate-200/80 flex justify-between items-center bg-[#FDFFF4]">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Receipt Viewer</h3>
                  <p className="text-sm text-slate-500">Invoice #{viewedReceipt.billing_id.split("-")[0]}</p>
                </div>
                <button onClick={() => setViewedReceipt(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 bg-[#E7ECF3] overflow-y-auto flex items-center justify-center p-8">
                {receiptUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={receiptUrl} alt="Receipt" className="max-w-full rounded-lg shadow-md border border-slate-300 bg-white" />
                ) : (
                  <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading receipt image...</p>
                )}
              </div>

              <div className="p-6 border-t border-slate-200/80 bg-[#F7F8E8] flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-500">Target Amount: <span className="font-bold text-slate-900 text-lg">₱{viewedReceipt.amount.toLocaleString()}</span></p>
                  <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(viewedReceipt.status)}`}>
                    {viewedReceipt.status}
                  </span>
                </div>
                {viewedReceipt.status === BillingStatus.PENDING && (
                  <div className="flex gap-3">
                    <button onClick={handleReject} className="px-6 py-3 font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-2">
                      <X className="w-5 h-5" /> Reject
                    </button>
                    <button onClick={handleApprove} className="px-6 py-3 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-400 hover:text-white border border-emerald-200 hover:border-emerald-500 rounded-xl transition flex items-center gap-2">
                      <Check className="w-5 h-5" /> Paid
                    </button>
                  </div>
                )}
              </div>
            </DialogContent>
          )}
        </DialogPortal>
      </Dialog>

      {/* EDITOR MODAL */}
      <Dialog open={Boolean(editingBill)} onOpenChange={(open) => { if (!open) setEditingBill(null); }}>
        <DialogPortal>
          <DialogOverlay className="bg-slate-900/40 backdrop-blur-[8px] print:hidden" />
          {editingBill && (
            <DialogContent
              showCloseButton={false}
              className="z-[60] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-slate-200 bg-[#FDFFF4] shadow-[0_20px_60px_rgba(15,23,42,0.25)] p-0 gap-0 text-sm"
            >
              <DialogTitle className="sr-only">Edit Invoice</DialogTitle>
              <DialogDescription className="sr-only">
                Update invoice notes, line items, due date, and status.
              </DialogDescription>
              <div className="p-6 border-b border-slate-200/80 flex justify-between items-center bg-[#FDFFF4]">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><FileEdit className="w-5 h-5" /> Edit Invoice</h3>
                <button onClick={() => setEditingBill(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Internal Notes</label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl bg-white p-3 outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="Record calls, disputes, or manual actions taken..."
                  ></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-slate-700">Invoice Line Items</label>
                    <Button
                      onClick={() => setEditItems([...editItems, { type: BillingItemType.OTHER, amount: 0 }])}
                      className="text-xs font-bold text-[#264384] hover:bg-[#5273BC] bg-[#AFBFE1] hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {editItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <Select
                          value={item.type}
                          onValueChange={(value) => {
                            const updated = [...editItems];
                            updated[index].type = value as BillingItemType;
                            setEditItems(updated);
                          }}
                        >
                          <SelectTrigger className="h-10 flex-1 rounded-xl border border-[#cfd6e4] bg-white px-3 text-sm font-medium text-[#30435f] shadow-sm focus:ring-2 focus:ring-indigo-400/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[70] rounded-xl border border-[#cfd6e4] bg-white text-[#30435f]">
                            {Object.values(BillingItemType).map((type) => (
                              <SelectItem key={type} value={type} className="text-sm font-medium">
                                {type.replace(/_/g, " ").toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="relative w-32">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₱</span>
                          <input
                            type="number"
                            className="h-10 w-full rounded-xl border border-[#cfd6e4] bg-white pl-7 pr-3 text-sm font-semibold text-[#30435f] outline-none shadow-sm focus:ring-2 focus:ring-indigo-400/30"
                            value={item.amount || ''}
                            onChange={(e) => {
                              const updated = [...editItems];
                              updated[index].amount = Number(e.target.value);
                              setEditItems(updated);
                            }}
                            placeholder="0"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (editItems.length === 1) return;
                            const updated = [...editItems];
                            updated.splice(index, 1);
                            setEditItems(updated);
                          }}
                          className={`p-2 rounded-lg transition ${editItems.length > 1 ? 'text-red-500 hover:bg-red-50' : 'text-slate-300'}`}
                          disabled={editItems.length <= 1}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-800">
                    <span>Total:</span>
                    <span className="text-xl">₱{editItems.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-11 w-full justify-start text-left font-medium rounded-xl border-[#cfd6e4]",
                          !editDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDueDate ? format(new Date(editDueDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[80]" align="start">
                      <Calendar
                        mode="single"
                        selected={editDueDate ? new Date(editDueDate) : undefined}
                        onSelect={(date) => setEditDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                        initialFocus
                        className="bg-white rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Invoice Status</label>
                  <Select value={editStatus} onValueChange={(value) => setEditStatus(value as BillingStatus)}>
                    <SelectTrigger className="h-11 w-full rounded-xl border border-[#cfd6e4] bg-white px-3 text-sm font-medium text-[#30435f] focus:ring-2 focus:ring-indigo-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[70] rounded-xl border border-[#cfd6e4] bg-white text-[#30435f]">
                      {INVOICE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="text-sm font-medium">
                          {status.replace(/_/g, " ").toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editingBill.reminded_at && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Last reminded on: {format(new Date(editingBill.reminded_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-200/80 bg-[#F7F8E8] flex justify-end gap-3">
                <button onClick={() => setEditingBill(null)} className="px-5 py-2.5 font-semibold text-slate-600 bg-transparent rounded-xl hover:bg-white/70 transition">Cancel</button>
                <button disabled={isSaving} onClick={saveEdits} className="px-5 py-2.5 font-semibold text-white bg-[#78A24C] rounded-xl hover:bg-[#AED39E] shadow-sm transition">
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </DialogContent>
          )}
        </DialogPortal>
      </Dialog>

      {/* CREATE BILL MODAL */}
      <Dialog open={isCreatingBill} onOpenChange={(open) => { if (!isSubmittingBill) setIsCreatingBill(open); }}>
        <DialogPortal>
          <DialogOverlay className="bg-slate-900/40 backdrop-blur-[8px] print:hidden" />
          <DialogContent
            showCloseButton={false}
            className="z-[60] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border border-slate-200 bg-[#FDFFF4] shadow-[0_20px_60px_rgba(15,23,42,0.25)] p-0 gap-0 text-sm"
          >
            <DialogTitle className="sr-only">Create New Tenant Invoice</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new invoice for an active tenant assignment by setting due date and line items.
            </DialogDescription>
            <div className="p-6 border-b border-slate-200/80 flex justify-between items-center bg-[#FDFFF4]">
              <h3 className="font-bold text-[28px] text-slate-900">Create New Tenant Invoice</h3>
              <button disabled={isSubmittingBill} onClick={() => setIsCreatingBill(false)} className="p-2 hover:bg-slate-200/70 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Target Tenant</label>
                <Select value={newBillAssignmentId || undefined} onValueChange={setNewBillAssignmentId}>
                  <SelectTrigger className="h-11 w-full rounded-xl border border-[#cfd6e4] bg-white px-3 text-sm font-medium text-[#30435f] focus:ring-2 focus:ring-indigo-400/30">
                    <SelectValue placeholder="-- Select Active Assigned Tenant --" />
                  </SelectTrigger>
                  <SelectContent className="z-[70] rounded-xl border border-[#cfd6e4] bg-white text-[#30435f]">
                    {(activeTenants || []).map((t: any) => (
                      <SelectItem key={t.assignment_id} value={t.assignment_id} className="text-sm font-medium">
                        {t.users ? `${t.users.first_name} ${t.users.last_name}` : "Unknown"}
                      </SelectItem>
                    ))}
                    <SelectItem value="48fc2483-6ebf-4d7a-ab9c-822d71504af6" className="text-sm font-medium">
                      TEST: Dummy Tenant (Overrides DB Empty State)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "h-11 w-full justify-start text-left font-medium rounded-xl border-[#cfd6e4]",
                        !newBillDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newBillDueDate ? format(new Date(newBillDueDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[80]" align="start">
                    <Calendar
                      mode="single"
                      selected={newBillDueDate ? new Date(newBillDueDate) : undefined}
                      onSelect={(date) => setNewBillDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                      className="bg-white rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Internal Notes <span className="font-normal text-slate-400 text-xs ml-2">(Optional)</span></label>
                <textarea
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-xl bg-white p-3 outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={newBillNotes}
                  onChange={e => setNewBillNotes(e.target.value)}
                  placeholder="Record reasons for specific charges or adjustments..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-slate-700">Line Items</label>
                  <button
                    onClick={() => setNewBillItems([...newBillItems, { type: BillingItemType.OTHER, amount: 0 }])}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {newBillItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                      <Select
                        value={item.type}
                        onValueChange={(value) => {
                          const updated = [...newBillItems];
                          updated[index].type = value as BillingItemType;
                          setNewBillItems(updated);
                        }}
                      >
                        <SelectTrigger className="h-10 flex-1 rounded-xl border border-[#cfd6e4] bg-white px-3 text-sm font-medium text-[#30435f] shadow-sm focus:ring-2 focus:ring-indigo-400/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[70] rounded-xl border border-[#cfd6e4] bg-white text-[#30435f]">
                          {Object.values(BillingItemType).map((type) => (
                            <SelectItem key={type} value={type} className="text-sm font-medium">
                              {type.replace(/_/g, " ").toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₱</span>
                        <input
                          type="number"
                          className="h-10 w-full rounded-xl border border-[#cfd6e4] bg-white pl-7 pr-3 text-sm font-semibold text-[#30435f] outline-none shadow-sm focus:ring-2 focus:ring-indigo-400/30"
                          value={item.amount || ''}
                          onChange={(e) => {
                            const updated = [...newBillItems];
                            updated[index].amount = Number(e.target.value);
                            setNewBillItems(updated);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (newBillItems.length === 1) return;
                          const updated = [...newBillItems];
                          updated.splice(index, 1);
                          setNewBillItems(updated);
                        }}
                        className={`p-2 rounded-lg transition ${newBillItems.length > 1 ? 'text-red-500 hover:bg-red-50' : 'text-slate-300'}`}
                        disabled={newBillItems.length <= 1}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-800">
                  <span>Calculated Total:</span>
                  <span className="text-3xl text-slate-900">₱{newBillItems.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200/80 bg-[#F7F8E8] flex justify-end gap-3">
              <button disabled={isSubmittingBill} onClick={() => setIsCreatingBill(false)} className="px-5 py-2.5 font-semibold text-slate-600 bg-transparent rounded-xl hover:bg-white/70 transition">Cancel</button>
              <button disabled={isSubmittingBill} onClick={handleCreateBill} className="px-6 py-2.5 font-semibold text-white bg-[#1BAA77] rounded-xl hover:bg-[#149565] shadow-sm transition flex items-center gap-2">
                {isSubmittingBill ? "Sending..." : <><Send className="w-4 h-4" /> Send Invoice</>}
              </button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* FEEDBACK MODAL */}
      <Dialog open={feedbackModal.open} onOpenChange={(open) => { if (!open) closeFeedback(); }}>
        <DialogPortal>
          <DialogOverlay className="bg-slate-900/35 backdrop-blur-[6px] print:hidden" />
          <DialogContent
            showCloseButton={false}
            className="z-[80] w-full max-w-md rounded-2xl border border-slate-200 bg-[#FDFFF4] p-0 gap-0 overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
          >
            <DialogTitle className="sr-only">{feedbackModal.title}</DialogTitle>
            <DialogDescription className="sr-only">{feedbackModal.message}</DialogDescription>

            <div className="p-6 border-b border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${feedbackModal.variant === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {feedbackModal.variant === "success" ? <Check className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{feedbackModal.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{feedbackModal.message}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F7F8E8] flex justify-end">
              <button
                onClick={closeFeedback}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition ${feedbackModal.variant === "success"
                  ? "bg-[#1BAA77] text-white hover:bg-[#149565]"
                  : "bg-[#0D2A6B] text-white hover:bg-[#0b2358]"
                  }`}
              >
                OK
              </button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* PRINT OUT (PDF) EXPORT SECTION */}
      <div className="hidden print:block absolute inset-0 bg-white p-8 font-sans">
        <div className="border-b-2 border-slate-900 pb-4 mb-8">
          <h1 className="text-3xl font-extrabold uppercase mb-2">Billing Accounts Export</h1>
          <p className="text-sm font-medium text-slate-500">Date Exported: {format(new Date(), "MM/dd/yyyy HH:mm")}</p>
        </div>

        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-2 text-slate-600 uppercase text-xs">Tenant / Reference</th>
              <th className="py-2 text-slate-600 uppercase text-xs">Invoice #</th>
              <th className="py-2 text-slate-600 uppercase text-xs text-right">Amount</th>
              <th className="py-2 text-slate-600 uppercase text-xs text-right">Due Date</th>
              <th className="py-2 text-slate-600 uppercase text-xs text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {selectedBillIds.map(id => {
              const b = bills.find(x => x.billing_id === id);
              if (!b) return null;
              return (
                <tr key={id} className="border-b border-slate-100">
                  <td className="py-3 font-semibold text-slate-800">{b.accommodation_assignment?.users ? `${b.accommodation_assignment.users.first_name} ${b.accommodation_assignment.users.last_name}` : "Unknown Tenant"}</td>
                  <td className="py-3 font-mono text-slate-500 text-xs">{id.split("-")[0]}</td>
                  <td className="py-3 font-bold text-right">₱{b.amount.toLocaleString()}</td>
                  <td className="py-3 text-right">{format(new Date(b.due_date), 'MM/dd/yyyy')}</td>
                  <td className="py-3 text-right text-xs font-bold uppercase">{b.status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {selectedBillIds.length === 0 && (
          <p className="mt-8 text-center text-slate-500">No invoices selected for export.</p>
        )}
      </div>
    </>
  );
}

