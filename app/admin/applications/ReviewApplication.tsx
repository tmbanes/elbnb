"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ChevronLeft, Mail, Calendar as CalendarIcon, 
  MapPin, User as UserIcon, AlertTriangle, 
  CheckCircle2, FileText, ExternalLink,
  Plus, Trash2, Receipt, Info
} from "lucide-react";

import {
  type AdminAction,
  type ApplicationInvoiceItemInput,
  getApplicationById,
  sendApplicationInvoice,
  processApplication
} from "@/lib/actions/admin-application-actions";

import { cn } from "@/lib/utils/ui-utils";

interface ReviewApplicationProps {
    applicationId: string;
    onClose: () => void;
    onAction: (id: string, action: AdminAction, unitId?: string) => Promise<void>;
}

export default function ReviewApplication({
    applicationId,
    onClose,
    onAction,
}: ReviewApplicationProps) {
  // Data State
  const [appData, setAppData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<AdminAction | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Invoice State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<ApplicationInvoiceItemInput[]>([]);
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  useEffect(() => {
    async function getFileUrl() {
      if (appData?.file && appData?.application_id) {
        try {
          const path = `${appData.application_id}/${appData.file}`;
          const res = await fetch(`/api/applications/document-url?path=${encodeURIComponent(path)}`);
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error);
          setFileUrl(data.signedUrl);
        } catch (err) {
          console.error("Error fetching document URL:", err);
          setFileUrl(null);
        }
      } else {
        setFileUrl(null);
      }
    }
    getFileUrl();
  }, [appData?.file, appData?.application_id]);

  const hydrateInvoiceForm = (data: any) => {
    if (data?.invoiceDraft) {
      setInvoiceDueDate(new Date(data.invoiceDraft.due_date).toISOString().split("T")[0]);
      setInvoiceNote(data.invoiceDraft.internal_notes || "");
      
      const draftItems = (data.invoiceDraft.billing_item || []).map((item: any) => ({
        kind: mapBillingTypeToInvoiceKind(item.type),
        amount: item.amount,
        required_to_secure_slot: true,
      }));
      setInvoiceItems(draftItems.length > 0 ? draftItems : [createDefaultInvoiceItem()]);
    } else {
      setInvoiceDueDate("");
      setInvoiceNote("");
      setInvoiceItems([createDefaultInvoiceItem()]);
    }
  };

  const mapBillingTypeToInvoiceKind = (type: string): any => {
    if (type === "security_deposit") return "security_deposit";
    if (type === "reservation_fee") return "reservation_fee";
    if (type === "room_rent" || type === "first_rental") return "first_rental";
    return "other";
  };

  const createDefaultInvoiceItem = (): ApplicationInvoiceItemInput => ({
    kind: "first_rental",
    amount: 0,
    required_to_secure_slot: true,
  });

  useEffect(() => {
    if (selectedUnitId && !appData?.invoiceDraft) {
      const unit = appData?.availableUnits?.find((u: any) => u.unit_id === selectedUnitId);
      if (unit && invoiceItems.length === 1 && (invoiceItems[0].amount === 0 || !invoiceItems[0].amount)) {
        setInvoiceItems([
          {
            kind: "first_rental",
            amount: unit.rental_fee || 0,
            required_to_secure_slot: true,
          }
        ]);
      }
    }
  }, [selectedUnitId, appData?.availableUnits, appData?.invoiceDraft]);

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
      setConfirmAction(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      setLoading(false);
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
      if (appData.application_status === "pending_admin") {
        if (!selectedUnitId) {
          throw new Error("Please select a unit before sending invoice.");
        }
        await processApplication(applicationId, "approve", selectedUnitId);
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
      
      // If it was pending_admin, we close the panel because it's now pending_payment
      if (appData.application_status === "pending_admin") {
        onClose();
      }
    } catch (e) {
      setInvoiceError(e instanceof Error ? e.message : "Failed to send invoice.");
    } finally {
      setIsSendingInvoice(false);
    }
  }

  const addInvoiceItem = () => {
    setInvoiceItems((prev) => [...prev, createDefaultInvoiceItem()]);
  };

  const updateInvoiceItem = (index: number, key: keyof ApplicationInvoiceItemInput, value: any) => {
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

  if (isLoadingData) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-[#F6F8D5]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#264384] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#44291B]/60 font-bold text-sm">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-[#F6F8D5]">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">Error: Could not find application data.</p>
          <Button onClick={onClose} variant="outline" className="rounded-xl border-[#e8e2d6]">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const userData = Array.isArray(appData?.users) ? appData.users[0] : appData?.users;
  const data = {
    id: appData?.application_id || "",
    status: appData?.application_status || "Pending",
    submitted: new Date(appData.date_submitted).toLocaleDateString(),
    unit: appData.units?.unit_number || "Not assigned",
    
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
    documents: appData.file ? [{ name: "Application Document", url: fileUrl }] : [],
  };

  return (
    <div 
      key={applicationId}
      className="h-full overflow-y-auto space-y-6 px-6 py-8 bg-[#F6F8D5] scrollbar-hide"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#264384] hover:bg-transparent hover:text-[#264384] hover:underline px-0 h-auto font-bold"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to List
        </Button>
      </div>

      {/* APPLICANT INFO */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest border-b border-[#e8e2d6] pb-2">
            Applicant Information
          </h3>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e8edf7] flex items-center justify-center font-bold text-[#264384] shadow-inner text-xl">
              {data.firstName[0]}{data.lastName[0]}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#44291B] truncate">
                {data.firstName} {data.lastName}
              </h1>
              {/* <p className="text-xs font-bold text-[#44291B]/40 mb-3 uppercase tracking-tighter">
                #{data.id.slice(0, 8)}
              </p> */}

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-[10px] font-bold text-[#264384]">
                  <Mail className="w-3 h-3" />
                  {data.email}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#ebf2f4] border border-[#d1e3e8] rounded-full px-2.5 py-1 text-[10px] font-bold text-[#264384]">
                  <CalendarIcon className="w-3 h-3" />
                  {data.submitted}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STAY & DORM DETAILS */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest border-b border-[#e8e2d6] pb-2">
            Stay & Dormitory
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Dormitory</p>
              <div className="flex items-center gap-2 text-sm font-bold text-[#44291B]">
                <MapPin className="w-3 h-3 text-[#264384]" />
                {data.stay.dorm}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Duration</p>
              <p className="text-sm font-bold text-[#44291B]">{data.stay.duration}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Type</p>
              <p className="text-sm font-bold text-[#44291B] capitalize">{data.stay.roomType.replace(/_/g, ' ')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Check-in</p>
              <p className="text-sm font-bold text-[#44291B]">{data.stay.checkIn}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Check-out</p>
              <p className="text-sm font-bold text-[#44291B]">{data.stay.checkOut}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UNIT ASSIGNMENT */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest border-b border-[#e8e2d6] pb-2">
            Unit Selection
          </h3>

          <div className="space-y-4">
            {data.status === "approved" || data.status === "pending_payment" ? (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#264384] shadow-sm">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-[#264384]/60 uppercase tracking-widest">Currently Assigned</p>
                  <p className="text-sm font-bold text-[#264384]">Unit {data.unit}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest block pl-1">
                  Select Available Unit
                </label>
                <select
                  className="w-full bg-white border border-[#e8e2d6] rounded-xl px-3 py-2.5 text-sm font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/20 transition-all cursor-pointer"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                >
                  <option value="">Choose a unit...</option>
                  <optgroup label="Matching Preferred Type">
                    {(appData.availableUnits || [])
                      .filter((u: any) => u.unit_type === appData.preferred_unit_type)
                      .map((unit: any) => (
                        <option key={unit.unit_id} value={unit.unit_id}>
                          Unit {unit.unit_number} ({unit.unit_type.replace(/_/g, ' ')})
                        </option>
                      ))
                    }
                  </optgroup>
                  <optgroup label="Other Available Units">
                    {(appData.availableUnits || [])
                      .filter((u: any) => u.unit_type !== appData.preferred_unit_type)
                      .map((unit: any) => (
                        <option key={unit.unit_id} value={unit.unit_id}>
                          Unit {unit.unit_number} ({unit.unit_type.replace(/_/g, ' ')})
                        </option>
                      ))
                    }
                  </optgroup>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENTS */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest border-b border-[#e8e2d6] pb-2">
            Supporting Documents
          </h3>

          <div className="space-y-2">
            {data.documents.length > 0 ? (
              data.documents.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white border border-[#e8e2d6] rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-[#44291B]">{doc.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsPreviewOpen(true)}
                    className="text-[#264384] font-bold hover:bg-[#ebf2f4] rounded-lg gap-2"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-[#44291B]/40 text-center py-2">No documents provided.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* STATUS & ACTIONS */}
      <div className="pt-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}
        {invoiceSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold">
            {invoiceSuccess}
          </div>
        )}

        {data.status === "rejected" ? (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
            <p className="text-xs font-extrabold text-rose-600 uppercase tracking-widest">Application Rejected</p>
          </div>
        ) : data.status === "approved" || data.status === "pending_payment" ? (
          <div className="space-y-3">
            <div className={cn(
              "p-4 rounded-2xl text-center border",
              data.status === "approved" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : "bg-amber-50 border-amber-100 text-amber-600"
            )}>
              <p className="text-xs font-extrabold uppercase tracking-widest">
                {data.status === "approved" ? "✓ Fully Approved" : "✓ Waiting for Payment"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className="bg-[#264384] hover:bg-[#1e3569] text-white font-bold rounded-xl h-12 shadow-lg transition-all gap-2"
                onClick={() => {
                  setInvoiceError(null);
                  setInvoiceSuccess(null);
                  setIsInvoiceModalOpen(true);
                }}
              >
                <Receipt className="w-4 h-4" />
                {appData?.invoiceDraft ? "Manage Invoice" : "Create Invoice"}
              </Button>

              {data.status === "pending_payment" && (
                <Button
                  disabled={appData?.invoiceDraft?.status !== "paid"}
                  className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C] font-bold rounded-xl h-12 shadow-lg transition-all gap-2"
                  onClick={() => setConfirmAction("pending_payment")}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finalize Approval
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              className="bg-[#264384] hover:bg-[#1e3569] text-white font-bold rounded-xl h-12 shadow-lg transition-all"
              onClick={() => {
                setInvoiceError(null);
                setInvoiceSuccess(null);
                setIsInvoiceModalOpen(true);
              }}
            >
              Send Invoice & Approve
            </Button>
            <Button
              variant="outline"
              className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-rose-600 border-none font-bold rounded-xl h-12 transition-all"
              onClick={() => setConfirmAction("reject")}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      <Dialog open={confirmAction === "approve" || confirmAction === "pending_payment"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none bg-[#FDFFF4] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 text-[#44291B]">
            <DialogHeader className="space-y-3 text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Finalize Approval
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#44291B]/60 leading-relaxed">
                Are you sure you want to finalize the approval for {data.firstName}'s application? The payment has been verified and the tenant will be officially assigned to their unit.
              </DialogDescription>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl mt-4">
                  <p className="text-xs font-bold text-rose-600">{error}</p>
                </div>
              )}
            </DialogHeader>

            <DialogFooter className="mt-8 flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl font-bold text-[#44291B]/60 hover:bg-gray-100 h-11"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 rounded-xl font-bold text-white h-11 shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? "Processing..." : "Finalize Now"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* REJECT MODAL */}
      <Dialog open={confirmAction === "reject"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none bg-[#FDFFF4] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 text-[#44291B]">
            <DialogHeader className="space-y-3 text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner bg-rose-50 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Confirm Rejection
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#44291B]/60 leading-relaxed">
                Are you sure you want to reject {data.firstName}'s application? This action cannot be undone.
              </DialogDescription>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl mt-4">
                  <p className="text-xs font-bold text-rose-600">{error}</p>
                </div>
              )}
            </DialogHeader>

            <DialogFooter className="mt-8 flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl font-bold text-[#44291B]/60 hover:bg-gray-100 h-11"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 rounded-xl font-bold text-white h-11 shadow-lg transition-all bg-rose-600 hover:bg-rose-700"
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* INVOICE MODAL */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-2xl bg-[#FDFFF4] border-none text-[#44291B] rounded-3xl shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader className="text-left space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#264384] mb-2 shadow-inner">
                <Receipt className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Billing & Invoice</DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#44291B]/60">
                {appData.application_status === "pending_admin" 
                  ? "Assign a unit and set up the initial billing. Sending this will approve the application."
                  : "Review or update the existing billing items for this tenant."}
              </DialogDescription>
            </DialogHeader>

            {invoiceError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {invoiceError}
              </div>
            )}

            <div className="space-y-6">
              {/* Due Date & Unit Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest block pl-1">Payment Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-[#e8e2d6] rounded-xl px-3 py-2.5 text-sm font-bold text-[#44291B] outline-none"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest block pl-1">Unit Assignment</label>
                  <select
                    className="w-full bg-white border border-[#e8e2d6] rounded-xl px-3 py-2.5 text-sm font-bold text-[#44291B] outline-none disabled:opacity-50"
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    disabled={appData.application_status !== "pending_admin"}
                  >
                    <option value="">Choose Unit...</option>
                    <optgroup label="Matching Preferred Type">
                      {(appData.availableUnits || [])
                        .filter((u: any) => u.unit_type === appData.preferred_unit_type)
                        .map((u: any) => (
                          <option key={u.unit_id} value={u.unit_id}>Unit {u.unit_number} ({u.unit_type.replace(/_/g, ' ')})</option>
                        ))
                      }
                    </optgroup>
                    <optgroup label="Other Available Units">
                      {(appData.availableUnits || [])
                        .filter((u: any) => u.unit_type !== appData.preferred_unit_type)
                        .map((u: any) => (
                          <option key={u.unit_id} value={u.unit_id}>Unit {u.unit_number} ({u.unit_type.replace(/_/g, ' ')})</option>
                        ))
                      }
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Billing Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest flex items-center gap-2">
                    Billing Items
                    <Info className="w-3 h-3 cursor-help" />
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addInvoiceItem}
                    className="h-8 text-[#264384] font-bold hover:bg-blue-50 rounded-lg text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="p-4 bg-white border border-[#e8e2d6] rounded-2xl shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <select
                            className="bg-[#F6F8D5]/50 border-none rounded-lg px-2 py-1.5 text-xs font-bold text-[#44291B] outline-none"
                            value={item.kind}
                            onChange={(e) => updateInvoiceItem(index, "kind", e.target.value)}
                          >
                            <option value="first_rental">First Month Rental</option>
                            <option value="security_deposit">Security Deposit</option>
                            <option value="reservation_fee">Reservation Fee</option>
                            <option value="other">Other Fees</option>
                          </select>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#44291B]/40">₱</span>
                            <input
                              type="number"
                              className="w-full pl-5 pr-2 py-1.5 bg-[#F6F8D5]/50 border-none rounded-lg text-xs font-bold text-[#44291B] outline-none"
                              placeholder="0.00"
                              value={item.amount}
                              onChange={(e) => updateInvoiceItem(index, "amount", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`secure-${index}`}
                            checked={item.required_to_secure_slot}
                            onChange={(e) => updateInvoiceItem(index, "required_to_secure_slot", e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-[#e8e2d6] text-[#264384] focus:ring-[#264384]"
                          />
                          <label htmlFor={`secure-${index}`} className="text-[10px] font-bold text-[#44291B]/60 uppercase tracking-tight cursor-pointer">
                            Required to secure slot
                          </label>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeInvoiceItem(index)}
                        className="h-8 w-8 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest block pl-1">Internal Notes (Optional)</label>
                <textarea
                  className="w-full bg-white border border-[#e8e2d6] rounded-xl px-3 py-2 text-sm font-medium text-[#44291B] outline-none min-h-[80px]"
                  placeholder="Additional information for this invoice..."
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#e8e2d6]">
              <Button
                variant="ghost"
                className="flex-1 font-bold text-[#44291B]/60 hover:bg-gray-100 rounded-xl h-11"
                onClick={() => setIsInvoiceModalOpen(false)}
                disabled={isSendingInvoice}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 shadow-lg transition-all"
                onClick={handleSendInvoice}
                disabled={isSendingInvoice}
              >
                {isSendingInvoice ? "Sending..." : "Confirm & Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* DOCUMENT PREVIEW MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] bg-[#FDFFF4] border-none text-[#44291B] rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 border-b border-[#e8e2d6] flex-shrink-0">
            <DialogTitle className="text-xl font-bold">Document Preview</DialogTitle>
            <DialogDescription className="text-xs font-medium text-[#44291B]/60">
              Viewing supporting document for {data.firstName} {data.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 bg-white relative overflow-auto scrollbar-hide">
            {fileUrl ? (
              appData.file?.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`${fileUrl}#toolbar=0`} 
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              ) : (
                <div className="min-w-full min-h-full flex items-center justify-center p-4">
                  <img 
                    src={fileUrl} 
                    alt="Document Preview" 
                    className="max-w-full h-auto object-contain shadow-md rounded-lg"
                  />
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm font-bold text-[#44291B]/40">Loading document...</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-[#FDFFF4] border-t border-[#e8e2d6] flex justify-end flex-shrink-0">
            <Button 
              onClick={() => setIsPreviewOpen(false)}
              className="rounded-xl font-bold bg-[#264384] hover:bg-[#1e3569] text-white"
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
