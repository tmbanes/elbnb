import { redirect } from 'next/navigation'
import { ProfileComponent } from '@/components/ui/profile-component'
import { getApiAuthenticatedUser } from '@/lib/auth/session'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'

export default async function ManagerProfilePage() {
  const user = await getApiAuthenticatedUser()
  if (!user) redirect("/");
  if (user.role !== "dormitory_manager") redirect("/");

  const supabase = await createSupabaseServerClient();
  const { data: dbMetadata } = await supabase
    .from('dormitory_manager')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

  const mergedMetadata = {
    ...(user || {}),
    ...(dbMetadata || {})
  };

  let managerAccommodation = null;
  if (dbMetadata?.accommodation_id) {
    const { data: accom } = await supabase
      .from('accommodation')
      .select('*')
      .eq('accommodation_id', dbMetadata.accommodation_id)
      .single();
    managerAccommodation = accom;
  }

  return (
    <main>
      <ProfileComponent
        user={user}
        metadata={mergedMetadata}
        managerAccommodation={managerAccommodation}
      />
    </main>
  )
}
