
import type { Request, Response } from "express";
import paymentsService from "./paymnets.service.js";
import { ResMsg } from "../../utils/ResMsg.js";
// import { ResMsg } from "../../utils/ResMsg";
// import paymentsService from "./paymnets.service";
import sslcommerzValidationService from "./sslcommerz.validation.service.js";
// import paymentsService from "./payments.service";

// Customer creates a cash payment
const createCashPayment = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const customerId = req.user!.id;

        const result = await paymentsService.createCashPayment(
            bookingId as string,
            customerId
        );

        return ResMsg(
            res,
            201,
            true,
            "Cash payment created successfully",
            result
        );

    } catch (error: any) {
        return ResMsg(res, 400, false, error.message);
    }
};


// Customer initializes online payment
const createOnlinePayment = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;
        const customerId = req.user!.id;

        const result = await paymentsService.createOnlinePayment(
            bookingId as string,
            customerId
        );

        return ResMsg(
            res,
            200,
            true,
            "Online payment initialized successfully",
            result
        );

    } catch (error: any) {
        return ResMsg(res, 400, false, error.message);
    }
};


// Customer views own payments
const getMyPayments = async (req: Request, res: Response) => {
    try {
        const customerId = req.user!.id;

        const result = await paymentsService.getMyPayments(customerId);

        return ResMsg(
            res,
            200,
            true,
            "Payment history retrieved successfully",
            result
        );

    } catch (error: any) {
        return ResMsg(res, 500, false, error.message);
    }
};



const onlineSuccess = async (req: Request, res: Response) => {
    try {
        const { tran_id, val_id } = req.body;

        const result =
            await sslcommerzValidationService.validateAndCompletePayment(
                tran_id,
                val_id
            );

        return ResMsg(
            res,
            200,
            true,
            "Payment verified and completed successfully",
            result
        );
    } catch (error: any) {
        return ResMsg(res, 400, false, error.message);
    }
};


const onlineFail = async (req: Request, res: Response) => {
    try {
        const { tran_id } = req.body;

        const result =
            await sslcommerzValidationService.markOnlinePaymentFailed(
                tran_id
            );

        return ResMsg(
            res,
            200,
            true,
            "Payment failed",
            result
        );
    } catch (error: any) {
        return ResMsg(res, 400, false, error.message);
    }
};


const onlineCancel = async (req: Request, res: Response) => {
    try {
        const { tran_id } = req.body;

        const result =
            await sslcommerzValidationService.markOnlinePaymentFailed(
                tran_id
            );

        return ResMsg(
            res,
            200,
            true,
            "Payment cancelled",
            result
        );
    } catch (error: any) {
        return ResMsg(res, 400, false, error.message);
    }
};


const onlineIPN = async (req: Request, res: Response) => {
    try {
        const { tran_id, val_id } = req.body;

        const result =
            await sslcommerzValidationService.validateAndCompletePayment(
                tran_id,
                val_id
            );

        return ResMsg(
            res,
            200,
            true,
            "IPN payment notification processed",
            result
        );
    } catch (error: any) {
        return ResMsg(res, 400, false, error.message);
    }
};


// Technician or admin confirms cash payment
const confirmCashPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { id: userId, role } = req.user!;

        const result = await paymentsService.confirmCashPayment(
            id as string,
            userId,
            role
        );

        return ResMsg(
            res,
            200,
            true,
            "Cash payment confirmed successfully",
            result
        );

    } catch (error: any) {
        return ResMsg(res, 400, false, error.message);
    }
};


// Admin views all payments
const getAllPayments = async (req: Request, res: Response) => {
    try {
        const result = await paymentsService.getAllPayments();

        return ResMsg(
            res,
            200,
            true,
            "All payments retrieved successfully",
            result
        );

    } catch (error: any) {
        return ResMsg(res, 500, false, error.message);
    }
};


const paymentsController = {
    createCashPayment,
    createOnlinePayment,
    getMyPayments,
    confirmCashPayment,
    getAllPayments,
     onlineSuccess,
    onlineFail,
    onlineCancel,
    onlineIPN
};

export default paymentsController;
