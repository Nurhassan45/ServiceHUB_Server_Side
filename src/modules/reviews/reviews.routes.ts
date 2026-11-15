import { Router } from "express";

import authorizeRoles from "../../middleware/role.middlewire.js";
import authenticateToken from "../../middleware/auth.middleware.js";
import reviewControllar from "./review.controllar.js";

const router=Router();
// 1. Customer creates a review
router.post(
    "/",
    authenticateToken,
    authorizeRoles("customer"),reviewControllar.createReview);

// 2. Public: Get reviews for a technician
router.get(
    "/technician/:technicianId",reviewControllar.getReviewByTechnician);

// 3. Public: Get reviews for a service
router.get(
    "/service/:serviceId",reviewControllar.serviceReview);

// 4. Customer updates their own review
router.patch(
    "/:id",
    authenticateToken,
    authorizeRoles("customer"),reviewControllar.updatedReview);
// 5. Customer deletes their own review
router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("customer"),reviewControllar.deleteReview);

router.get(
    "/my-reviews",
    authenticateToken,
    authorizeRoles("customer"),
    reviewControllar.getOwnReviews
);
const reviewRouter=router;
export default reviewRouter;