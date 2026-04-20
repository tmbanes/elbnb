"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { processPaymentAction } from "./actions";
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
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BillingClient({ userId, summary, bills }: any) {
  const supabase = getSupabaseBrowserClient();

  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const USE_DUMMY_BILLING_DATA = true;

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
    [],
  );

  const normalizedBills = useMemo(
    () =>
      USE_DUMMY_BILLING_DATA ? dummyBills : Array.isArray(bills) ? bills : [],
    [USE_DUMMY_BILLING_DATA, dummyBills, bills],
  );

  const focusedBill = selectedBill;

  const toCurrencyNumber = (value: unknown) => {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const formatPeso = (value: unknown) => {
    return toCurrencyNumber(value).toLocaleString();
  };

  const safeDateLabel = (
    value: unknown,
    formatStr: string,
    fallback = "N/A",
  ) => {
    if (!value) return fallback;
    const dateValue = new Date(value as string);
    return Number.isNaN(dateValue.getTime())
      ? fallback
      : format(dateValue, formatStr);
  };

  const overdueAmount = normalizedBills
    .filter((b: any) => b?.status === BillingStatus.OVERDUE)
    .reduce((sum: number, b: any) => sum + toCurrencyNumber(b?.amount), 0);

  const nextUnpaidBill = normalizedBills.find(
    (b: any) => b?.status === BillingStatus.UNPAID,
  );

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
    const stillExists = normalizedBills.some(
      (bill: any) => bill?.billing_id === selectedBill?.billing_id,
    );
    if (!stillExists) {
      setSelectedBill(null);
    }
  }, [normalizedBills, selectedBill]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case BillingStatus.PAID:
        return "bg-green-100 text-green-700 border-green-200";
      case BillingStatus.UNPAID:
        return "bg-slate-100 text-slate-700 border-slate-200";
      case BillingStatus.PENDING:
        return "bg-amber-100 text-amber-700 border-amber-200";
      case BillingStatus.OVERDUE:
        return "bg-red-100 text-red-700 border-red-200";
      case BillingStatus.FAILED:
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusFormat = (status?: string) => {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleUploadPayment = async (billId: string) => {
    if (!uploadFile || !billId) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const fileExt = uploadFile.name.split(".").pop();
      const fileName = `${userId}/${billId}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("payment_receipts")
        .upload(fileName, uploadFile);

      if (error) {
        throw error;
      }

      await processPaymentAction(userId, billId, data.path);

      // Reload page to reflect changes
      window.location.reload();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload receipt.");
    } finally {
      setIsUploading(false);
      setUploadFile(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStatement = () => {
    // For now we reuse print-to-PDF behavior; later you can replace with a real statement generator.
    window.print();
  };

  return (
    <>
      <div className="space-y-8 print:hidden">
        {USE_DUMMY_BILLING_DATA && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Dummy billing mode is enabled for UI testing. Set{" "}
            <span className="font-semibold">USE_DUMMY_BILLING_DATA</span> to
            false when you want live backend data.
          </div>
        )}

        {/* Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Current Balance
                  </CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 ring-1 ring-black/5">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">
                ₱{formatPeso(displaySummary?.balance)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Total Paid
                </CardTitle>
                <div className="p-2 rounded-xl bg-emerald-50 ring-1 ring-emerald-200/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">
                ₱{formatPeso(displaySummary?.paid)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Overdue
                </CardTitle>
                <div className="p-2 rounded-xl bg-red-50 ring-1 ring-red-200/60">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-red-600">
                ₱{formatPeso(overdueAmount)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D2A6B] text-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-xs font-semibold tracking-wide text-white/80 uppercase">
                  Next Payment Due
                </CardTitle>
                <div className="p-2 rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold">
                {nextUnpaidBill
                  ? safeDateLabel(nextUnpaidBill?.due_date, "MMM dd, yyyy")
                  : "All clear!"}
              </div>
              <div className="text-xs text-white/70 mt-1">
                Automatic payment schedule
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Invoices */}
        <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  My Invoices
                </CardTitle>
                <div className="text-sm text-slate-500">
                  Review bills, download statements, and upload receipts.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadStatement}
                  className="bg-white"
                >
                  <DownloadIcon className="size-4" />
                  Download Statement
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <Table className="text-slate-700">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="px-4 py-3 font-semibold">
                    Invoice / Period
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Amount
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Due Date
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedBills.map((bill: any) => {
                  const isActionable =
                    bill?.status === BillingStatus.UNPAID ||
                    bill?.status === BillingStatus.OVERDUE ||
                    bill?.status === BillingStatus.FAILED;

                  const billId = bill?.billing_id || "Unknown";

                  return (
                    <TableRow key={billId} className="hover:bg-slate-50/60">
                      <TableCell className="px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {bill?.billing_period_date
                            ? `Rent - ${safeDateLabel(bill.billing_period_date, "MMM yyyy", "N/A")}`
                            : "Student Invoice"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {String(billId).split("-")[0]}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 font-bold text-slate-900">
                        ₱{formatPeso(bill?.amount)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {safeDateLabel(bill?.due_date, "MMM dd, yyyy")}
                      </TableCell>
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
                          <Button
                            variant="outline"
                            onClick={() => setSelectedBill(bill)}
                            className="bg-white"
                          >
                            <FileText className="size-4" />
                            Detail
                          </Button>
                          {isActionable && (
                            <Button
                              onClick={() => setSelectedBill(bill)}
                              className="bg-[#0D2A6B] text-white hover:bg-[#0B235A]"
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {normalizedBills.length === 0 && (
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                No billing records found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-900">
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="text-sm text-slate-600">
              Transaction history will appear here once payment records are
              available.
            </div>
          </CardContent>
        </Card>

        {/* Focused Invoice + Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center rounded-lg bg-[#0D2A6B] text-white text-xs font-bold px-3 py-1">
                    Focused invoice detail
                  </div>
                  <div className="mt-3 text-xl font-extrabold text-slate-900">
                    {focusedBill
                      ? String(focusedBill?.billing_id || "Unknown").split(
                          "-",
                        )[0]
                      : "No invoice selected"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="bg-white"
                >
                  <Printer className="size-4" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {focusedBill ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Due date
                      </div>
                      <div className="font-semibold text-slate-900">
                        {safeDateLabel(focusedBill?.due_date, "MMM dd, yyyy")}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border ${getStatusColor(focusedBill?.status)} rounded-full px-2.5 py-1 font-semibold`}
                    >
                      {getStatusFormat(focusedBill?.status)}
                    </Badge>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-xs font-bold text-slate-600 uppercase mb-3">
                      Breakdown
                    </div>
                    <div className="space-y-2">
                      {(focusedBill?.breakdown || []).map(
                        (item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="text-slate-700 capitalize">
                              {String(item.label || "").replace(/_/g, " ")}
                            </div>
                            <div className="font-semibold text-slate-900">
                              ₱
                              {Math.abs(
                                toCurrencyNumber(item?.amount),
                              ).toLocaleString()}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <div>Total Balance Due</div>
                      <div>
                        ₱
                        {formatPeso(
                          focusedBill?.summary?.total ??
                            focusedBill?.amount ??
                            0,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="bg-white flex-1"
                      onClick={handlePrint}
                    >
                      <Printer className="size-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Select an invoice to see details.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/90 ring-1 ring-black/5 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-slate-900">
                Cash Payment - Upload Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              {!focusedBill ? (
                <div className="text-sm text-slate-500">
                  Select an invoice to upload a receipt.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-slate-600">
                    If you paid via cash at the management office, upload a
                    clear photo of your receipt for verification.
                  </div>

                  {focusedBill?.status === BillingStatus.UNPAID ||
                  focusedBill?.status === BillingStatus.OVERDUE ||
                  focusedBill?.status === BillingStatus.FAILED ? (
                    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
                      <div className="flex flex-col gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setUploadFile(e.target.files?.[0] || null)
                          }
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-50 transition"
                        />
                        <Button
                          disabled={
                            !uploadFile || isUploading || USE_DUMMY_BILLING_DATA
                          }
                          onClick={() =>
                            handleUploadPayment(focusedBill?.billing_id)
                          }
                          className="w-full bg-[#2F4F1A] hover:bg-[#284315] text-white h-10"
                        >
                          {USE_DUMMY_BILLING_DATA ? (
                            "Disabled in dummy mode"
                          ) : isUploading ? (
                            "Uploading..."
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <UploadCloud className="size-4" /> Submit Receipt
                            </span>
                          )}
                        </Button>
                        {uploadError && (
                          <div className="text-sm text-red-600">
                            {uploadError}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                      This invoice is{" "}
                      <span className="font-semibold">
                        {getStatusFormat(focusedBill?.status)}
                      </span>
                      . Receipt upload is only available for unpaid/overdue
                      invoices.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printable View (Hidden in normal screen, block in print) */}
      {selectedBill && (
        <div className="hidden print:block font-sans text-black bg-white p-8 absolute inset-0 text-sm">
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 uppercase tracking-tighter">
                INVOICE
              </h1>
              <p className="text-slate-500 mt-1 font-mono">
                #{selectedBill?.billing_id || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 text-xl">ELbnb Housing</p>
              <p className="text-slate-500">Student Residence Account</p>
            </div>
          </div>

          <div className="flex justify-between mb-10">
            <div>
              <p className="text-slate-500 font-bold mb-1">BILLED TO:</p>
              <p className="font-semibold text-lg">
                {selectedBill?.accommodation_assignment?.users?.full_name ||
                  "Student Resident"}
              </p>
              <p className="text-slate-600">ID: {userId}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-bold mb-1">DETAILS:</p>
              <p>
                <span className="font-semibold">Billed Date:</span>{" "}
                {safeDateLabel(selectedBill?.created_at, "MM/dd/yyyy")}
              </p>
              <p>
                <span className="font-semibold">Due Date:</span>{" "}
                {safeDateLabel(selectedBill?.due_date, "MM/dd/yyyy")}
              </p>
              <p className="mt-2">
                <span className="font-bold">Status:</span>{" "}
                {getStatusFormat(selectedBill?.status).toUpperCase()}
              </p>
            </div>
          </div>

          <table className="w-full text-left border-collapse mb-10">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-3 font-bold uppercase text-xs text-slate-500 w-2/3">
                  Item Description
                </th>
                <th className="py-3 font-bold uppercase text-xs text-slate-500 text-right w-1/3">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 font-semibold">
                  {selectedBill?.billing_period_date
                    ? `Invoice for ${safeDateLabel(selectedBill.billing_period_date, "MMMM yyyy")}`
                    : "Student Invoice"}{" "}
                  - Base
                </td>
                <td className="py-4 text-right font-medium">
                  ₱{formatPeso(selectedBill?.amount)}
                </td>
              </tr>
              {selectedBill?.breakdown?.map((item: any, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 capitalize text-slate-700 pl-4">
                    ↳ {item.label.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 text-right">
                    ₱{formatPeso(item?.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-4">
            <div className="w-1/2">
              <div className="border-t-2 border-slate-900 pt-4 flex justify-between">
                <span className="text-lg font-bold">TOTAL DUE</span>
                <span className="text-2xl font-black">
                  ₱
                  {formatPeso(
                    selectedBill?.summary?.total ?? selectedBill?.amount ?? 0,
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-20 border-t border-slate-300 pt-4 text-center text-slate-400 text-xs">
            This is an electronically generated statement. No physical signature
            is required.
          </div>
        </div>
      )}
    </>
  );
}
