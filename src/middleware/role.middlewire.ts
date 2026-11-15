import type { Request, Response, NextFunction } from "express";
import { ResMsg } from "../utils/ResMsg.js";

type UserRole = "customer" | "technician" | "admin";

const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      ResMsg(res, 401, false, "Authentication required");
      return
    }

    if (!allowedRoles.includes(user.role)) {
      ResMsg(res, 403, false, "This role is not allowed!");
    
    }

    next();
  };
};

export default authorizeRoles;