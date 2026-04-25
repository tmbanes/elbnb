import { NextRequest, NextResponse } from "next/server";
import { getApiAuthenticatedUser } from "./session";
import { UserRole, User } from "@/types/user.types";

type ApiHandler = (
    req: NextRequest,
    context: { user: User; params: any }
) => Promise<NextResponse>;

/**
 * A Higher Order Function to protect API routes with role-based access control.
 * It eliminates auth boilerplate and provides a typed user object to the handler.
 * 
 * @param allowedRoles - Array of roles allowed to access this route
 * @param handler - The actual API route logic
 */
export function withRole(allowedRoles: UserRole[], handler: ApiHandler) {
    return async (req: NextRequest, { params }: { params: any }) => {
        try {
            const user = await getApiAuthenticatedUser();

            // Check if user is authenticated
            if (!user) {
                return NextResponse.json(
                    { error: "Unauthorized: Please log in." },
                    { status: 401 }
                );
            }

            // Check if user has a valid role
            if (!user.role || !allowedRoles.includes(user.role)) {
                return NextResponse.json(
                    { error: "Forbidden: You do not have permission to access this resource." },
                    { status: 403 }
                );
            }

            // Execution only reaches here if auth and role checks pass
            return await handler(req, { user, params });
        } catch (error: any) {
            console.error("API Guard Error:", error);
            return NextResponse.json(
                { error: "Internal Server Error" },
                { status: 500 }
            );
        }
    };
}
