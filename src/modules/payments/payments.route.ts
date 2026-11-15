
import { Router } from "express";
import authorizeRoles from "../../middleware/role.middlewire.js";
import authenticateToken from "../../middleware/auth.middleware.js";
import paymentsController from "./payments.controllar.js";

const router = Router();

// =====================================
// PUBLIC SSLCommerz CALLBACK ROUTES
// =====================================

router.post(
    "/online/success",
    paymentsController.onlineSuccess
);

router.post(
    "/online/fail",
    paymentsController.onlineFail
);

router.post(
    "/online/cancel",
    paymentsController.onlineCancel
);

router.post(
    "/online/ipn",
    paymentsController.onlineIPN
);


// =====================================
// PROTECTED CUSTOMER ROUTES
// =====================================

// Customer creates cash payment
router.post(
    "/cash/:bookingId",
    authenticateToken,
    authorizeRoles("customer"),
    paymentsController.createCashPayment
);

// Customer initializes online payment
router.post(
    "/online/:bookingId",
    authenticateToken,
    authorizeRoles("customer"),
    paymentsController.createOnlinePayment
);

// Customer views payment history
router.get(
    "/my-payments",
    authenticateToken,
    authorizeRoles("customer"),
    paymentsController.getMyPayments
);


// =====================================
// PROTECTED TECHNICIAN / ADMIN ROUTES
// =====================================

// Technician or admin confirms cash payment
router.patch(
    "/:id/confirm-cash",
    authenticateToken,
    authorizeRoles("technician", "admin"),
    paymentsController.confirmCashPayment
);

// Admin views all payments
router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    paymentsController.getAllPayments
);

export default router;
