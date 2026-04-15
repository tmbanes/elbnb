"use client";

import React, { useState, useEffect } from "react";
import Uppy from "@uppy/core";
import DashboardModal from "@uppy/react/dashboard-modal";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export function ProfileUpload({ initialProfileUrl }: { initialProfileUrl?: string | null }) {
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(initialProfileUrl || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    // Determine the current user immediately when component mounts
    let currentUserId: string | undefined;
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        currentUserId = data.user.id;
      }
    });

    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["image/*"],
      },
    });

    // Custom Uppy uploader function that sends the file to Supabase Storage
    uppyInstance.addUploader(async (fileIDs) => {
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("You must be logged in to upload an image.");
        }
        currentUserId = user.id;
      }

      for (const fileID of fileIDs) {
        const file = uppyInstance.getFile(fileID);

        // Upload to the profiles bucket mapping via user's ID
        const filePath = `${currentUserId}/${file.name}`;

        try {
          const { data, error } = await supabase.storage
            .from("profile_picture")
            .upload(filePath, file.data as Blob, { upsert: true });

          if (error) throw error;

          // Getting the public URL
          const { data: publicData } = supabase.storage
            .from("profile_picture")
            .getPublicUrl(filePath);

          // Update the user's database record with this new URL
          const { error: dbError } = await (supabase
            .from("users") as any)
            .update({ profile_picture_url: publicData.publicUrl })
            .eq("user_id", currentUserId);

          if (dbError) throw dbError;

          // Notify Uppy that the upload truly succeeded
          uppyInstance.emit("upload-success", file, {
            status: 200,
            body: { url: publicData.publicUrl },
            uploadURL: publicData.publicUrl,
          } as any);

          setProfileUrl(publicData.publicUrl);
          setIsModalOpen(false); // Close modal on success

        } catch (err: any) {
          console.error("Upload error fully:", err);
          if (err?.message) console.error("Error message:", err.message);
          if (err?.details) console.error("Error details:", err.details);

          uppyInstance.emit("upload-error", file, err);
        }
      }
    });

    setUppy(uppyInstance);

    return () => {
      // Clean up the Uppy instance on unmount
      uppyInstance.destroy();
    };
  }, []); // Empty dependency array to mount once

  if (!uppy) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-center items-center h-48">
        <p className="text-gray-500">Loading uploader...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Upload Profile Picture</h2>

      <div
        className="flex flex-col items-center mb-6 space-y-3 cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
      >
        {profileUrl ? (
          <img
            src={profileUrl}
            alt="Current Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-500 transition-colors mx-auto shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-blue-500 group-hover:bg-blue-50 transition-colors mx-auto shadow-sm">
            <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <span className="text-sm text-blue-600 font-medium group-hover:underline">
          {profileUrl ? "Change picture" : "Click to add picture"}
        </span>
      </div>

      <DashboardModal
        uppy={uppy}
        open={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
