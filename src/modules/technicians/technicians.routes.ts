import { Router } from "express";
import authenticateToken from "../../middleware/auth.middleware.js";
import authorizeRoles from "../../middleware/role.middlewire.js";
import tecniciansControllar from "./technicians.controllar.js";

const router=Router();
// POST: Create technician profile
router.post( "/profile",
    authenticateToken,
    authorizeRoles("technician"),tecniciansControllar.postTechnicians);

//GET: Get by Technician
router.get( "/me",
    authenticateToken,
    authorizeRoles("technician"),tecniciansControllar.getTechniciansById);

// GET: Admin views pending technician profiles
router.get(
    "/pending",
    authenticateToken,
    authorizeRoles("admin"),tecniciansControllar.getAllTechniciansByAdmin);

// PATCH: Admin verifies technician
router.patch(
    "/:id/verify",
    authenticateToken,
    authorizeRoles("admin"),tecniciansControllar.verifyTechniciansByAdmin
)


// PATCH: Update own technician profile
router.patch(
    "/me",
    authenticateToken,
    authorizeRoles("technician"),tecniciansControllar.updatedOwnTechnicianlProfile);

// GET: View all verified technicians (Public)
router.get("/",tecniciansControllar.getAllTechniciansByPublic);


const techniciansRouter=router;
export default techniciansRouter;