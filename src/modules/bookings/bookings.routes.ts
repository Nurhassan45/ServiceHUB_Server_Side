import { Router } from "express";
import bookingControllar from "./bookings.controllar.js";
import authorizeRoles from "../../middleware/role.middlewire.js";
import authenticateToken from "../../middleware/auth.middleware.js";

const router=Router();
// POST: Create booking (Customer only)
router.post(
    "/",
    authenticateToken,
    authorizeRoles("customer"),bookingControllar.createBookings);
// GET: Customer views own bookings
    router.get(
    "/my-bookings",
    authenticateToken,
    authorizeRoles("customer"),bookingControllar.getOwnBookings);
// GET: Technician views assigned bookings
router.get(
    "/assigned",
    authenticateToken,
    authorizeRoles("technician"),bookingControllar.technicianAssignedBookings);

// PATCH: Technician accepts or rejects an assigned booking
router.patch(
    "/:id/respond",
    authenticateToken,
    authorizeRoles("technician"),bookingControllar.updatedAssignedBooking);

// PATCH: Technician updates booking progress
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRoles("technician"),bookingControllar.updatedBookingsProgress);
// GET: Admin views all bookings
router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin"),bookingControllar.getAllBookingsByAdmin);
// PATCH: Admin assigns a technician to a booking
router.patch(
    "/:id/assign",
    authenticateToken,
    authorizeRoles("admin"),bookingControllar.adminAssignToTechnician);

router.patch(
    "/:id/cancel",
    authenticateToken,
    authorizeRoles("customer"),
    bookingControllar.cancelOwnBooking
);
const bookingRouter=router;
export default bookingRouter;