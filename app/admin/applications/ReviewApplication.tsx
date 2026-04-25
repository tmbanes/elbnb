"use client";

import ApplicationPreview from "./ApplicationPreview";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ChevronLeft, Mail, MapPin, Pencil, Trash2, Calendar } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  processApplication,
  type Unit,
  type AdminApplication,
  type AdminAction,
  type ApplicationInvoiceItemInput,
  getApplicationById,
  sendApplicationInvoice,
} from "@/lib/actions/admin-application-actions";

type InvoiceKind = "first_rental" | "security_deposit" | "reservation_fee" | "other";

const invoiceKindOptions: { value: InvoiceKind; label: string }[] = [
  { value: "first_rental", label: "First Rental" },
  { value: "security_deposit", label: "Security Deposit" },
  { value: "reservation_fee", label: "Reservation Fee" },
  { value: "other", label: "Other" },
];

const createDefaultInvoiceItem = (): ApplicationInvoiceItemInput => ({
  kind: "first_rental",
  amount: 0,
  required_to_secure_slot: true,
  note: "",
});

function mapBillingTypeToKind(type?: string): InvoiceKind {
  if (type === "security_deposit") return "security_deposit";
  if (type === "reservation_fee") return "reservation_fee";
  if (type === "other") return "reservation_fee";
  return "first_rental";
}

export default function ReviewApplication({
  applicationId,
  onAction,
  onClose,
}: {
  applicationId: string;
  onAction: (id: string, action: AdminAction, unitId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<AdminAction | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appData, setAppData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<ApplicationInvoiceItemInput[]>([
    createDefaultInvoiceItem(),
  ]);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);

  const hydrateInvoiceForm = (loadedData: any) => {
    const invoiceDraft = loadedData?.invoiceDraft;

    if (invoiceDraft?.due_date) {
      setInvoiceDueDate(new Date(invoiceDraft.due_date).toISOString().slice(0, 10));
    } else if (loadedData?.check_in) {
      setInvoiceDueDate(new Date(loadedData.check_in).toISOString().slice(0, 10));
    } else {
      setInvoiceDueDate("");
    }

    const requiredKinds = new Set<string>();

    const draftItems = Array.isArray(invoiceDraft?.billing_item)
      ? invoiceDraft.billing_item.map((item: any, idx: number) => {
        const kind = mapBillingTypeToKind(item?.type);
        const required = idx === 0;

        return {
          kind,
          amount: Number(item?.amount ?? 0),
          required_to_secure_slot: required,
          note: "",
        } as ApplicationInvoiceItemInput;
      })
      : [];

    setInvoiceItems(draftItems.length ? draftItems : [createDefaultInvoiceItem()]);
    setInvoiceNote("");
  };
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingData(true);
        const data = await getApplicationById(applicationId);
        setAppData(data);
        setInvoiceSuccess(null);
        setInvoiceError(null);

        if (data?.unit_id) {
          setSelectedUnitId(data.unit_id);
        }

        hydrateInvoiceForm(data);
      } catch (err) {
        console.error("Failed to fetch app data:", err);
        setError("Failed to load application details.");
      } finally {
        setIsLoadingData(false);
      }
    }

    if (applicationId) {
      loadData();
    }
  }, [applicationId]);

  if (isLoadingData) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-[#F6F8D5]">
        <p className="animate-pulse text-gray-600">Loading Application...</p>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="p-6 bg-[#F6F8D5]">
        <p className="text-red-600">Error: Could not find application data.</p>
        <Button onClick={onClose} variant="outline" className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction === "approve" && !selectedUnitId) {
      setError("Please select a unit before approving.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onAction(
        applicationId,
        confirmAction,
        confirmAction === "approve" ? selectedUnitId : undefined,
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      setLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleSendInvoice() {
    if (!invoiceDueDate) {
      setInvoiceError("Please provide a due date.");
      return;
    }

    if (!invoiceItems.length) {
      setInvoiceError("Add at least one billing item.");
      return;
    }

    if (invoiceItems.some((item) => Number(item.amount) <= 0)) {
      setInvoiceError("All billing item amounts must be greater than 0.");
      return;
    }

    if (!invoiceItems.some((item) => item.required_to_secure_slot)) {
      setInvoiceError("Mark at least one item as required to secure slot.");
      return;
    }

    setInvoiceError(null);
    setIsSendingInvoice(true);

    try {
      if (data.status === "pending_admin") {
        if (!selectedUnitId) {
          throw new Error("Please select a unit before sending invoice.");
        }

        await processApplication(applicationId, "approve", selectedUnitId);

        const approvedData = await getApplicationById(applicationId);
        setAppData(approvedData);

        if (approvedData?.unit_id) {
          setSelectedUnitId(approvedData.unit_id);
        }
      }

      await sendApplicationInvoice(applicationId, {
        due_date: new Date(`${invoiceDueDate}T00:00:00`).toISOString(),
        items: invoiceItems,
        note: invoiceNote,
        unit_id: selectedUnitId,
      });

      const refreshed = await getApplicationById(applicationId);
      setAppData(refreshed);
      hydrateInvoiceForm(refreshed);
      setIsInvoiceModalOpen(false);
      setInvoiceSuccess("Invoice sent successfully.");
    } catch (e) {
      setInvoiceError(e instanceof Error ? e.message : "Failed to send invoice.");
    } finally {
      setIsSendingInvoice(false);
    }
  }

  const addInvoiceItem = () => {
    setInvoiceItems((prev) => [...prev, createDefaultInvoiceItem()]);
  };

  const updateInvoiceItem = <K extends keyof ApplicationInvoiceItemInput>(
    index: number,
    key: K,
    value: ApplicationInvoiceItemInput[K],
  ) => {
    setInvoiceItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const userData = Array.isArray(appData?.users) ? appData.users[0] : appData?.users;

  const data = {
    id: appData?.application_id || "",
    status: appData?.application_status || "Pending",
    submitted: new Date(appData.date_submitted).toLocaleDateString(),
    unit: appData.units?.unit_number || "Not yet assigned",

    firstName: userData?.first_name || "Unknown",
    lastName: userData?.last_name || "",
    email: userData?.email || "No email",

    stay: {
      duration: `${appData.duration_of_stay} months`,
      checkIn: appData.check_in,
      checkOut: appData.check_out,
      companions: appData.number_of_companions || "Solo",
      dorm: appData.accommodation?.name || "Unassigned",
      roomType: appData.preferred_unit_type,
    },

    // These might need to be fetched from a separate table later!
    documents: ["Application Form"],
    history: [
      `Application Submitted - ${new Date(appData.date_submitted).toLocaleDateString()}`,
    ],
  };

  return (
    <div className="p-6 space-y-6 bg-[#F6F8D5] h-full overflow-y-auto">

      {/* HEADER */}
      <div className="flex items-start justify-between">

        {/* CLOSE BUTTON */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#44291B] hover:bg-[#e8e2d6] shrink-0"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Close
        </Button>

      </div>

      {/* STUDENT INFO */}
      <Card className="bg-[#FDFFF4] border-[#e2e4c0] shadow-sm">
        <CardContent className="px-5 py-4 space-y-4">

          {/* TOP INFO */}
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Student Information
          </h3>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-[#e8edf7] flex items-center justify-center font-bold text-[#264384]">
              {data.firstName[0]}{data.lastName[0]}
            </div>

            {/* NAME + DETAILS */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="truncate">
                <h1 className="text-xl font-bold text-[#44291B] leading-tight truncate">
                  {data.firstName} {data.lastName}
                </h1>
                <p className="text-xs text-[#44291B]/70">
                  Application #{data.id.slice(0, 8)} • {data.status}
                </p>
              </div>

              {/* EMAIL + DATE SUBMITTED */}
              <div className="flex flex-wrap gap-2 min-w-0">

                <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-xs text-[#264384] max-w-full">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{data.email}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-xs text-[#264384] max-w-full">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span className="truncate">Submitted: {data.submitted}</span>
                </span>

              </div>

            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-5 space-y-6">

        {/* STAY DETAILS */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Stay Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label font-semibold">Duration:</p>
              <p>{data.stay.duration}</p>
            </div>

            <div>
              <p className="label font-semibold">Companions:</p>
              <p>{data.stay.companions}</p>
            </div>

            <div>
              <p className="label font-semibold">Check-in:</p>
              <p>{data.stay.checkIn}</p>
            </div>

            <div>
              <p className="label font-semibold">Check-out:</p>
              <p>{data.stay.checkOut}</p>
            </div>
          </div>
        </div>

        {/* ACCOMMODATION */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Accommodation Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label font-semibold">Accommodation:</p>
              <p>{data.stay.dorm}</p>
            </div>

            <div>
              <p className="label font-semibold">Room Type:</p>
              <p>{data.stay.roomType}</p>
            </div>
          </div>

          <select
            className="w-full border rounded-md p-2 text-sm mt-2"
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
          >
            <option value="">Assign unit</option>
            {appData?.availableUnits?.map((unit: any) => (
              <option key={unit.unit_id} value={unit.unit_id}>
                {unit.unit_number}
              </option>
            ))}
          </select>
        </div>

        {/* DOCUMENTS */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Uploaded Documents
          </h3>

          <div className="space-y-2">
            {data.documents.map((doc, i) => (
              <div
                key={i}
                className="flex justify-between items-center border rounded-md px-3 py-2"
              >
                <span>{doc}</span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                >
                  Preview
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL (ONLY ONCE) */}
        {showPreview && (
          <ApplicationPreview onClose={() => setShowPreview(false)} />
        )}

        {/* HISTORY */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
            Application History
          </h3>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {data.history.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* ACTIONS & CONFIRMATION SECTION */}
        <div className="pt-4 border-t border-gray-300">
          {invoiceSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-xs">
              {invoiceSuccess}
            </div>
          )}

          {data.status === "pending_payment" ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="text-center">
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  ✓ Pending Payment
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Send manual invoice with itemized charges to secure this slot.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  className="w-full bg-[#264384] hover:bg-[#1d3268] text-white"
                  onClick={() => {
                    setInvoiceError(null);
                    setInvoiceSuccess(null);
                    setIsInvoiceModalOpen(true);
                  }}
                >
                  {appData?.invoiceDraft ? "Edit & Resend Invoice" : "Send Invoice to User"}
                </Button>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading || appData?.invoiceDraft?.status !== "paid"}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      await onAction(applicationId, "pending_payment");
                      onClose();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Failed to approve application.");
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "Approving..." : "Approve"}
                </Button>

                {appData?.invoiceDraft?.status !== "paid" && (
                  <p className="text-[11px] text-blue-700 text-center">
                    Approve is enabled after the latest invoice is marked as paid.
                  </p>
                )}
              </div>
            </div>
          ) : data.status === "approved" ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <div className="text-center">
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                  ✓ Application Approved
                </p>
                <p className="text-xs text-green-600 mt-1">
                  This application has been finalized and a unit has been assigned.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setInvoiceError(null);
                  setInvoiceSuccess(null);
                  setIsInvoiceModalOpen(true);
                }}
              >
                {appData?.invoiceDraft ? "Edit Existing Invoice" : "Create Invoice"}
              </Button>
            </div>
          ) : data.status === "rejected" ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                Application Rejected
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-xs">
                  {error}
                </div>
              )}

              {confirmAction ? (
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
                  <p className="text-sm font-medium text-gray-700 text-center">
                    Confirm rejection of this application?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setConfirmAction(null);
                        setError(null);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 text-white bg-red-600 hover:bg-red-700"
                      onClick={handleConfirm}
                      disabled={loading}
                    >
                      {loading ? "..." : "Confirm"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    className="bg-[#264384] hover:bg-[#1d3268] text-white flex-1"
                    onClick={() => {
                      setInvoiceError(null);
                      setInvoiceSuccess(null);
                      setIsInvoiceModalOpen(true);
                    }}
                  >
                    Send Invoice
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                    onClick={() => setConfirmAction("reject")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Invoice to User</DialogTitle>
              <DialogDescription>
                Add billing items manually (first rental, security deposit, reservation fee).
                At least one item must be marked as required to secure the slot.
                {data.status === "pending_admin"
                  ? " Sending this invoice will also approve the application and assign the selected unit."
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full border rounded-md p-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Internal Note</label>
                  <input
                    type="text"
                    value={invoiceNote}
                    onChange={(e) => setInvoiceNote(e.target.value)}
                    placeholder="Optional note"
                    className="w-full border rounded-md p-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {invoiceItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center border rounded-md p-3 bg-slate-50"
                  >
                    <div className="col-span-4">
                      <select
                        value={item.kind}
                        onChange={(e) =>
                          updateInvoiceItem(index, "kind", e.target.value as InvoiceKind)
                        }
                        className="w-full border rounded-md p-2 text-sm bg-white"
                      >
                        {invoiceKindOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.amount}
                        onChange={(e) =>
                          updateInvoiceItem(index, "amount", Number(e.target.value || 0))
                        }
                        className="w-full border rounded-md p-2 text-sm bg-white"
                        placeholder="Amount"
                      />
                    </div>

                    <label className="col-span-4 text-xs flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={item.required_to_secure_slot}
                        onChange={(e) =>
                          updateInvoiceItem(index, "required_to_secure_slot", e.target.checked)
                        }
                      />
                      Required to secure slot
                    </label>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeInvoiceItem(index)}
                        disabled={invoiceItems.length <= 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addInvoiceItem}>
                Add Item
              </Button>

              {invoiceError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {invoiceError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInvoiceModalOpen(false)}
                disabled={isSendingInvoice}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSendInvoice} disabled={isSendingInvoice}>
                {isSendingInvoice ? "Sending..." : appData?.invoiceDraft ? "Update Invoice" : "Send Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
