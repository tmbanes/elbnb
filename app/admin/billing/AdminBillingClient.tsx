"use client";

import { useState } from "react";
import { BillingStatus, BillingItemType } from "@/types/billing/enums";
import { adminUpdateInvoiceAction, adminApproveReceiptAction, adminRejectReceiptAction, adminCreateBillAction } from "./actions";
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
  Trash
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const INVOICE_STATUSES: BillingStatus[] = [
  BillingStatus.PAID,
  BillingStatus.UNPAID,
  BillingStatus.OVERDUE,
  BillingStatus.PAID_LATE,
  BillingStatus.PARTIALLY_PAID,
];

export default function AdminBillingClient({ adminId, bills, summary, activeTenants }: { adminId: string, bills: any[], summary: any, activeTenants: any[] }) {
  const supabase = getSupabaseBrowserClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel('realtime_admin_billing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

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
      const response = await fetch(`/api/admin/billing/receipt-url?path=${encodeURIComponent(receiptPath)}`);
      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload.signedUrl) {
        setReceiptUrl(payload.signedUrl);
      }
    }
  };

  const handleApprove = async () => {
    if (!viewedReceipt) return;
    await adminApproveReceiptAction(viewedReceipt.billing_id, adminId);
    setViewedReceipt(null);
    window.location.reload();
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
    if (editItems.length === 0) return alert("Add at least one invoice line item.");
    if (editItems.some(item => item.amount <= 0)) return alert("All line items must have an amount greater than 0.");

    console.log('Saving invoice:', editingBill.billing_id, 'Items:', editItems, 'Amount:', editItems.reduce((s, i) => s + i.amount, 0));

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
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save invoice changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendReminders = async () => {
    if (selectedBillIds.length === 0) return alert("Select invoices first!");

    for (const id of selectedBillIds) {
      await adminUpdateInvoiceAction(id, { reminded_at: new Date().toISOString() });
    }
    alert(`Reminders registered for ${selectedBillIds.length} invoices.`);
    window.location.reload();
  };

  const exportSelected = () => {
    if (selectedBillIds.length === 0) return alert("Select invoices first!");
    window.print();
  };

  const handleCreateBill = async () => {
    if (!newBillAssignmentId) return alert("Select a tenant!");
    if (!newBillDueDate) return alert("Select a due date!");
    if (newBillItems.some(item => item.amount <= 0)) return alert("All items must have an amount greater than 0!");

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

      alert(mode === "updated" ? "Invoice updated for this assignment." : "Bill created successfully!");
      setIsCreatingBill(false);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create bill.");
    } finally {
      setIsSubmittingBill(false);
    }
  };

  return (
    <>
      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Revenue</h3>
            <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₱{summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500">Unpaid Balance</h3>
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-500" /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₱{summary.unpaidBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500">Overdue</h3>
            <div className="p-2 bg-red-50 rounded-lg"><AlertOctagon className="w-5 h-5 text-red-500" /></div>
          </div>
          <p className="text-3xl font-bold text-red-600">₱{summary.overdueBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-slate-500">Total Transactions</h3>
            <div className="p-2 bg-indigo-50 rounded-lg"><List className="w-5 h-5 text-indigo-500" /></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.transactionCount}</p>
        </div>
      </div>

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex-1 max-w-md">
          <div className="pl-3 flex items-center justify-center text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search tenant or invoice #"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="bg-transparent outline-none text-slate-700 font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {INVOICE_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <button
            onClick={sendReminders}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition"
          >
            <Send className="w-4 h-4" /> Remind
          </button>

          <button
            onClick={exportSelected}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4" /> PDF
          </button>

          <button
            onClick={() => setIsCreatingBill(true)}
            className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
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
              {filteredBills.map((bill: any) => (
                <tr key={bill.billing_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      onChange={() => toggleSelection(bill.billing_id)}
                      checked={selectedBillIds.includes(bill.billing_id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      {bill.accommodation_assignment?.users ? `${bill.accommodation_assignment.users.first_name} ${bill.accommodation_assignment.users.last_name}` : "Unknown Tenant"}
                    </p>
                    <p className="text-xs text-slate-500">Prop: {bill.accommodation_assignment?.accommodation_application?.preferred_accommodation_id || "N/A"}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {bill.billing_id.split("-")[0]}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">₱{bill.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 text-nowrap">Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}</p>
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
                        className={`p-2 rounded-lg transition ${bill.transaction_reference ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700' : 'text-slate-300 bg-slate-50 cursor-not-allowed'}`}
                      >
                        {bill.status === BillingStatus.PENDING ? <Eye className="w-4 h-4 animate-pulse" /> : <ImageIcon className="w-4 h-4" />}
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
      </div>

      {/* RECEIPT VIEWER MODAL */}
      {viewedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Receipt Viewer</h3>
                <p className="text-sm text-slate-500">Invoice #{viewedReceipt.billing_id.split("-")[0]}</p>
              </div>
              <button onClick={() => setViewedReceipt(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 bg-slate-200 overflow-y-auto flex items-center justify-center p-8">
              {receiptUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={receiptUrl} alt="Receipt" className="max-w-full rounded-lg shadow-md border border-slate-300 bg-white" />
              ) : (
                <p className="text-slate-500 font-medium tracking-wide animate-pulse">Loading receipt image...</p>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
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
          </div>
        </div>
      )}

      {/* EDITOR MODAL */}
      {editingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><FileEdit className="w-5 h-5" /> Edit Invoice</h3>
              <button onClick={() => setEditingBill(null)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Internal Notes</label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full text-sm border-slate-200 rounded-xl bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Record calls, disputes, or manual actions taken..."
                ></textarea>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-slate-700">Invoice Line Items</label>
                  <button
                    onClick={() => setEditItems([...editItems, { type: BillingItemType.OTHER, amount: 0 }])}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {editItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <select
                        className="flex-1 text-sm border-0 bg-white rounded-lg p-2 outline-none shadow-sm font-medium text-slate-700"
                        value={item.type}
                        onChange={(e) => {
                          const updated = [...editItems];
                          updated[index].type = e.target.value as BillingItemType;
                          setEditItems(updated);
                        }}
                      >
                        {Object.values(BillingItemType).map(type => (
                          <option key={type} value={type}>{type.replace(/_/g, " ").toUpperCase()}</option>
                        ))}
                      </select>

                      <div className="relative w-32">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₱</span>
                        <input
                          type="number"
                          className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-white outline-none rounded-lg shadow-sm border-0 text-slate-900"
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
                <input
                  type="date"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  className="w-full text-sm border-slate-200 rounded-xl bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Invoice Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as BillingStatus)}
                  className="w-full text-sm border-slate-200 rounded-xl bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {INVOICE_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {editingBill.reminded_at && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Last reminded on: {format(new Date(editingBill.reminded_at), 'MMM dd, yyyy HH:mm')}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEditingBill(null)} className="px-5 py-2.5 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">Cancel</button>
              <button disabled={isSaving} onClick={saveEdits} className="px-5 py-2.5 font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BILL MODAL */}
      {isCreatingBill && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5" /> Create New Tenant Invoice</h3>
              <button disabled={isSubmittingBill} onClick={() => setIsCreatingBill(false)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Target Tenant</label>
                <select
                  className="w-full text-sm border border-slate-200 rounded-xl bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={newBillAssignmentId}
                  onChange={e => setNewBillAssignmentId(e.target.value)}
                >
                  <option value="">-- Select Active Assigned Tenant --</option>
                  {(activeTenants || []).map((t: any) => (
                    <option key={t.assignment_id} value={t.assignment_id}>
                      {t.users ? `${t.users.first_name} ${t.users.last_name}` : "Unknown"}
                    </option>
                  ))}
                  <option value="48fc2483-6ebf-4d7a-ab9c-822d71504af6">TEST: Dummy Tenant (Overrides DB Empty State)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full text-sm border border-slate-200 rounded-xl bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={newBillDueDate}
                  onChange={e => setNewBillDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Internal Notes <span className="font-normal text-slate-400 text-xs ml-2">(Optional)</span></label>
                <textarea
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-xl bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                    <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <select
                        className="flex-1 text-sm border-0 bg-white rounded-lg p-2 outline-none shadow-sm font-medium text-slate-700"
                        value={item.type}
                        onChange={(e) => {
                          const updated = [...newBillItems];
                          updated[index].type = e.target.value as BillingItemType;
                          setNewBillItems(updated);
                        }}
                      >
                        {Object.values(BillingItemType).map(type => (
                          <option key={type} value={type}>{type.replace(/_/g, " ").toUpperCase()}</option>
                        ))}
                      </select>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₱</span>
                        <input
                          type="number"
                          className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-white outline-none rounded-lg shadow-sm border-0 text-slate-900"
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
                  <span className="text-xl">₱{newBillItems.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button disabled={isSubmittingBill} onClick={() => setIsCreatingBill(false)} className="px-5 py-2.5 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">Cancel</button>
              <button disabled={isSubmittingBill} onClick={handleCreateBill} className="px-6 py-2.5 font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition flex items-center gap-2">
                {isSubmittingBill ? "Sending..." : <><Send className="w-4 h-4" /> Send Invoice</>}
              </button>
            </div>
          </div>
        </div>
      )}

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

