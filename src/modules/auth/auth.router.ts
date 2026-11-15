import { Router, type Request, type Response } from "express";
import authControllar from "./auth.controllar.js";
import authenticateToken from "../../middleware/auth.middleware.js";
import authorizeRoles from "../../middleware/role.middlewire.js";

const router =Router();
router.post('/register',authControllar.createUser);
router.post('/login',authControllar.loginUser);
router.get("/me", authenticateToken,authorizeRoles("customer"), (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Authenticated user",
        user: req.user
    });
});
const authRouter=router;
export default authRouter;