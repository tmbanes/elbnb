"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { BillingStatus } from "@/types/billing/enums";
import {
  CreditCard,
  FileText,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Download as DownloadIcon,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BillingClient({
  userId,
  summary,
  bills,
  paymentHistory,
  uploadEndpoint = "/api/student/billing/upload-receipt",
  cancelEndpoint = "/api/student/billing/cancel-receipt",
}: any) {
  const supabase = getSupabaseBrowserClient();

  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [printMode, setPrintMode] = useState<"bill" | "statement" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCancellingReceipt, setIsCancellingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isLoadingReceiptPreview, setIsLoadingReceiptPreview] = useState(false);
  const router = useRouter();

  const USE_DUMMY_BILLING_DATA = false;

  useEffect(() => {
    const channel = supabase
      .channel('realtime_student_billing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const dummyBills = useMemo(
    () => [
      {
        billing_id: "INV-2023-010",
        billing_period_date: "2023-10-01T00:00:00.000Z",
        amount: 1100,
        due_date: "2023-10-01T00:00:00.000Z",
        status: BillingStatus.UNPAID,
        created_at: "2023-09-25T00:00:00.000Z",
        summary: { total: 1100 },
        breakdown: [
          { label: "monthly_accommodation_rent", amount: 1000 },
          { label: "internet_maintenance", amount: 100 },
        ],
        accommodation_assignment: { users: { full_name: "Demo Student" } },
      },
      {
        billing_id: "INV-2023-009",
        billing_period_date: "2023-09-01T00:00:00.000Z",
        amount: 150,
        due_date: "2023-09-09T00:00:00.000Z",
        status: BillingStatus.OVERDUE,
        created_at: "2023-08-28T00:00:00.000Z",
        summary: { total: 150 },
        breakdown: [{ label: "late_fee", amount: 150 }],
        accommodation_assignment: { users: { full_name: "Demo Student" } },
      },
      {
        billing_id: "INV-2023-008",
        billing_period_date: "2023-08-01T00:00:00.000Z",
        amount: 1100,
        due_date: "2023-08-01T00:00:00.000Z",
        status: BillingStatus.PAID,
        created_at: "2023-07-25T00:00:00.000Z",
        summary: { total: 1100 },
        breakdown: [
          { label: "monthly_accommodation_rent", amount: 1000 },
          { label: "utilities", amount: 100 },
        ],
        accommodation_assignment: { users: { full_name: "Demo Student" } },
      },
    ],
    []
  );

  const normalizedBills = useMemo(
    () => (USE_DUMMY_BILLING_DATA ? dummyBills : Array.isArray(bills) ? bills : []),
    [USE_DUMMY_BILLING_DATA, dummyBills, bills]
  );

  const normalizedPaymentHistory = useMemo(
    () => (Array.isArray(paymentHistory) ? paymentHistory : []),
    [paymentHistory]
  );

  const [invoicesSearchQuery, setInvoicesSearchQuery] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  const searchedBills = useMemo(() => {
    if (!invoicesSearchQuery) return normalizedBills;
    const lowerQuery = invoicesSearchQuery.toLowerCase();
    return normalizedBills.filter((bill: any) =>
      String(bill?.billing_id || "").toLowerCase().includes(lowerQuery) ||
      (bill?.status || "").replace(/_/g, ' ').toLowerCase().includes(lowerQuery)
    );
  }, [normalizedBills, invoicesSearchQuery]);

  const searchedHistory = useMemo(() => {
    if (!historySearchQuery) return normalizedPaymentHistory;
    const lowerQuery = historySearchQuery.toLowerCase();
    return normalizedPaymentHistory.filter((entry: any) =>
      String(entry?.billing_id || "").toLowerCase().includes(lowerQuery) ||
      (entry?.status || "").replace(/_/g, ' ').toLowerCase().includes(lowerQuery)
    );
  }, [normalizedPaymentHistory, historySearchQuery]);

  const [invoicesPage, setInvoicesPage] = useState(1);
  const invoicesPerPage = 5;

  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  const totalInvoicesPages = Math.max(1, Math.ceil(searchedBills.length / invoicesPerPage));
  const safeInvoicesPage = Math.max(1, Math.min(invoicesPage, totalInvoicesPages));
  const startInvoiceIndex = (safeInvoicesPage - 1) * invoicesPerPage;
  const paginatedInvoices = searchedBills.slice(startInvoiceIndex, startInvoiceIndex + invoicesPerPage);

  const getVisibleInvoicePages = () => {
    const pages: number[] = [];
    let start = Math.max(1, safeInvoicesPage - 1);
    let end = Math.min(totalInvoicesPages, start + 2);
    start = Math.max(1, end - 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const totalHistoryPages = Math.max(1, Math.ceil(searchedHistory.length / historyPerPage));
  const safeHistoryPage = Math.max(1, Math.min(historyPage, totalHistoryPages));
  const startHistoryIndex = (safeHistoryPage - 1) * historyPerPage;
  const paginatedHistory = searchedHistory.slice(startHistoryIndex, startHistoryIndex + historyPerPage);

  const getVisibleHistoryPages = () => {
    const pages: number[] = [];
    let start = Math.max(1, safeHistoryPage - 1);
    let end = Math.min(totalHistoryPages, start + 2);
    start = Math.max(1, end - 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const focusedBill = selectedBill;

  const getInvoiceLineItems = (bill: any) => {
    const rawItems = bill?.breakdown ?? bill?.billing_item ?? bill?.billing_items ?? bill?.items ?? [];
    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems].filter(Boolean);

    return itemsArray.map((item: any) => ({
      label: String(item?.label ?? item?.type ?? item?.name ?? "Line Item"),
      amount: Number(item?.amount ?? 0),
    }));
  };

  const toCurrencyNumber = (value: unknown) => {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const formatPeso = (value: unknown) => {
    return toCurrencyNumber(value).toLocaleString();
  };

  const safeDateLabel = (value: unknown, formatStr: string, fallback = "N/A") => {
    if (!value) return fallback;
    const dateValue = new Date(value as string);
    return Number.isNaN(dateValue.getTime()) ? fallback : format(dateValue, formatStr);
  };

  const overdueAmount = normalizedBills
    .filter((b: any) => b?.status === BillingStatus.OVERDUE)
    .reduce((sum: number, b: any) => sum + toCurrencyNumber(b?.amount), 0);

  const nextUnpaidBill = normalizedBills.find((b: any) => b?.status === BillingStatus.UNPAID);

  const displaySummary = useMemo(() => {
    if (!USE_DUMMY_BILLING_DATA) return summary || { balance: 0, paid: 0 };
    const paid = normalizedBills
      .filter((b: any) => b?.status === BillingStatus.PAID)
      .reduce((sum: number, b: any) => sum + toCurrencyNumber(b?.amount), 0);
    const balance = normalizedBills
      .filter((b: any) => b?.status !== BillingStatus.PAID)
      .reduce((sum: number, b: any) => sum + toCurrencyNumber(b?.amount), 0);
    return { balance, paid };
  }, [USE_DUMMY_BILLING_DATA, summary, normalizedBills]);

  // Clear selected bill if backend data refresh removes it.
  useEffect(() => {
    if (!selectedBill) return;
    const stillExists = normalizedBills.some((bill: any) => bill?.billing_id === selectedBill?.billing_id);
    if (!stillExists) {
      setSelectedBill(null);
    }
  }, [normalizedBills, selectedBill]);

  useEffect(() => {
    const receiptPath = selectedBill?.transaction_reference || selectedBill?.receipt_files?.[selectedBill?.receipt_files?.length - 1];

    if (!receiptPath) {
      setReceiptPreviewUrl(null);
      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      setIsLoadingReceiptPreview(true);
      try {
        const response = await fetch(`/api/admin/billing/receipt-url?path=${encodeURIComponent(receiptPath)}`);
        const payload = await response.json().catch(() => ({}));

        if (response.ok && payload.signedUrl && !cancelled) {
          setReceiptPreviewUrl(payload.signedUrl);
        } else if (!cancelled) {
          setReceiptPreviewUrl(null);
        }
      } catch {
        if (!cancelled) setReceiptPreviewUrl(null);
      } finally {
        if (!cancelled) setIsLoadingReceiptPreview(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [selectedBill?.billing_id, selectedBill?.transaction_reference, selectedBill?.receipt_files]);

  useEffect(() => {
    if (!printMode) return;

    const timer = window.setTimeout(() => window.print(), 75);
    const handleAfterPrint = () => setPrintMode(null);

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printMode]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case BillingStatus.PAID: return "bg-green-100 text-green-700 border-green-200";
      case BillingStatus.UNPAID: return "bg-slate-100 text-slate-700 border-slate-200";
      case BillingStatus.PENDING_VERIFICATION: return "bg-amber-100 text-amber-700 border-amber-200";
      case BillingStatus.PENDING: return "bg-amber-100 text-amber-700 border-amber-200";
      case BillingStatus.OVERDUE: return "bg-red-100 text-red-700 border-red-200";
      case BillingStatus.FAILED: return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBorderColor = (status?: string) => {
    switch (status) {
      case BillingStatus.PAID: return "border-l-[#769C51]";
      case BillingStatus.UNPAID: return "border-l-slate-400";
      case BillingStatus.PENDING_VERIFICATION: return "border-l-[#EAB308]";
      case BillingStatus.PENDING: return "border-l-[#EAB308]";
      case BillingStatus.OVERDUE: return "border-l-[#EF4444]";
      case BillingStatus.FAILED: return "border-l-[#F43F5E]";
      default: return "border-l-slate-400";
    }
  };

  const getStatusBadgeBg = (status?: string) => {
    switch (status) {
      case BillingStatus.PAID: return "bg-[#769C51]";
      case BillingStatus.UNPAID: return "bg-slate-500";
      case BillingStatus.PENDING_VERIFICATION: return "bg-[#EAB308]";
      case BillingStatus.PENDING: return "bg-[#EAB308]";
      case BillingStatus.OVERDUE: return "bg-[#EF4444]";
      case BillingStatus.FAILED: return "bg-[#F43F5E]";
      default: return "bg-slate-500";
    }
  };

  const getStatusFormat = (status?: string) => {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  const handleUploadPayment = async (billId: string) => {
    if (!uploadFile || !billId) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("billingId", billId);
      formData.append("receiptFile", uploadFile);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to upload receipt.");
      }

      // Reload page to reflect changes
      window.location.reload();

    } catch (err: any) {
      setUploadError(err.message || "Failed to upload receipt.");
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };

  const handleCancelReceipt = async () => {
    if (!focusedBill?.billing_id) return;

    if (!confirm("Cancel the uploaded receipt? You can reupload a new one after this.")) return;

    setIsCancellingReceipt(true);
    setUploadError("");

    try {
      const response = await fetch(cancelEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingId: focusedBill.billing_id }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to cancel receipt.");
      }

      setUploadFile(null);
      router.refresh();
    } catch (err: any) {
      setUploadError(err.message || "Failed to cancel receipt.");
    } finally {
      setIsCancellingReceipt(false);
    }
  };

  const handlePrint = () => {
    if (!focusedBill) return;
    setPrintMode("bill");
  };

  const handleDownloadStatement = () => {
    setPrintMode("statement");
  };

  return (
    <>
      <style jsx global>{`
      @media print {
        @page {
          margin: 6mm;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body * {
          visibility: hidden !important;
        }

        #invoice-print-root,
        #invoice-print-root * {
          visibility: visible !important;
        }

        #invoice-print-root {
          position: static !important;
          width: 100%;
          min-height: auto;
          background: #fff;
          z-index: 9999;
          box-sizing: border-box;
          padding: 0;
        }
      }
    `}</style>
      <div className="space-y-8 print:hidden">
        {USE_DUMMY_BILLING_DATA && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Dummy billing mode is enabled for UI testing. Set <span className="font-semibold">USE_DUMMY_BILLING_DATA</span> to false when you want live backend data.
          </div>
        )}

        {/* Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#5591AB] text-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:-translate-y-1">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xs font-bold tracking-wide text-white/90 uppercase">Remaining Balance</CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-white/20 ring-1 ring-white/10">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold pt-2">₱{formatPeso(displaySummary?.balance)}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#10B981] text-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:-translate-y-1">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xs font-bold tracking-wide text-white/90 uppercase">Total Paid</CardTitle>
                <div className="p-2 rounded-xl bg-white/20 ring-1 ring-white/10">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold pt-2">₱{formatPeso(displaySummary?.paid)}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#EF4444] text-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:-translate-y-1">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xs font-bold tracking-wide text-white/90 uppercase">Overdue</CardTitle>
                <div className="p-2 rounded-xl bg-white/20 ring-1 ring-white/10">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold pt-2">₱{formatPeso(overdueAmount)}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D2A6B] text-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:-translate-y-1">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xs font-bold tracking-wide text-white/90 uppercase">Next Payment Due</CardTitle>
                <div className="p-2 rounded-xl bg-white/20 ring-1 ring-white/10">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold pt-2">
                {nextUnpaidBill
                  ? safeDateLabel(nextUnpaidBill?.due_date, "MMM dd, yyyy")
                  : "All clear!"}
              </div>
              <div className="text-xs text-white/70 mt-1">Automatic payment schedule</div>
            </CardContent>
          </Card>
        </div>

        {/* My Invoices */}
        <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">My Invoices</CardTitle>
                <div className="text-sm text-slate-500">Review bills, download statements, and upload receipts.</div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex bg-white border border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30 rounded-xl overflow-hidden flex-1 md:w-[250px] items-center">
                  <div className="pl-3 flex items-center justify-center text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search invoice or status"
                    value={invoicesSearchQuery}
                    onChange={(e) => { setInvoicesSearchQuery(e.target.value); setInvoicesPage(1); }}
                    className="w-full px-3 py-2 bg-transparent text-sm outline-none font-sans"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <Table className="text-slate-700">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="px-4 py-3 font-semibold">Invoice / Period</TableHead>
                  <TableHead className="px-4 py-3 font-semibold">Amount</TableHead>
                  <TableHead className="px-4 py-3 font-semibold">Due Date</TableHead>
                  <TableHead className="px-4 py-3 font-semibold">Status</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((bill: any) => {
                  const isActionable =
                    bill?.status === BillingStatus.UNPAID ||
                    bill?.status === BillingStatus.OVERDUE ||
                    bill?.status === BillingStatus.FAILED;

                  const billId = bill?.billing_id || "Unknown";
                  const isExpanded = selectedBill?.billing_id === billId;

                  return (
                    <Fragment key={billId}>
                      <TableRow className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${isExpanded ? "bg-slate-50/80" : ""}`} onClick={() => setSelectedBill(isExpanded ? null : bill)}>
                        <TableCell className="px-4 py-4">
                          <div className="font-semibold text-slate-900">
                            {bill?.billing_period_date
                              ? `Rent - ${safeDateLabel(bill.billing_period_date, "MMM yyyy", "N/A")}`
                              : "Student Invoice"}
                          </div>
                          <div className="text-xs text-slate-500">{String(billId).split("-")[0]}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-bold text-slate-900">
                          ₱{formatPeso(bill?.amount)}
                        </TableCell>
                        <TableCell className="px-4 py-4">{safeDateLabel(bill?.due_date, "MMM dd, yyyy")}</TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={`border ${getStatusColor(bill?.status)} rounded-full px-2.5 py-1 font-semibold`}
                          >
                            {getStatusFormat(bill?.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedBill(isExpanded ? null : bill); }} className="bg-white">
                              <FileText className="size-4" />
                              {isExpanded ? "Close" : "View Details"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-slate-50/40 hover:bg-slate-50/40">
                          <TableCell colSpan={5} className="p-0">
                            <div className="px-6 py-4 animate-in slide-in-from-top-2 fade-in duration-200">
                              <div className={`rounded-xl bg-[#FDFFF4] border border-slate-200 border-l-[8px] ${getStatusBorderColor(bill?.status)} p-6 shadow-sm w-full max-w-4xl mx-auto flex flex-col gap-6`}>
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                    <div>
                                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice ID</div>
                                      <div className="font-semibold text-slate-900">{String(billId).split("-")[0]}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billing Period</div>
                                      <div className="font-semibold text-slate-900">{bill?.billing_period_date ? safeDateLabel(bill.billing_period_date, "MMMM yyyy", "N/A") : "N/A"}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</div>
                                      <div className="font-semibold text-slate-900">{safeDateLabel(bill?.due_date, "MMM dd, yyyy")}</div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</div>
                                      <div className="font-semibold text-slate-900">₱{formatPeso(bill?.summary?.total ?? bill?.amount ?? 0)}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white font-bold text-xs uppercase tracking-wide shadow-sm ${getStatusBadgeBg(bill?.status)}`}>
                                      {bill?.status === BillingStatus.PAID && <CheckCircle2 className="w-4 h-4" />}
                                      {bill?.status === BillingStatus.UNPAID && <AlertCircle className="w-4 h-4" />}
                                      {bill?.status === BillingStatus.OVERDUE && <AlertCircle className="w-4 h-4" />}
                                      {bill?.status === BillingStatus.FAILED && <AlertCircle className="w-4 h-4" />}
                                      {(bill?.status === BillingStatus.PENDING || bill?.status === BillingStatus.PENDING_VERIFICATION) && <Clock className="w-4 h-4" />}
                                      <span>{getStatusFormat(bill?.status)}</span>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Charge Breakdown</div>
                                  {(bill?.breakdown || []).map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                      <div className="text-slate-600 capitalize">{String(item.label || "").replace(/_/g, " ")}</div>
                                      <div className="font-medium text-slate-900">₱{Math.abs(toCurrencyNumber(item?.amount)).toLocaleString()}</div>
                                    </div>
                                  ))}
                                  <Separator className="my-3" />
                                  <div className="flex items-center justify-between font-extrabold text-slate-900">
                                    <div>Total Balance Due</div>
                                    <div className="text-lg">₱{formatPeso(bill?.summary?.total ?? bill?.amount ?? 0)}</div>
                                  </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                  <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="size-4 mr-2" />
                                    Download Invoice
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>

            {searchedBills.length === 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                No billing records found.
              </div>
            )}

            {/* PAGINATION BAR FOR INVOICES */}
            {searchedBills.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{startInvoiceIndex + 1}</span> to{" "}
                  <span className="font-semibold text-slate-700">{Math.min(startInvoiceIndex + invoicesPerPage, searchedBills.length)}</span> of{" "}
                  <span className="font-semibold text-slate-700">{searchedBills.length}</span> results
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInvoicesPage(p => Math.max(1, p - 1))}
                    disabled={safeInvoicesPage <= 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition ${safeInvoicesPage <= 1
                      ? "border-slate-200 text-slate-300 cursor-not-allowed"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getVisibleInvoicePages().map(page => (
                    <button
                      key={page}
                      onClick={() => setInvoicesPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-semibold transition ${page === safeInvoicesPage
                        ? "bg-[#0D2A6B] text-white border-[#0D2A6B] shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setInvoicesPage(p => Math.min(totalInvoicesPages, p + 1))}
                    disabled={safeInvoicesPage >= totalInvoicesPages}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition ${safeInvoicesPage >= totalInvoicesPages
                      ? "border-slate-200 text-slate-300 cursor-not-allowed"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="text-lg font-bold text-slate-900">Transaction History</CardTitle>
              <div className="flex bg-white border border-[#e8e2d6] shadow-sm transition hover:shadow-md hover:border-[#44291B]/30 rounded-xl overflow-hidden flex-1 max-w-xs items-center">
                <div className="pl-3 flex items-center justify-center text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search invoice or status"
                  value={historySearchQuery}
                  onChange={(e) => { setHistorySearchQuery(e.target.value); setHistoryPage(1); }}
                  className="w-full px-3 py-2 bg-transparent text-sm outline-none font-sans"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            {searchedHistory.length > 0 && (
              <Table className="text-slate-700">
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="px-4 py-3 font-semibold">Date</TableHead>
                    <TableHead className="px-4 py-3 font-semibold">Invoice</TableHead>
                    <TableHead className="px-4 py-3 font-semibold">Amount</TableHead>
                    <TableHead className="px-4 py-3 font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHistory.map((entry: any, index: number) => {
                    const nestedBilling = Array.isArray(entry?.billing) ? entry.billing[0] : entry?.billing;
                    const historyAmount = nestedBilling?.amount ?? entry?.amount ?? 0;

                    return (
                      <TableRow key={`${entry?.billing_id || "unknown"}-${entry?.created_at || index}`} className="hover:bg-slate-50/60">
                        <TableCell className="px-4 py-3">{safeDateLabel(entry?.created_at, "MMM dd, yyyy HH:mm")}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs">{String(entry?.billing_id || "N/A").split("-")[0]}</TableCell>
                        <TableCell className="px-4 py-3 font-semibold">₱{formatPeso(historyAmount)}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`border ${getStatusColor(entry?.status)} rounded-full px-2.5 py-1 font-semibold`}
                          >
                            {getStatusFormat(entry?.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {searchedHistory.length === 0 && (
              <div className="text-sm text-slate-600 mt-4">
                No payment activity yet.
              </div>
            )}

            {/* PAGINATION BAR FOR HISTORY */}
            {searchedHistory.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{startHistoryIndex + 1}</span> to{" "}
                  <span className="font-semibold text-slate-700">{Math.min(startHistoryIndex + historyPerPage, searchedHistory.length)}</span> of{" "}
                  <span className="font-semibold text-slate-700">{searchedHistory.length}</span> results
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={safeHistoryPage <= 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition ${safeHistoryPage <= 1
                      ? "border-slate-200 text-slate-300 cursor-not-allowed"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getVisibleHistoryPages().map(page => (
                    <button
                      key={page}
                      onClick={() => setHistoryPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-semibold transition ${page === safeHistoryPage
                        ? "bg-[#0D2A6B] text-white border-[#0D2A6B] shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    disabled={safeHistoryPage >= totalHistoryPages}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-medium transition ${safeHistoryPage >= totalHistoryPages
                      ? "border-slate-200 text-slate-300 cursor-not-allowed"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* Printable View (Hidden in normal screen, block in print) */}
      {printMode === "bill" && focusedBill && (
        <div id="invoice-print-root" className="hidden print:block font-sans text-black bg-white p-4 text-sm w-full">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 uppercase tracking-tighter">INVOICE</h1>
              <p className="text-slate-500 mt-1 font-mono">#{focusedBill?.billing_id || "N/A"}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 text-xl">ELbnb Housing</p>
              <p className="text-slate-500">Student Residence Account</p>
            </div>
          </div>

          <div className="flex justify-between mb-5">
            <div>
              <p className="text-slate-500 font-bold mb-1">BILLED TO:</p>
              <p className="font-semibold text-lg">{focusedBill?.accommodation_assignment?.users ? `${focusedBill.accommodation_assignment.users.first_name} ${focusedBill.accommodation_assignment.users.last_name}` : "Student Resident"}</p>
              <p className="text-slate-600">ID: {userId}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-bold mb-1">DETAILS:</p>
              <p><span className="font-semibold">Billed Date:</span> {safeDateLabel(focusedBill?.created_at, "MM/dd/yyyy")}</p>
              <p><span className="font-semibold">Due Date:</span> {safeDateLabel(focusedBill?.due_date, "MM/dd/yyyy")}</p>
              <p className="mt-2"><span className="font-bold">Status:</span> {getStatusFormat(focusedBill?.status).toUpperCase()}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-5">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-3 font-bold uppercase text-xs text-slate-500 w-2/3">Item Description</th>
                <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right w-1/3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {focusedBill?.breakdown && focusedBill.breakdown.length > 0 ? (
                focusedBill.breakdown.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 capitalize text-slate-700">{String(item.label || "").replace(/_/g, " ")}</td>
                    <td className="py-3 text-right">₱{formatPeso(item?.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-slate-100">
                  <td className="py-4 font-semibold">Total Amount</td>
                  <td className="py-4 text-right font-medium">₱{formatPeso(focusedBill?.amount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end pt-4">
            <div className="w-1/2">
              <div className="border-t-2 border-slate-900 pt-4 flex justify-between">
                <span className="text-lg font-bold">TOTAL DUE</span>
                <span className="text-2xl font-black">₱{formatPeso(focusedBill?.summary?.total ?? focusedBill?.amount ?? 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-300 pt-3 text-center text-slate-400 text-xs">
            This is an electronically generated statement. No physical signature is required.
          </div>
        </div>
      )}

      {printMode === "statement" && (
        <div id="invoice-print-root" className="hidden print:block font-sans text-black bg-white p-4 text-sm w-full">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 uppercase tracking-tighter">INVOICE HISTORY</h1>
              <p className="text-slate-500 mt-1">All billing records for this account</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 text-xl">ELbnb Housing</p>
              <p className="text-slate-500">Student Residence Account</p>
            </div>
          </div>

          <div className="flex justify-between mb-5">
            <div>
              <p className="text-slate-500 font-bold mb-1">BILLED TO:</p>
              <p className="font-semibold text-lg">{normalizedBills[0]?.accommodation_assignment?.users ? `${normalizedBills[0].accommodation_assignment.users.first_name} ${normalizedBills[0].accommodation_assignment.users.last_name}` : "Student Resident"}</p>
              <p className="text-slate-600">ID: {userId}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-bold mb-1">SUMMARY:</p>
              <p><span className="font-semibold">Invoices:</span> {normalizedBills.length}</p>
              <p><span className="font-semibold">Paid:</span> ₱{formatPeso(displaySummary?.paid)}</p>
              <p><span className="font-semibold">Balance:</span> ₱{formatPeso(displaySummary?.balance)}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-5">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-3 font-bold uppercase text-xs text-slate-500">Invoice</th>
                <th className="py-3 font-bold uppercase text-xs text-slate-500">Period</th>
                <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right">Amount</th>
                <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right">Due Date</th>
                <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {normalizedBills.map((bill: any) => (
                <tr key={bill?.billing_id || bill?.created_at} className="border-b border-slate-100">
                  <td className="py-3 font-mono text-xs">{String(bill?.billing_id || "N/A").split("-")[0]}</td>
                  <td className="py-3 font-semibold">{bill?.billing_period_date ? safeDateLabel(bill.billing_period_date, "MMMM yyyy") : "Student Invoice"}</td>
                  <td className="py-3 text-right">₱{formatPeso(bill?.amount)}</td>
                  <td className="py-3 text-right">{safeDateLabel(bill?.due_date, "MM/dd/yyyy")}</td>
                  <td className="py-3 text-right">{getStatusFormat(bill?.status).toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {normalizedPaymentHistory.length > 0 && (
            <>
              <div className="mb-3 font-bold uppercase text-xs text-slate-500">Payment History</div>
              <table className="w-full text-left border-collapse mb-5">
                <thead>
                  <tr className="border-b border-slate-300">
                    <th className="py-3 font-bold uppercase text-xs text-slate-500">Date</th>
                    <th className="py-3 font-bold uppercase text-xs text-slate-500">Invoice</th>
                    <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right">Amount</th>
                    <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedPaymentHistory.map((entry: any, index: number) => {
                    const nestedBilling = Array.isArray(entry?.billing) ? entry.billing[0] : entry?.billing;
                    const historyAmount = nestedBilling?.amount ?? entry?.amount ?? 0;

                    return (
                      <tr key={`${entry?.billing_id || "unknown"}-${entry?.created_at || index}`} className="border-b border-slate-100">
                        <td className="py-3">{safeDateLabel(entry?.created_at, "MM/dd/yyyy HH:mm")}</td>
                        <td className="py-3 font-mono text-xs">{String(entry?.billing_id || "N/A").split("-")[0]}</td>
                        <td className="py-3 text-right">₱{formatPeso(historyAmount)}</td>
                        <td className="py-3 text-right">{getStatusFormat(entry?.status).toUpperCase()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          <div className="mt-8 border-t border-slate-300 pt-3 text-center text-slate-400 text-xs">
            This is an electronically generated statement. No physical signature is required.
          </div>
        </div>
      )}
    </>
  );
}

