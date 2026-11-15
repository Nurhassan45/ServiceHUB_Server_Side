import type { Request, Response } from "express";
import { isValidUUID, ResMsg } from "../../utils/ResMsg.js";
// import { pool } from "../../DB";
import reviewService from "./review.service.js";
import { pool } from "../../DB/index.js";

const createReview=async (req: Request, res: Response) => {
        try {
            const { booking_id, rating, comment } = req.body;

            if (
                typeof booking_id !== "string" ||
                !isValidUUID(booking_id)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Valid booking ID is required"
                });
            }

            if (
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be an integer between 1 and 5"
                });
            }

            if (
                comment !== undefined &&
                comment !== null &&
                (typeof comment !== "string" || comment.length > 1000)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Comment must be a string with at most 1000 characters"
                });
            }

            // Check booking ownership and completion
            const bookingResult = await pool.query(
                `SELECT id
                 FROM bookings
                 WHERE id = $1
                 AND customer_id = $2
                 AND status = 'completed'
                 AND technician_id IS NOT NULL`,
                [booking_id, req.user!.id]
            );

            if (bookingResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You can only review your own completed booking with an assigned technician"
                });
            }

            // Insert review
            const result = await pool.query(
                `INSERT INTO reviews
                    (booking_id, customer_id, rating, comment)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [
                    booking_id,
                    req.user!.id,
                    rating,
                    comment?.trim() || null
                ]
            );

            return res.status(201).json({
                success: true,
                message: "Review submitted successfully",
                data: result.rows[0]
            });

        } catch (error: any) {
            if (error.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message: "You have already reviewed this booking"
                });
            }

            console.error("Create review error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to submit review"
            });
        }
    }

const getReviewByTechnician=async (req: Request, res: Response) => {
        try {
            const { technicianId } = req.params;

            if (!isValidUUID(technicianId as string)) {
                ResMsg(res,400,false, "Invalid technician ID");
            }

            const result = await reviewService.getReviewByTechId(technicianId as string);

            const summary = await reviewService.summary(technicianId as string);

            return res.status(200).json({
                success: true,
                message: "Technician reviews retrieved successfully",
                summary: summary.rows[0],
                data: result.rows
            });

        } catch (error:any) {
            ResMsg(res,500,false,error.message);
        }
    }

const serviceReview= async (req: Request, res: Response) => {
        try {
            const { serviceId } = req.params;

            if (!isValidUUID(serviceId as string)) {
                ResMsg(res,400,false,"Invalid service ID");
            }

            const result = await reviewService.serviceReview(serviceId as string);

            const summary = await reviewService.serviceSummary(serviceId as string);

            return res.status(200).json({
                success: true,
                message: "Service reviews retrieved successfully",
                summary: summary.rows[0],
                data: result.rows
            });

        } catch (error) {
            console.error("Get service reviews error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve service reviews"
            });
        }
    }

const updatedReview= async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;

            if (!isValidUUID(id as string)) {
                ResMsg(res,400,false,"Invalid review ID");
            }

            // At least one field must be provided
            if (rating === undefined && comment === undefined) {
                ResMsg(res,400,false,"Provide rating or comment to update");
            }

            if (
                rating !== undefined &&
                (!Number.isInteger(rating) || rating < 1 || rating > 5)
            ) {
                ResMsg(res,400,false, "Rating must be an integer between 1 and 5");
            }

            if (
                comment !== undefined &&
                comment !== null &&
                (typeof comment !== "string" || comment.length > 1000)
            ) {
                ResMsg(res,400,false, "Comment must be a string with at most 1000 characters");
            }

            // Build a safe dynamic UPDATE query
            const updates: string[] = [];
            const values: any[] = [];

            if (rating !== undefined) {
                values.push(rating);
                updates.push(`rating = $${values.length}`);
            }

            if (comment !== undefined) {
                values.push(
                    typeof comment === "string" ? comment.trim() || null : null
                );
                updates.push(`comment = $${values.length}`);
            }

            values.push(id);
            const reviewIdPosition = values.length;

            values.push(req.user!.id);
            const customerIdPosition = values.length;

            const result = await pool.query(
                `UPDATE reviews
                 SET ${updates.join(", ")}
                 WHERE id = $${reviewIdPosition}
                 AND customer_id = $${customerIdPosition}
                 RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Review not found or you are not authorized to update it"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Review updated successfully",
                data: result.rows[0]
            });

        } catch (error) {
            console.error("Update review error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to update review"
            });
        }
    }

const deleteReview=async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            if (!isValidUUID(id as string)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid review ID"
                });
            }

            const result = await pool.query(
                `DELETE FROM reviews
                 WHERE id = $1
                 AND customer_id = $2
                 RETURNING id`,
                [id, req.user!.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Review not found or you are not authorized to delete it"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Review deleted successfully"
            });

        } catch (error) {
            console.error("Delete review error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to delete review"
            });
        }
    }

const getOwnReviews = async (req: Request, res: Response) => {
    try {
        const result = await reviewService.getOwnReviews(req.user!.id);

        return res.status(200).json({
            success: true,
            message: "Your reviews retrieved successfully",
            data: result.rows
        });
    } catch (error: any) {
        console.error("Get own reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your reviews"
        });
    }
};
    const reviewControllar={
        createReview,
        getReviewByTechnician,
        serviceReview,
        updatedReview,
        deleteReview,
        getOwnReviews
    };
    export default reviewControllar;