"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { DialogFooter } from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingManager?: {
    employee_id: string;
    user_id: string;
    office_location: string;
  } | null;
}

type SubmitState = "idle" | "loading" | "success";

const EMPTY_CREATE = {
  first_name: "",
  last_name: "",
  email: "",
  office_location: "",
};

// ── Component ──────────────────────────────────────────────────────────────
export default function AddManagerModal({
  isOpen,
  onClose,
  onSuccess,
  existingManager,
}: Props) {
  const isEditing = !!existingManager;

  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [officeLocation, setOfficeLocation] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSubmitState("idle");
    setGeneratedPassword(null);
    setCopied(false);

    if (isEditing && existingManager) {
      setOfficeLocation(existingManager.office_location ?? "");
    } else {
      setOfficeLocation("");
      setCreateForm(EMPTY_CREATE);
    }
  }, [isOpen, existingManager, isEditing]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleCreateFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCopy() {
    if (!generatedPassword) return;
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Submit — Edit ──────────────────────────────────────────────────────────
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!existingManager) return;
    setSubmitState("loading");
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/housing/managers?id=${existingManager.employee_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerFields: { office_location: officeLocation },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitState("idle");
    }
  }

  // ── Submit — Create new account ────────────────────────────────────────────
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { first_name, last_name, email, office_location } = createForm;
    if (!first_name || !last_name || !email) return;

    setSubmitState("loading");
    setError(null);

    try {
      const res = await fetch("/api/admin/housing/managers/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email, office_location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Account creation failed");

      setGeneratedPassword(data.generated_password);
      setSubmitState("success");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setSubmitState("idle");
    }
  }

  const loading = submitState === "loading";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Property Manager" : "Create Manager Account"}
    >
      {/* ── SUCCESS STATE ── */}
      {submitState === "success" && generatedPassword && (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">
              ✅ Account created successfully
            </p>
            <p className="text-xs text-green-700">
              Share this password securely with the manager. It will not be shown again.
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1 block">
              Generated Password
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono tracking-widest text-foreground">
                {generatedPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className={copied ? "border-green-400 text-green-700" : ""}
              >
                {copied ? "✓ Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-700">
              ⚠️ Remind the manager to change their password on first login.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={onClose}
              className="bg-[#78A24C] hover:!bg-[#E7FAD3] text-white hover:!text-[#78A24C]"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {isEditing && submitState !== "success" && (
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <Label htmlFor="office" className="font-semibold text-[#44291B]">
                Office Location
              </Label>
              <Input
                id="office"
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="e.g. Building A, Room 101"
              />
            </Field>
          </FieldGroup>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#5591AB] hover:!bg-[#467a8f] text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      )}

      {/* ── CREATE MODE ── */}
      {!isEditing && submitState !== "success" && (
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="rounded-lg bg-[#5273BC] border border-[#264384] p-3">
            <p className="text-xs text-[#264384]">
              A login account will be created. A temporary password will be
              shown once — share it securely with the manager.
            </p>
          </div>

          <FieldGroup>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Field>
                <Label className="font-semibold text-[#44291B]">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  name="first_name"
                  value={createForm.first_name}
                  onChange={handleCreateFormChange}
                  required
                  placeholder="Juan"
                />
              </Field>
              <Field>
                <Label className="font-semibold text-[#44291B]">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  name="last_name"
                  value={createForm.last_name}
                  onChange={handleCreateFormChange}
                  required
                  placeholder="dela Cruz"
                />
              </Field>
            </div>

            <Field>
              <Label className="font-semibold text-[#44291B]">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                name="email"
                type="email"
                value={createForm.email}
                onChange={handleCreateFormChange}
                required
                placeholder="juan@example.com"
              />
            </Field>

            <Field>
              <Label className="font-semibold text-[#44291B]">Office Location</Label>
              <Input
                name="office_location"
                value={createForm.office_location}
                onChange={handleCreateFormChange}
                placeholder="e.g. Building A, Room 101"
              />
            </Field>
          </FieldGroup>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !createForm.first_name || !createForm.last_name || !createForm.email}
              className="bg-[#78A24C] hover:!bg-[#E7FAD3] text-white hover:!text-[#78A24C]"
            >
              {loading ? "Creating..." : "Create Account"}
    
            </Button>
          </DialogFooter>
        </form>
      )}
    </Modal>
  );
}