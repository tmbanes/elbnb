import { redirect } from 'next/navigation';
import { getApiAuthenticatedUser } from '@/lib/auth/session';

export default async function AuthCallbackPage() {
  const user = await getApiAuthenticatedUser();

  if (!user) {
    redirect('/');
  }

  // Check if profile is complete
  if (!(user as any).is_profile_complete) {
    redirect('/complete-profile');
  }

  // Route to specific dashboards based on role
  if (user.role === 'student') redirect('/student/dashboard');
  if (user.role === 'dormitory_manager') redirect('/manager/dashboard');
  if (user.role === 'housing_admin') redirect('/admin/dashboard');
  if (user.role === 'guest') redirect('/guest/dashboard');

  // Fallback if role is unknown but they are logged in
  redirect('/');
}
