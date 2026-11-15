
import axios from "axios";
import { pool } from "../../DB/index.js";
// import { pool } from "../../DB";

interface SSLValidationResponse {
    status: string;
    tran_id: string;
    val_id: string;
    amount: string;
    currency: string;
}

const validateAndCompletePayment = async (
    transactionId: string,
    validationId: string
) => {
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

    if (!storeId || !storePassword) {
        throw new Error("SSLCommerz credentials are missing");
    }

    if (!transactionId || !validationId) {
        throw new Error("Transaction ID and validation ID are required");
    }

    // Find the matching payment in our database
    const paymentResult = await pool.query(
        `SELECT id, amount, payment_status, payment_method
         FROM payments
         WHERE transaction_id = $1`,
        [transactionId]
    );

    if (paymentResult.rows.length === 0) {
        throw new Error("Payment not found");
    }

    const payment = paymentResult.rows[0];

    if (payment.payment_method !== "online") {
        throw new Error("This is not an online payment");
    }

    if (payment.payment_status === "paid") {
        return payment;
    }

    if (payment.payment_status !== "pending") {
        throw new Error("Payment is not pending");
    }

    // Select sandbox or live validation endpoint
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";

    const validationUrl = isLive
        ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
        : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

    // Ask SSLCommerz to validate the transaction
    const response = await axios.get<SSLValidationResponse>(
        validationUrl,
        {
            params: {
                val_id: validationId,
                store_id: storeId,
                store_passwd: storePassword,
                format: "json"
            },
            timeout: 20000
        }
    );

    const validation = response.data;

    // Verify gateway response
    if (
        !["VALID", "VALIDATED"].includes(validation.status)
    ) {
        throw new Error("SSLCommerz transaction validation failed");
    }

    if (validation.tran_id !== transactionId) {
        throw new Error("Transaction ID mismatch");
    }

    if (validation.val_id !== validationId) {
        throw new Error("Validation ID mismatch");
    }

    if (validation.currency !== "BDT") {
        throw new Error("Invalid payment currency");
    }

    // Compare amounts in paisa to avoid floating-point problems
    const databaseAmount = Math.round(Number(payment.amount) * 100);
    const gatewayAmount = Math.round(Number(validation.amount) * 100);

    if (
        !Number.isFinite(gatewayAmount) ||
        databaseAmount !== gatewayAmount
    ) {
        throw new Error("Payment amount mismatch");
    }

    // Only now mark payment as paid
    const updated = await pool.query(
        `UPDATE payments
         SET payment_status = 'paid',
             validation_id = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE transaction_id = $2
         AND payment_method = 'online'
         AND payment_status = 'pending'
         RETURNING *`,
        [validationId, transactionId]
    );

    if (updated.rows.length === 0) {
        // Check whether another callback already completed it
        const current = await pool.query(
            `SELECT *
             FROM payments
             WHERE transaction_id = $1`,
            [transactionId]
        );

        if (current.rows[0]?.payment_status === "paid") {
            return current.rows[0];
        }

        throw new Error("Unable to update payment status");
    }

    return updated.rows[0];
};


// Handle failed or cancelled online checkout
const markOnlinePaymentFailed = async (
    transactionId: string
) => {
    if (!transactionId) {
        throw new Error("Transaction ID is required");
    }

    const result = await pool.query(
        `UPDATE payments
         SET payment_status = 'failed',
             updated_at = CURRENT_TIMESTAMP
         WHERE transaction_id = $1
         AND payment_method = 'online'
         AND payment_status = 'pending'
         RETURNING *`,
        [transactionId]
    );

    return result.rows[0] ?? null;
};


const sslcommerzValidationService = {
    validateAndCompletePayment,
    markOnlinePaymentFailed
};

export default sslcommerzValidationService;
