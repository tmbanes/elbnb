"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────
interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

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

type Tab = "existing" | "create";
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

  // Shared state
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Tab 1 — existing user
  const [activeTab, setActiveTab] = useState<Tab>("existing");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");

  // Tab 2 — create new
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSubmitState("idle");
    setGeneratedPassword(null);
    setCopied(false);
    setActiveTab("existing");

    if (isEditing && existingManager) {
      setSelectedUserId(existingManager.user_id);
      setOfficeLocation(existingManager.office_location ?? "");
    } else {
      setSelectedUserId("");
      setOfficeLocation("");
      setCreateForm(EMPTY_CREATE);
    }
  }, [isOpen, existingManager, isEditing]);

  // ── Fetch available users (Tab 1) ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || isEditing) return;
    fetch("/api/admin/housing/managers/available-users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => { });
  }, [isOpen, isEditing]);

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

  // ── Submit — Tab 1: assign existing user ──────────────────────────────────
  async function handleExistingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    setSubmitState("loading");
    setError(null);

    try {
      const res = await fetch("/api/admin/housing/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          office_location: officeLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitState("idle");
    }
  }

  // ── Submit — Tab 2: create new account ────────────────────────────────────
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
      onSuccess(); // refresh the list in background
    } catch (err: any) {
      setError(err.message);
      setSubmitState("idle");
    }
  }

  const loading = submitState === "loading";

  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? "Edit Property Manager"
          : activeTab === "existing"
            ? "Add Property Manager"
            : "Create Manager Account"
      }
    >
      {/* ── SUCCESS STATE (Tab 2 only) ───────────────────────────────────── */}
      {submitState === "success" && generatedPassword && (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">
              ✅ Account created successfully
            </p>
            <p className="text-xs text-green-700">
              Share this password securely with the manager. It will not be
              shown again.
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
                className={
                  copied
                    ? "border-green-400 text-green-700"
                    : ""
                }
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
              className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      )}

      {/* ── EDIT MODE (no tabs) ──────────────────────────────────────────── */}
      {isEditing && submitState !== "success" && (
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <FieldGroup>
            <Field>
              <Label htmlFor="office" className="font-semibold">
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

          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}

          <div className="flex justify-between gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}

      {/* ── CREATE MODE (with tabs) ──────────────────────────────────────── */}
      {!isEditing && submitState !== "success" && (
        <>
          {/* Tab switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab("existing");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold transition ${activeTab === "existing"
                ? "text-white bg-[#264384] hover:opacity-90"
                : "bg-background text-[#264384] hover:bg-muted"
                }`}
            >
              Existing User
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("create");
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold border-l border-border transition ${activeTab === "create"
                ? "text-white bg-[#264384] hover:opacity-90"
                : "bg-background text-[#264384] hover:bg-muted"
                }`}
            >
              Create New Account
            </button>
          </div>

          {/* ── TAB 1: Pick existing user ──────────────────────────────── */}
          {activeTab === "existing" && (
            <form onSubmit={handleExistingSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <Label className="font-semibold">
                    Select User <span className="text-destructive">*</span>
                  </Label>
                  {users.length === 0 ? (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      No users with role <strong>dormitory_manager</strong>{" "}
                      available. Use the{" "}
                      <button
                        type="button"
                        className="underline font-semibold"
                        onClick={() => setActiveTab("create")}
                      >
                        Create New Account
                      </button>{" "}
                      tab instead.
                    </div>
                  ) : (
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.first_name} {u.last_name} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>

                <Field>
                  <Label htmlFor="office-existing" className="font-semibold">
                    Office Location
                  </Label>
                  <Input
                    id="office-existing"
                    type="text"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    placeholder="e.g. Building A, Room 101"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <p className="text-xs font-medium text-destructive">{error}</p>
              )}

              <div className="flex justify-between gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedUserId || users.length === 0}
                  className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
                >
                  {loading ? "Saving..." : "Add Manager"}
                </Button>
              </div>
            </form>
          )}

          {/* ── TAB 2: Create new account ──────────────────────────────── */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-700">
                  A login account will be created. A temporary password will be
                  shown once — share it securely with the manager.
                </p>
              </div>

              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <Label className="font-semibold">
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
                    <Label className="font-semibold">
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
                  <Label className="font-semibold">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={createForm.email}
                    onChange={handleCreateFormChange}
                    required
                    placeholder="juan@elbnb.com"
                  />
                </Field>

                <Field>
                  <Label className="font-semibold">Office Location</Label>
                  <Input
                    name="office_location"
                    value={createForm.office_location}
                    onChange={handleCreateFormChange}
                    placeholder="e.g. Building A, Room 101"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <p className="text-xs font-medium text-destructive">{error}</p>
              )}

              <div className="flex justify-between gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !createForm.first_name ||
                    !createForm.last_name ||
                    !createForm.email
                  }
                  className="bg-[#78A24C] hover:bg-[#E7FAD3] text-white hover:text-[#78A24C]"
                >
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}