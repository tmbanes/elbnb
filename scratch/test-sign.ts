import { getSupabaseAdmin } from "./lib/supabase/admin-client";
import { ACCOMMODATION_IMAGE_BUCKET } from "./lib/utils/accommodation-images";

async function testSign() {
  const supabase = getSupabaseAdmin();
  const path = "aa51cb76-ce71-49f8-8ac4-2a29d8554ebd/ca8c5a7e-918e-4bfd-a08d-3bdad195e2d4.png";
  
  const { data, error } = await supabase.storage
    .from(ACCOMMODATION_IMAGE_BUCKET)
    .createSignedUrl(path, 3600);

  if (error) {
    console.error("Signing failed:", error);
  } else {
    console.log("Signed URL:", data?.signedUrl);
  }
}

testSign();
