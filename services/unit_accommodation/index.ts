import { Accommodation, Unit } from "@/types/accommodation_units";
import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { UserRole } from "@/types/user.types";

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const UnitAccomodationsDisplayService = {

  // lists all ACTIVE ACCOMMODATIONS with optional role-based filtering (adds property type to the Accommodation Interface)
  async listAccomodations(userRole?: UserRole): Promise<ServiceResult<Accommodation[]>> {
    try {
      const supabase = await createSupabaseServerClient()

      // Join accommodations with units to get price range
      let query = supabase
        .from('accommodation')
        .select(`
        *,
        renting_space(property_type),
        unit(
          rental_fee,
          billing_period
        ),
        accommodation_images(url, is_primary, storage_path)
      `)

        .eq('accommodation_status', 'active')
        .order('created_at', { referencedTable: 'unit', ascending: true })

      // Filter for property owners/admin
      if (userRole && userRole !== 'student') {
        query = query.eq('accommodation_type', 'renting_space')
      }

      const { data, error } = await query
      if (error) return { data: null, error: error.message }

      // Flatten and calculate price range
      const flattened = (data ?? []).map((a: any) => {
        const units = a.unit || []

        // Calculate min and max price
        const prices = units
          .map((u: any) => u.rental_fee)
          .filter((p: any) => p && typeof p === 'number' && p > 0)

        const minPrice = prices.length > 0 ? Math.min(...prices) : null
        const maxPrice = prices.length > 0 ? Math.max(...prices) : null

        // Get cheapest unit's billing period (if any)
        const cheapestUnit = units.find((u: any) => u.rental_fee === minPrice && u.billing_period)
        const billingPeriod = cheapestUnit?.billing_period || null

        // Flatten renting_space property_type or use the new direct column
        let propertyType = a.property_type;
        if (!propertyType) {
          if (Array.isArray(a.renting_space)) {
            propertyType = a.renting_space[0]?.property_type ?? null;
          } else {
            propertyType = a.renting_space?.property_type ?? null;
          }
        }

        // Use accommodation_images as the primary source if available
        let displayImage = a.image;
        let allImages: string[] = [];
        
        if (a.accommodation_images && a.accommodation_images.length > 0) {
          // Sort images so primary is first
          const sortedImgs = [...a.accommodation_images].sort((x, y) => (y.is_primary ? 1 : 0) - (x.is_primary ? 1 : 0));
          allImages = sortedImgs.map((img: any) => img.storage_path || img.url);
          
          const primary = a.accommodation_images.find((img: any) => img.is_primary) || a.accommodation_images[0];
          displayImage = primary.storage_path || primary.url;
        } else if (displayImage) {
          allImages = [displayImage];
        }

        return {
          ...a,
          image: displayImage,
          images: allImages,
          property_type: propertyType,
          min_price: minPrice,
          max_price: maxPrice,
          billing_period: billingPeriod,
          // Don't need to expose nested objects
          unit: undefined,
          renting_space: undefined,
          accommodation_images: undefined,
        }


      })

      return { data: flattened as Accommodation[], error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  },

  // list all ACTIVE UNITS for a given ACCOMMODATION input
  async listUnitsForAccomodation(
    accommodationId: string,
    supabaseClient?: SupabaseClient
  ): Promise<ServiceResult<Unit[]>> {
    try {
      const supabase = supabaseClient || (await createSupabaseServerClient());
      const { data, error } = await supabase
        .from("unit")
        .select("*")
        .eq("accommodation_id", accommodationId)
        .eq("unit_status", "active");

      if (error) {
        return { data: null, error: error.message };
      }
      return { data: data as Unit[], error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },

  // list all ACTIVE UNITS (no accommodation filter)
  async listUnits(
    accommodationId: string,
    supabaseClient?: SupabaseClient
  ): Promise<ServiceResult<Unit[]>> {
    try {
      const supabase = supabaseClient || (await createSupabaseServerClient());
      const { data, error } = await supabase
        .from("unit")
        .select("*")
        .eq("unit_status", "active");

      if (error) {
        return { data: null, error: error.message };
      }
      return { data: data as Unit[], error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },

};

