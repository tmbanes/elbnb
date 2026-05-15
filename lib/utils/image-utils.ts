export const STORAGE_URL = "https://cywurzembhxgwqvpsrlh.supabase.co/storage/v1/object/public";

export function formatImageUrl(url: string | null | undefined): string {
    if (!url) return "";
    
    // If it's already a full URL or a relative local path, return it
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
        return url;
    }
    
    // Determine the bucket based on the path
    let bucket = "accommodation_image";
    
    // Only use profile_picture bucket for paths that don't look like accommodation assets
    // (Accommodation assets are either in accommodations/ folder or start with a UUID)
    if (!url.startsWith("accommodations/") && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(url)) {
        bucket = "profile_picture";
    }

    
    return `${STORAGE_URL}/${bucket}/${url}`;


}

