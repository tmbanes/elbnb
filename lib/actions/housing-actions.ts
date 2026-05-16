"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin-client";
import {
  ACCOMMODATION_IMAGE_BUCKET,
  accommodationImageStoragePath,
} from "@/lib/utils/accommodation-images";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24 hours

async function signAccommodationImage(storagePath: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase.storage
    .from(ACCOMMODATION_IMAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Failed to sign image URL");
  }

  return data.signedUrl;
}


/** Returns a browser-ready URL (signed or legacy absolute URL). */
export async function resolveAccommodationImageDisplayUrl(
  urlOrPath: string | null | undefined
): Promise<string | null> {
  if (!urlOrPath) return null;
  
  // If it's a full URL, only return as is if it's NOT a Supabase storage URL
  if (/^https?:\/\//i.test(urlOrPath) && !urlOrPath.includes(".supabase.co/storage/v1/object/")) {
    return urlOrPath;
  }


  const storagePath = accommodationImageStoragePath(urlOrPath);
  
  // If it's a known storage path or a UUID-like path, sign it
  const isStoragePath = storagePath.startsWith("accommodations/") || 
                        /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(storagePath) ||
                        storagePath.includes("/");

  if (!isStoragePath) return null;
  try {
    return await signAccommodationImage(storagePath);
  } catch (error) {
    console.warn(`[resolveAccommodationImageDisplayUrl] Signing failed for ${storagePath}:`, error);
    // Return original URL if it's already an absolute URL, otherwise return null to avoid broken links
    return /^https?:\/\//i.test(urlOrPath) ? urlOrPath : null;
  }
}


/** @deprecated Use resolveAccommodationImageDisplayUrl */
export async function getAccommodationImageSignedUrl(
  urlOrPath: string | null | undefined
): Promise<string | null> {
  return resolveAccommodationImageDisplayUrl(urlOrPath);
}

export async function withResolvedAccommodationImages<
  T extends { image?: string | null; images?: string[] | null; url?: string | null },
>(accommodations: T[]): Promise<T[]> {
  return Promise.all(
    accommodations.map(async (acc) => {
      // Resolve either 'image' or 'url' property
      const targetPath = acc.image || acc.url;
      const resolved = targetPath 
        ? await resolveAccommodationImageDisplayUrl(targetPath).catch(() => null) 
        : null;
        
      const images = acc.images 
        ? await Promise.all(
            acc.images.map((img) => 
              resolveAccommodationImageDisplayUrl(img).catch(() => null)
            )
          ) 
        : null;
        
      return { 
        ...acc, 
        image: resolved ?? acc.image ?? null,
        url: resolved ?? acc.url ?? null,
        images: (images?.filter(Boolean) as string[]) ?? acc.images ?? null
      };

    })
  );
}




export async function uploadAccommodationImage(formData: FormData) {
  const file = formData.get("file") as File;
  const accommodationId = formData.get("accommodationId") as string;

  if (!file || !accommodationId) {
    throw new Error("Missing file or accommodationId");
  }

  const supabase = getSupabaseAdmin();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `accommodations/${accommodationId}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(ACCOMMODATION_IMAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage Error:", error);
    throw new Error(`Storage Error: ${error.message}`);
  }

  const { data: accommodation } = await supabase
    .from("accommodation")
    .select("image")
    .eq("accommodation_id", accommodationId)
    .single();

  if (!accommodation?.image) {
    await supabase
      .from("accommodation")
      .update({ image: filePath })
      .eq("accommodation_id", accommodationId);
  }

  const signedUrl = await signAccommodationImage(filePath);
  return { signedUrl, fileName, path: filePath };
}

export async function deleteAccommodationImage(accommodationId: string, fileName: string) {
  if (!accommodationId || !fileName) {
    throw new Error("Missing accommodationId or fileName");
  }

  const supabase = getSupabaseAdmin();
  const filePath = `accommodations/${accommodationId}/${fileName}`;

  const { error } = await supabase.storage
    .from(ACCOMMODATION_IMAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("Storage Delete Error:", error);
    throw new Error(error.message);
  }

  const { data: accommodation } = await supabase
    .from("accommodation")
    .select("image")
    .eq("accommodation_id", accommodationId)
    .single();

  const storedPath = accommodationImageStoragePath(accommodation?.image ?? "");

  if (storedPath === filePath) {
    const { data: files } = await supabase.storage
      .from(ACCOMMODATION_IMAGE_BUCKET)
      .list(`accommodations/${accommodationId}`);

    let newImage: string | null = null;
    if (files && files.length > 0) {
      newImage = `accommodations/${accommodationId}/${files[0].name}`;
    }

    await supabase
      .from("accommodation")
      .update({ image: newImage })
      .eq("accommodation_id", accommodationId);
  }

  return { success: true };
}

export async function setPrimaryImage(accommodationId: string, imageUrl: string) {
  if (!accommodationId || !imageUrl) {
    throw new Error("Missing accommodationId or imageUrl");
  }

  const storagePath = accommodationImageStoragePath(imageUrl);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("accommodation")
    .update({ image: storagePath })
    .eq("accommodation_id", accommodationId);

  if (error) {
    console.error("Set Primary Image Error:", error);
    throw new Error(error.message);
  }

  return { success: true };
}

export async function listAccommodationImages(accommodationId: string) {
  if (!accommodationId) {
    throw new Error("Missing accommodationId");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(ACCOMMODATION_IMAGE_BUCKET)
    .list(`accommodations/${accommodationId}`);

  if (error) {
    console.error("List Images Error:", error);
    throw new Error(error.message);
  }

  if (!data?.length) return [];

  const imageFiles = data.filter(
    (file) => file.name && file.id && !file.name.startsWith(".")
  );

  const urls = await Promise.all(
    imageFiles.map((file) =>
      signAccommodationImage(`accommodations/${accommodationId}/${file.name}`)
    )
  );

  return urls;
}
