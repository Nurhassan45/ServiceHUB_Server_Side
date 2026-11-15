
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { ResMsg } from "../utils/ResMsg.js";

const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            ResMsg(res,401,false,"Access token required");
        }

        // 2. Extract token
        const token = authHeader?.split(" ")[1];

        // 3. Check JWT secret
        const jwtSecret = 'Rabbi01855452494';

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is missing");
        }

        // 4. Verify token
        const decoded = jwt.verify(token as string, jwtSecret);

        if (typeof decoded === "string") { ResMsg(res,401,false,"Invalid token");}

        const payload = decoded as JwtPayload;

        // 5. Validate user information
        const validRoles = ["customer", "technician", "admin"];

        if (
            typeof payload.id !== "string" ||
            !validRoles.includes(payload.role)
        )  ResMsg(res,401,false,"Invalid token payload");

        // 6. Attach user information to request
        req.user = {
            id: payload.id,
            role: payload.role as "customer" | "technician" | "admin"
        };

        // 7. Allow the next middleware or route
        next();

    } catch (error:any) {
        ResMsg(res,401,false,error.message);
    }
};

export default authenticateToken;
