// app/admin/notifications/page.tsx
import { redirect } from "next/navigation";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { userProfileService } from "@/services/user_profile";
import NotificationsPageUI from "@/components/notifications/NotificationsPageUI";

export const metadata = {
  title: "Notifications | Elbnb Admin",
  description: "View all activity notifications across the platform.",
};

export default async function AdminNotificationsPage() {
  const user = await getApiAuthenticatedUser();
  if (!user) redirect("/onboarding");

  const { data: notifications } = await userProfileService.getNotifications(user.user_id);

  return (
    <NotificationsPageUI
      initialNotifications={notifications || []}
      role="admin"
      backHref="/admin/dashboard"
    />
  );
}
