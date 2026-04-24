"use client";

import React, { useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { createActivityLog, getCurrentUserFromApi, isUserRole } from "@/services/activity_log/browser";

export function ProfileUpload({
  initialProfileUrl,
}: {
  initialProfileUrl?: string | null;
}) {
  const [profileUrl, setProfileUrl] = useState<string | null>(
    initialProfileUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseBrowserClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to upload an image.");

      const filePath = `${user.id}/${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile_picture")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicData } = supabase.storage
        .from("profile_picture")
        .getPublicUrl(filePath);

      // Update the user's record in the database
      const { error: dbError } = await (supabase.from("users") as any)
        .update({ profile_picture_url: publicData.publicUrl })
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      setProfileUrl(publicData.publicUrl);

      // Log changes
      const profile = await getCurrentUserFromApi();
      const userRole = isUserRole(profile?.role) ? profile.role : "guest";

      if (profile?.user_id){
        await createActivityLog({
          p_user_id: profile.user_id,
          p_action_type: "update_user",
          p_log_desc: `${profile.first_name} updated profile picture`,
          p_entity_type: "auth",
          p_entity_id: profile.user_id,
          p_user_role: userRole,
        });
      }
      
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Profile Picture</h2>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Clickable avatar area */}
      <div
        className="flex flex-col items-center space-y-3 cursor-pointer group"
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {profileUrl ? (
          <img
            src={profileUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-500 transition-colors mx-auto shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-50 transition-colors mx-auto shadow-sm">
            <svg
              className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}

        <span className="text-sm text-blue-600 font-medium group-hover:underline">
          {isUploading
            ? "Uploading..."
            : profileUrl
            ? "Change picture"
            : "Click to add picture"}
        </span>
      </div>

      {/* Loading indicator */}
      {isUploading && (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Uploading your photo...</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Accepts JPG, PNG, GIF, WEBP · Max 5MB
      </p>
    </div>
  );
}
