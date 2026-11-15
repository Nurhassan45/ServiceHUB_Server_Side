import { Router } from "express";
import serviceControllar from "./services.controllar.js";
import authenticateToken from "../../middleware/auth.middleware.js";
import authorizeRoles from "../../middleware/role.middlewire.js";

const router=Router();
// POST: Create service (Admin only)
router.post('/',authenticateToken,authorizeRoles('admin'),serviceControllar.postService);
//Get: Get all service (Public)
router.get('/',serviceControllar.getAllService);
// GET: View a single active service (Public)
router.get('/:id',serviceControllar.getServiceById);
// PATCH: update service (Admin only)
router.patch('/:id',authenticateToken,authorizeRoles('admin'),serviceControllar.updatedService);
// DELETE: delete service (Admin only)
router.delete('/:id',authenticateToken,authorizeRoles('admin'),serviceControllar.deleteService);


const serviceRouter=router;

export default serviceRouter;