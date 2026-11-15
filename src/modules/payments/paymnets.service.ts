
import { randomUUID } from "crypto";
// import { pool } from "../../DB";
import initializeSSLCommerz from "./sslcommerz.service.js";
import { pool } from "../../DB/index.js";

// Customer creates a cash payment
const createCashPayment = async (
    bookingId: string,
    customerId: string
) => {
    const bookingResult = await pool.query(
        `SELECT id, customer_id, technician_id, status
         FROM bookings
         WHERE id = $1 AND customer_id = $2`,
        [bookingId, customerId]
    );

    if (bookingResult.rows.length === 0) {
        throw new Error("Booking not found or access denied");
    }

    const booking = bookingResult.rows[0];

    if (["cancelled", "rejected"].includes(booking.status)) {
        throw new Error("Cannot create payment for this booking");
    }

    const priceResult = await pool.query(
        `SELECT s.base_price
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.id = $1`,
        [bookingId]
    );

    if (priceResult.rows.length === 0) {
        throw new Error("Service price not found");
    }

    const amount = Number(priceResult.rows[0].base_price);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid payment amount");
    }

    // Prevent duplicate payment records for the same booking
    const existing = await pool.query(
        `SELECT id, payment_method, payment_status
         FROM payments
         WHERE booking_id = $1`,
        [bookingId]
    );

    if (existing.rows.length > 0) {
        throw new Error(
            "A payment record already exists for this booking"
        );
    }

    const result = await pool.query(
        `INSERT INTO payments
            (booking_id, amount, payment_method, payment_status)
         VALUES ($1, $2, 'cash', 'pending')
         RETURNING *`,
        [bookingId, amount]
    );

    return result.rows[0];
};


// Customer views own payments
const getMyPayments = async (customerId: string) => {
    const result = await pool.query(
        `SELECT
            p.*,
            b.status AS booking_status,
            s.name AS service_name
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         JOIN services s ON b.service_id = s.id
         WHERE b.customer_id = $1
         ORDER BY p.created_at DESC`,
        [customerId]
    );

    return result.rows;
};


// Technician or admin confirms cash received
const confirmCashPayment = async (
    paymentId: string,
    userId: string,
    userRole: string
) => {
    const result = await pool.query(
        `SELECT
            p.id,
            p.payment_method,
            p.payment_status,
            b.technician_id,
            b.status AS booking_status
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         WHERE p.id = $1`,
        [paymentId]
    );

    if (result.rows.length === 0) {
        throw new Error("Payment not found");
    }

    const payment = result.rows[0];

    if (payment.payment_method !== "cash") {
        throw new Error("This is not a cash payment");
    }

    if (payment.payment_status === "paid") {
        throw new Error("Payment is already confirmed");
    }

    if (payment.payment_status !== "pending") {
        throw new Error("Only pending payments can be confirmed");
    }

    if (payment.booking_status !== "completed") {
        throw new Error(
            "Booking must be completed before confirming cash"
        );
    }

    if (
        userRole === "technician" &&
        payment.technician_id !== userId
    ) {
        throw new Error("You are not assigned to this booking");
    }

    const updated = await pool.query(
        `UPDATE payments
         SET payment_status = 'paid',
             transaction_id = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [paymentId, `CASH-${paymentId}`]
    );

    return updated.rows[0];
};


// Admin views all payments
const getAllPayments = async () => {
    const result = await pool.query(
        `SELECT
            p.*,
            b.status AS booking_status,
            s.name AS service_name,
            u.name AS customer_name,
            u.email AS customer_email
         FROM payments p
         JOIN bookings b ON p.booking_id = b.id
         JOIN services s ON b.service_id = s.id
         JOIN users u ON b.customer_id = u.id
         ORDER BY p.created_at DESC`
    );

    return result.rows;
};


// Customer initializes SSLCommerz online payment
const createOnlinePayment = async (
    bookingId: string,
    customerId: string
) => {
    const client = await pool.connect();

    let paymentRecord: any;
    let transactionId: string;

    try {
        await client.query("BEGIN");

        // Get booking, service and customer details
        // Lock the booking while checking/creating its payment
        const bookingResult = await client.query(
            `SELECT
                b.id AS booking_id,
                b.customer_id,
                b.status AS booking_status,
                b.address,
                s.name AS service_name,
                s.base_price AS amount,
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             JOIN users u ON b.customer_id = u.id
             WHERE b.id = $1
             AND b.customer_id = $2
             FOR UPDATE OF b`,
            [bookingId, customerId]
        );

        if (bookingResult.rows.length === 0) {
            throw new Error("Booking not found or access denied");
        }

        const booking = bookingResult.rows[0];

        if (
            ["cancelled", "rejected"].includes(
                booking.booking_status
            )
        ) {
            throw new Error("Cannot pay for this booking");
        }

        const amount = Number(booking.amount);

        if (!Number.isFinite(amount) || amount < 10 || amount > 500000) {
            throw new Error(
                "Payment amount must be between 10 and 500000 BDT"
            );
        }

        if (!booking.customer_phone) {
            throw new Error("Customer phone number is required");
        }

        if (!booking.address) {
            throw new Error("Booking address is required");
        }

        // Generate a unique transaction ID
        transactionId = `SH-${randomUUID()}`;

        // Check whether a payment already exists
        const existingResult = await client.query(
            `SELECT *
             FROM payments
             WHERE booking_id = $1
             FOR UPDATE`,
            [bookingId]
        );

        if (existingResult.rows.length > 0) {
            const existing = existingResult.rows[0];

            if (existing.payment_status === "paid") {
                throw new Error("This booking has already been paid");
            }

            if (existing.payment_method !== "online") {
                throw new Error(
                    "A cash payment already exists for this booking"
                );
            }

            // Only failed online payments can be retried.
            // Do not invalidate an existing active checkout session.
            if (existing.payment_status !== "failed") {
                throw new Error(
                    "An online payment is already pending for this booking"
                );
            }

            const updated = await client.query(
                `UPDATE payments
                 SET amount = $1,
                     payment_status = 'pending',
                     transaction_id = $2,
                     validation_id = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE booking_id = $3
                 RETURNING *`,
                [amount, transactionId, bookingId]
            );

            paymentRecord = updated.rows[0];

        } else {
            // Create a new online payment
            const inserted = await client.query(
                `INSERT INTO payments
                    (
                        booking_id,
                        amount,
                        payment_method,
                        payment_status,
                        transaction_id
                    )
                 VALUES ($1, $2, 'online', 'pending', $3)
                 RETURNING *`,
                [bookingId, amount, transactionId]
            );

            paymentRecord = inserted.rows[0];
        }

        await client.query("COMMIT");

        // Prepare SSLCommerz customer information
        const paymentData = {
            transactionId,
            amount,
            serviceName: booking.service_name,
            customer: {
                name: booking.customer_name,
                email: booking.customer_email,
                phone: booking.customer_phone,
                address: booking.address
            }
        };

        // Initialize SSLCommerz checkout session
        try {
            const gatewayResponse = await initializeSSLCommerz(
                paymentData
            );

            return {
                payment: paymentRecord,
                transactionId,
                gatewayUrl: gatewayResponse.gatewayUrl
            };

        } catch (error) {
            // Mark payment failed if gateway initialization fails
            await pool.query(
                `UPDATE payments
                 SET payment_status = 'failed',
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 AND transaction_id = $2
                 AND payment_status = 'pending'`,
                [paymentRecord.id, transactionId]
            );

            throw error;
        }

    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;

    } finally {
        client.release();
    }
};


const paymentsService = {
    createCashPayment,
    getMyPayments,
    confirmCashPayment,
    getAllPayments,
    createOnlinePayment
};

export default paymentsService;
