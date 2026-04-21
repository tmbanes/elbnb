// dashboard/history/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { redirect } from "next/navigation"
import { studentProfileService } from "@/services/student_profile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CancelApplicationModal } from "./cancel-modal"

// Helper to format enum values into clean text (e.g., "pending_dorm_manager" -> "Pending Dorm Manager")
function formatStatusLabel(status: string) {
  if (!status) return "Unknown";
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Helper to assign the right badge color based on your specific enum values
function getBadgeVariant(status: string) {
  switch(status) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'secondary'; // Covers pending_admin, pending_payment, pending_dorm_manager
  }
}

export default async function AccommodationHistoryPage() {
  // Initialize Supabase server client
  const supabase = await createSupabaseServerClient();
  
  // Fetch the current active user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Protect the route: If no one is logged in, redirect them to the onboarding page
  if (!user || authError) {
    redirect("/onboarding"); 
  }

  // NOTE: THIS IS TEMPORARY HARDCODED USER ID FOR TESTING PURPOSES ONLY. REMOVE ONCE EVERTYHING IS GOOD
  //const tempUserId = "817d78b5-b102-4db2-b54b-61a952b0224e"; // stel's test account (thanks stel)
  // const tempUserId = "4bc89946-5a5c-4810-8839-afca74efdadb"; // my test account
  // const userId = tempUserId; 

  const userId = user.id; // uncomment this when you want to use actual logged-in user ID

  const { data: records, error } = await studentProfileService.getAccommodationHistory(userId);

  if (error) {
    return <div className="p-6 text-red-500">Error loading data: {error.message}</div>;
  }

  if (!records || records.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-8 max-w-5xl">
         <div>
          <h1 className="text-3xl font-bold tracking-tight">Accommodation History & Status</h1>
          <p className="text-muted-foreground mt-2">Track your current application status and view your past assignments.</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No accommodation history found.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Define statuses that mean an application is "active"
  const activeStatuses = ['pending_admin', 'pending_dorm_manager', 'pending_payment', 'approved'];

  // Try to find the newest application that is ACTIVE
  let currentApplication = records.find(record => activeStatuses.includes(record.application_status));

  if (!currentApplication) { // If there are NO active applications (all are cancelled/rejected), default to the absolute newest record
    currentApplication = records[0];
  }

  // Create the history list by excluding the one we picked as "current"
  const historicalRecords = records.filter(record => record.application_id !== currentApplication?.application_id);
  
  // We check if the status includes "pending" to know if we should show the cancel button
  const currentStatus = currentApplication.application_status || 'unknown';
  const isPending = currentStatus.includes('pending');

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accommodation History & Status</h1>
        <p className="text-muted-foreground mt-2">
          Track your current application status and view your past assignments.
        </p>
      </div>

      {/* CARD 1: Status Application */}
      <Card>
        <CardHeader>
          <CardTitle>Current Application</CardTitle>
          <CardDescription>Details of your most recent housing request.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border p-4 rounded-lg bg-muted/50">
            <div className="space-y-1">
              {isPending ? (
                <>
                  <p className="font-medium">Date Submitted: <span className="font-normal">{new Date(currentApplication.date_submitted).toLocaleDateString()}</span></p>
                  <p className="font-medium">Dormitory: <span className="font-normal">{currentApplication.preferred_accommodation}</span></p>
                  <p className="font-medium">Room Type: <span className="font-normal">{currentApplication.preferred_unit_type}</span></p>
                </>
              ) : (
                <>
                  <p className="font-medium">Dormitory: <span className="font-normal">{currentApplication.preferred_accommodation}</span></p>
                  <p className="font-medium">Move-in Date: <span className="font-normal">{currentApplication.accomodation_assignment?.move_In_Date ? new Date(currentApplication.accomodation_assignment.move_In_Date).toLocaleDateString() : 'TBA'}</span></p>
                  <p className="font-medium">Expected Move-out: <span className="font-normal">{currentApplication.accomodation_assignment?.expected_Move_Out_Date ? new Date(currentApplication.accomodation_assignment.expected_Move_Out_Date).toLocaleDateString() : 'TBA'}</span></p>
                </>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <Badge variant={getBadgeVariant(currentStatus)} className="text-sm px-3 py-1">
                Status: {formatStatusLabel(currentStatus)}
              </Badge>
              
              {/* Cancel Button - Only visible if it's in any 'pending' state */}
              {isPending && (
                <CancelApplicationModal applicationId={currentApplication.application_id} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: Accommodation History */}
      <Card>
        <CardHeader>
          <CardTitle>Accommodation History</CardTitle>
          <CardDescription>A complete log of your historical housing records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Dormitory</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actual Move-out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalRecords.length > 0 ? (
                historicalRecords.map((record) => {
                  const status = record.application_status || 'unknown';
                  return (
                    <TableRow key={record.application_id}>
                      <TableCell className="font-medium text-xs">{record.application_id}</TableCell>
                      <TableCell>{new Date(record.date_submitted).toLocaleDateString()}</TableCell>
                      <TableCell>{record.preferred_accommodation}</TableCell>
                      <TableCell>{record.preferred_unit_type}</TableCell>
                      <TableCell>
                         <Badge variant={getBadgeVariant(status)}>
                           {formatStatusLabel(status)}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.accomodation_assignment?.actual_Move_Out_Date 
                          ? new Date(record.accomodation_assignment.actual_Move_Out_Date).toLocaleDateString() 
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No historical records available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}