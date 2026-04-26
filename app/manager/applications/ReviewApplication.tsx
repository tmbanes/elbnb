import ApplicationPreview from "@/app/admin/applications/ApplicationPreview";
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
import { ChevronLeft, Mail, Calendar as CalendarIcon, MapPin, User as UserIcon, AlertTriangle, CheckCircle2, FileText, ExternalLink } from "lucide-react"

import {
  type Application,
  type ManagerAction,
} from "@/lib/actions/manager-application-actions";

import { Unit } from "@/types/accommodation_units";
import { cn } from "@/lib/utils/ui-utils";

export default function ReviewApplication({
    application,
    applicationId,
    units,
    onAction,
    onClose,
}: {
    application: Application;
    applicationId: string;
    units: Unit[];
    onAction: (id: string, action: ManagerAction, unitId?: string) => Promise<void>;
    onClose: () => void;
}) {
  const [confirmAction, setConfirmAction] = useState<ManagerAction | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getFileUrl() {
      if (application.file && application.application_id) {
        const supabase = getSupabaseBrowserClient();
        
        console.log("DEBUG: Requesting signed URL for path:", `${application.application_id}/${application.file}`);
        const { data, error } = await supabase.storage
          .from("application_documents")
          .createSignedUrl(`${application.application_id}/${application.file}`, 1200);
        
        if (error) {
          console.error("Error creating signed URL:", error);
          setFileUrl(null);
        } else {
          console.log("DEBUG: Signed URL generated successfully");
          setFileUrl(data.signedUrl);
        }
      } else {
        setFileUrl(null);
      }
    }
    getFileUrl();
  }, [application.file, application.application_id]);

  if (!application) {
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

  async function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction === "forward" && !selectedUnitId) {
      setError("Please select a unit before forwarding.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onAction(
        applicationId,
        confirmAction,
        confirmAction === "forward" ? selectedUnitId : undefined,
      );
      setConfirmAction(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      setLoading(false);
    }
  }

  const userData = Array.isArray(application?.users) ? application.users[0] : application?.users;

  const data = {
    id: application?.application_id || "",
    status: application?.application_status || "Pending",
    submitted: new Date(application.date_submitted).toLocaleDateString(),
    
    firstName: userData?.first_name || "Unknown",
    lastName: userData?.last_name || "",
    email: userData?.email || "No email",

    stay: {
      duration: `${application.duration_of_stay} months`,
      checkIn: application.check_in,
      checkOut: application.check_out,
      companions: application.number_of_companions || "Solo",
      roomType: application.preferred_unit_type,
    },

    documents: application.file ? [{ name: "Application Document", url: fileUrl }] : [],
    history: [
      `Application Submitted - ${new Date(application.date_submitted).toLocaleDateString()}`,
    ],
  };

  return (
    <div 
      key={applicationId}
      className="h-full overflow-y-auto space-y-6 px-6 py-8 bg-[#F6F8D5] scrollbar-hide animate-in slide-in-from-right duration-300 ease-in-out"
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

      {/* STUDENT INFO CARD */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
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
              <p className="text-xs font-bold text-[#44291B]/40 mb-3 uppercase tracking-tighter">
                #{data.id.slice(0, 8)}
              </p>

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

      {/* STAY DETAILS CARD */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest border-b border-[#e8e2d6] pb-2">
            Stay Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Duration</p>
              <p className="text-sm font-bold text-[#44291B]">{data.stay.duration}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Companions</p>
              <p className="text-sm font-bold text-[#44291B]">{data.stay.companions}</p>
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

      {/* ASSIGNMENT CARD */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest border-b border-[#e8e2d6] pb-2">
            Unit Assignment
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest">Preferred Type</p>
              <p className="text-sm font-bold text-[#44291B] capitalize">{data.stay.roomType.replace(/_/g, ' ')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-[#44291B]/40 uppercase tracking-widest block pl-1">
                Assign Unit
              </label>
              <select
                className="w-full bg-white border border-[#e8e2d6] rounded-xl px-3 py-2.5 text-sm font-bold text-[#44291B] outline-none focus:ring-2 focus:ring-[#264384]/20 transition-all cursor-pointer"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
              >
                <option value="">Select a unit...</option>
                {units.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>
                    Unit {unit.unit_number} ({unit.unit_type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENTS CARD */}
      <Card className="bg-[#FDFFF4] border-[#e8e2d6] shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-[#44291B]/40 uppercase tracking-widest border-b border-[#e8e2d6] pb-2">
            Documents
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
                    onClick={() => doc.url && window.open(doc.url, "_blank")}
                    className="text-[#264384] font-bold hover:bg-[#ebf2f4] rounded-lg gap-2"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm font-medium text-[#44291B]/40 text-center py-2">No documents uploaded.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <ApplicationPreview onClose={() => setShowPreview(false)} />
      )}

      {/* ACTIONS */}
      <div className="pt-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            className="bg-[#264384] hover:bg-[#1e3569] text-white font-bold rounded-xl h-12 shadow-lg transition-all"
            onClick={() => setConfirmAction("forward")}
          >
            Forward to Admin
          </Button>
          <Button
            variant="outline"
            className="bg-[#FEE2E2] hover:bg-[#FCA5A5] text-rose-600 border-none font-bold rounded-xl h-12 transition-all"
            onClick={() => setConfirmAction("reject")}
          >
            Reject
          </Button>
        </div>
      </div>

      {/* FORWARD CONFIRMATION MODAL */}
      <Dialog open={confirmAction === "forward"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none bg-[#FDFFF4] p-0 overflow-hidden shadow-2xl">
          <div className="p-8">
            <DialogHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner bg-blue-50 text-[#264384]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-[#44291B] tracking-tight">
                Confirm Forward Application to Admin
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#44291B]/60 leading-relaxed">
                You are about to forward this application to the housing admin for final approval. Please verify the details below.
              </DialogDescription>

              <div className="mt-4 p-4 bg-[#F6F8D5] rounded-2xl border border-[#e8e2d6] space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between text-xs">
                  <span className="text-[#44291B]/50 font-bold uppercase tracking-widest">Applicant</span>
                  <span className="text-[#44291B] font-bold">{data.firstName} {data.lastName}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-[#e8e2d6]/50">
                  <span className="text-[#44291B]/50 font-bold uppercase tracking-widest">Assigned Unit</span>
                  <span className="text-[#264384] font-extrabold">
                    Unit {units.find(u => u.unit_id === selectedUnitId)?.unit_number || "Not Selected"}
                  </span>
                </div>
              </div>
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
                className="flex-1 rounded-xl font-bold text-white h-11 shadow-lg transition-all bg-[#264384] hover:bg-[#1e3569]"
                disabled={loading}
              >
                {loading ? "Processing..." : "Forward Application"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* REJECT CONFIRMATION MODAL */}
      <Dialog open={confirmAction === "reject"} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none bg-[#FDFFF4] p-0 overflow-hidden shadow-2xl">
          <div className="p-8">
            <DialogHeader className="space-y-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner bg-rose-50 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-bold text-[#44291B] tracking-tight">
                Confirm Application Rejection
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-[#44291B]/60 leading-relaxed">
                Are you sure you want to reject {data.firstName}'s application? This action will notify the applicant and cannot be undone.
              </DialogDescription>
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
    </div>
  );
}
