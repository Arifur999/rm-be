import type { Role } from "../../generated/prisma/enums.js";

export interface IRequestUser {
    adminId: string;
    sessionId: string;
    email: string;
    role: Role;
}
