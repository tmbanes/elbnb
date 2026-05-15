"use client";

import React, { useState } from "react";
import { Upload, Plus, Loader2, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadZoneProps {
  onUpload: (files: FileList) => Promise<void>;
  isUploading: boolean;
  label?: string;
  className?: string;
}

export default function ImageUploadZone({
  onUpload,
  isUploading,
  label = "Add Photos or Drop Here",
  className,
}: ImageUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onUpload(e.target.files);
    }
  };

  return (
    <label
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-3 group overflow-hidden bg-white/50 backdrop-blur-sm",
        isDragActive
          ? "border-[#264384] bg-[#F6F8D5] scale-[1.02] shadow-xl"
          : "border-slate-200 hover:border-[#264384]/40 hover:bg-white hover:shadow-md",
        isUploading && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
        multiple
      />
      
      {/* Background Icon Decor */}
      <ImageIcon className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-100 group-hover:text-slate-200 transition-colors duration-500" />

      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
        isDragActive ? "bg-[#264384] text-white rotate-12 scale-110" : "bg-slate-100 text-[#264384] group-hover:bg-[#264384] group-hover:text-white"
      )}>
        {isUploading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isDragActive ? (
          <Upload className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
        )}
      </div>

      <div className="text-center px-4 relative z-10">
        <span className={cn(
          "text-[11px] font-black uppercase tracking-widest block mb-1 transition-colors",
          isDragActive ? "text-[#264384]" : "text-slate-600 group-hover:text-[#264384]"
        )}>
          {isUploading ? "Uploading..." : isDragActive ? "Drop Now" : "Upload"}
        </span>
        <span className="text-[10px] text-slate-400 font-medium block">
          {label}
        </span>
      </div>

      {/* Progress bar simulation if needed, or just the spinner */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#264384]/10">
          <div className="h-full bg-[#264384] animate-progress-indefinite" />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          0% { width: 0; left: 0; }
          50% { width: 100%; left: 0; }
          100% { width: 0; left: 100%; }
        }
        .animate-progress-indefinite {
          animation: progress 2s infinite ease-in-out;
          position: absolute;
        }
      `}</style>
    </label>
  );
}
