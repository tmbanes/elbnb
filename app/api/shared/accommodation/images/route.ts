import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { v4 as uuidv4 } from "uuid";

const BUCKET = "accommodation_image";


export async function GET(req: NextRequest) {
  const accommodationId = req.nextUrl.searchParams.get("accommodationId");
  if (!accommodationId) {
    return NextResponse.json({ error: "Missing accommodationId" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from("accommodation_images")
      .select("id, url, is_primary, storage_path")
      .eq("accommodation_id", accommodationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Resolve images to signed URLs for the private bucket
    const { withResolvedAccommodationImages } = await import("@/lib/actions/housing-actions");
    const resolvedData = await withResolvedAccommodationImages(data ?? []);

    return NextResponse.json(resolvedData);

  } catch (err) {
    console.error("Fetch images error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const accommodationId = formData.get("accommodationId") as string;
    const files = formData.getAll("files") as File[];

    if (!accommodationId || files.length === 0) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const supabase = supabaseAdmin;
    const uploadedImages = [];

    for (const file of files) {
      const fileUuid = uuidv4();
      const ext = file.name.split(".").pop();
      const fileName = `${fileUuid}.${ext}`;
      const storagePath = `${accommodationId}/${fileName}`;
      const bytes = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, bytes, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("Storage upload failed:", uploadError.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const url = publicUrlData.publicUrl;

      // Check if this is the first image to make it primary
      const { count } = await supabase
        .from("accommodation_images")
        .select("*", { count: "exact", head: true })
        .eq("accommodation_id", accommodationId);

      const { data: imgData, error: dbError } = await supabase
        .from("accommodation_images")
        .insert({
          accommodation_id: accommodationId,
          url: url,
          is_primary: count === 0,
          storage_path: storagePath
        })
        .select()
        .single();

      if (dbError) {
        console.error("DB insert failed:", dbError.message);
        continue;
      }
      uploadedImages.push(imgData);
    }

    // Resolve newly uploaded images to signed URLs
    const { withResolvedAccommodationImages } = await import("@/lib/actions/housing-actions");
    const resolvedUploadedImages = await withResolvedAccommodationImages(uploadedImages);

    return NextResponse.json(resolvedUploadedImages);
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = supabaseAdmin;

    // Get storage path before deleting from DB
    const { data: img, error: fetchError } = await supabase
      .from("accommodation_images")
      .select("storage_path, is_primary, accommodation_id")
      .eq("id", id)
      .single();

    if (fetchError || !img) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([img.storage_path]);

    if (storageError) {
      console.warn("Storage removal failed:", storageError.message);
    }

    // Delete from DB
    const { error: dbError } = await supabase
      .from("accommodation_images")
      .delete()
      .eq("id", id);

    if (dbError) throw new Error(dbError.message);

    // If we deleted the primary image, set another one as primary if available
    if (img.is_primary) {
      const { data: nextImg } = await supabase
        .from("accommodation_images")
        .select("id")
        .eq("accommodation_id", img.accommodation_id)
        .limit(1)
        .single();

      if (nextImg) {
        await supabase
          .from("accommodation_images")
          .update({ is_primary: true })
          .eq("id", nextImg.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Image delete error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
