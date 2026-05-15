"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  MoreVertical,
  Star,
  Loader2,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteConfirmationModal from "@/components/shared/DeleteConfirmationModal";
import { cn } from "@/lib/utils";

interface PropertyImage {
  id: string;
  url: string;
  is_primary: boolean;
}

interface PropertyGalleryProps {
  accommodationId: string;
}

export default function PropertyGallery({ accommodationId }: PropertyGalleryProps) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsFetching(true);
    fetch(`/api/shared/accommodation/images?accommodationId=${accommodationId}`)
      .then(r => r.json())
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(() => setImages([]))
      .finally(() => setIsFetching(false));
  }, [accommodationId]);

  const MAX_IMAGES = 25;

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArr.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const toUpload = fileArr.slice(0, remaining);

    setIsUploading(true);
    const formData = new FormData();
    formData.append("accommodationId", accommodationId);
    toUpload.forEach(f => formData.append("files", f));

    try {
      const res = await fetch("/api/shared/accommodation/images", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const newImages = await res.json();
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = "";
  };

  // Drag-and-drop handlers on the container
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  };

  const handleDeleteClick = (id: string) => {
    setImageToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shared/accommodation/images?id=${imageToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setImages(prev => {
        const wasPrimary = prev.find(img => img.id === imageToDelete)?.is_primary ?? false;
        const remaining = prev.filter(img => img.id !== imageToDelete);
        if (wasPrimary && remaining.length > 0) {
          return remaining.map((img, i) => ({ ...img, is_primary: i === 0 }));
        }
        return remaining;
      });
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setImageToDelete(null);
    }
  };

  const setPrimary = async (id: string) => {
    try {
      const res = await fetch(`/api/shared/accommodation/images/primary`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, accommodationId }),
      });
      if (!res.ok) throw new Error("Failed to set primary");
      setImages(prev => prev.map(img => ({ ...img, is_primary: img.id === id })));
    } catch (err) {
      console.error("Set primary error:", err);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center gap-2 px-1 py-4 text-[#8c8b82]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-medium">Loading gallery...</span>
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#44291B]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#44291B]">
            Property Gallery
          </p>
        </div>
        <span className="text-[10px] text-[#8c8b82] font-medium bg-[#F6F8D5] px-2.5 py-1 rounded-full border border-[#e2e4c0]">
          {images.length} {images.length === 1 ? "image" : "images"} uploaded
        </span>
      </div>

      {/* Drop Zone Overlay — shown when dragging over the whole gallery */}
      {isDragging && (
        <div className="relative rounded-2xl border-2 border-dashed border-[#264384] bg-[#F6F8D5]/60 transition-all duration-200 flex flex-col items-center justify-center gap-3 py-14">
          <div className="w-16 h-16 rounded-full bg-[#264384]/10 flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-[#264384]" />
          </div>
          <p className="text-sm font-black text-[#264384] uppercase tracking-widest">Drop photos here</p>
          <p className="text-[10px] text-[#8c8b82] font-medium">Release to upload</p>
        </div>
      )}

      {/* Image Grid */}
      {!isDragging && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(
                "relative group aspect-square rounded-2xl overflow-hidden border bg-white shadow-sm transition-all duration-300",
                image.is_primary ? "ring-2 ring-[#F59E0B] ring-offset-2 border-transparent" : "border-[#e2e4c0]"
              )}
            >
              <img
                src={image.url}
                alt="Property"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Primary Badge */}
              {image.is_primary && (
                <div className="absolute top-2 left-2 bg-[#F59E0B] p-1.5 rounded-lg">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              )}

              {/* Actions Menu */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white text-[#44291B]">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#FDFFF4] border-[#e2e4c0] rounded-xl shadow-xl">
                    {!image.is_primary && (
                      <DropdownMenuItem
                        onClick={() => setPrimary(image.id)}
                        className="gap-2 text-[#44291B] font-bold text-xs focus:bg-[#F6F8D5] cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-[#264384]" />
                        Set as Primary
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(image.id)}
                      className="gap-2 text-red-600 font-bold text-xs focus:bg-red-50 focus:text-red-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Delete Photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Add Photos card — hidden when limit reached */}
          {images.length < MAX_IMAGES && (
          <label className={cn(
            "relative aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-2 group overflow-hidden",
            isUploading
              ? "border-[#264384]/20 bg-[#F6F8D5]/20 cursor-not-allowed"
              : "border-[#e2e4c0] hover:border-[#264384]/40 hover:bg-[#F6F8D5]/40"
          )}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleInputChange}
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-[#264384] animate-spin" />
                <span className="text-[9px] font-black text-[#264384] uppercase tracking-widest">Uploading...</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-[#ebf2f4] flex items-center justify-center group-hover:bg-[#264384] transition-all duration-300 group-hover:scale-110 shadow-sm">
                  <Plus className="w-5 h-5 text-[#264384] group-hover:text-white transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-[#264384]/60 uppercase tracking-tight group-hover:text-[#264384] transition-colors">Add Photos</p>
                  <p className="text-[8px] text-slate-400 font-medium">Click or drag & drop</p>
                </div>
              </>
            )}
          </label>
          )}
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        description="Are you sure you want to delete this property photo? This will permanently remove it from the gallery."
      />
    </div>
  );
}
