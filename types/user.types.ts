type UserRole = 'student' | 'dormitory_manager' | 'housing_admin'
type UserStatus = 'active' | 'inactive' | 'deactivated';

interface UserCreationRequest {
    first_name: string;
    last_name: string;
    middle_name?: string; // Optional middle name
    email: string;
    password: string;
    role: UserRole;
    user_status: UserStatus;
}

interface User {
    user_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string; // Optional middle name
    email: string;
    role: UserRole; // [To-Do:Define the role field with the UserRole type next]
    user_status: UserStatus; 
    created_at: string; // ISO date string
}

export type { User, UserCreationRequest, UserRole, UserStatus };