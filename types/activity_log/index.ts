import { UserRole } from "../user.types";

type EntityLogType = "application" | "unit" | "billing" | "auth"
                                | "document" | "accommodation" | "assignment";
type ActivityLogType = "login"
    | "logout"
    | "create_user"
    | "update_user"
    | "deactivate_user"
    | "reactivate_user"
    | "submit_application"
    | "screen_application"
    | "approve_application"
    | "reject_application"
    | "cancel_application"
    | "create_assignment"
    | "accept_assignment"
    | "override_assignment"
    | "reassign_assignment"
    | "cancel_assignment"
    | "terminate_assignment"
    | "assignment_paid"
    | "create_accomm"
    | "update_accomm"
    | "delete_accomm"
    | "generate_billing"
    | "update_billing"
    | "cancel_billing"
    | "mark_billing_paid"
    | "submit_payment"
    | "update_assignment"
    | "upload_doc"
    | "update_doc_status"
    | "generate_report";

interface LogCreationRequest {
    p_user_id: string;
    p_action_type: ActivityLogType;
    p_log_desc: string;
    p_entity_type: EntityLogType; 
    p_entity_id: string;
    p_user_role: UserRole;
}

export type {LogCreationRequest, ActivityLogType}
