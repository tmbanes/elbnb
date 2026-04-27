// app/student/notifications/page.tsx
import { redirect } from "next/navigation";
import { getApiAuthenticatedUser } from "@/lib/auth/session";
import { userProfileService } from "@/services/user_profile";
import NotificationsPageUI from "@/components/notifications/NotificationsPageUI";

export const metadata = {
  title: "Notifications | Elbnb Student",
  description: "View all your notifications and activity updates.",
};

export default async function StudentNotificationsPage() {
  const user = await getApiAuthenticatedUser();
  if (!user) redirect("/onboarding");

  const { data: notifications } = await userProfileService.getNotifications(user.user_id);

  return (
    <NotificationsPageUI
      initialNotifications={notifications || []}
      role="student"
      backHref="/student/dashboard"
    />
  );
}
