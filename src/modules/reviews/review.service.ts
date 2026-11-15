// import { pool } from "../../DB";

import { pool } from "../../DB/index.js";

const getReviewByTechId=async(technicianId:string)=>{
    try {
         const result = await pool.query(
                        `SELECT
                            r.id,
                            r.rating,
                            r.comment,
                            r.created_at,
                            u.name AS customer_name,
                            s.name AS service_name
                         FROM reviews r
                         JOIN users u ON r.customer_id = u.id
                         JOIN bookings b ON r.booking_id = b.id
                         JOIN services s ON b.service_id = s.id
                         WHERE b.technician_id = $1
                         ORDER BY r.created_at DESC`,
                        [technicianId]
                    );
        return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

 const summary =async(technicianId:string)=>{

    const result =await pool.query(
                `SELECT
                    COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
                    COUNT(r.id)::int AS total_reviews
                 FROM reviews r
                 JOIN bookings b ON r.booking_id = b.id
                 WHERE b.technician_id = $1`,
                [technicianId]
            );
    return result;
 }

 const serviceReview=async(serviceId:string)=>{
    try {
        const result = await pool.query(
                `SELECT
                    r.id,
                    r.rating,
                    r.comment,
                    r.created_at,
                    u.name AS customer_name,
                    t.name AS technician_name
                 FROM reviews r
                 JOIN users u ON r.customer_id = u.id
                 JOIN bookings b ON r.booking_id = b.id
                 JOIN services s ON b.service_id = s.id
                 LEFT JOIN technician_profiles tp
                    ON b.technician_id = tp.id
                 LEFT JOIN users t
                    ON tp.user_id = t.id
                 WHERE b.service_id = $1
                 ORDER BY r.created_at DESC`,
                [serviceId]
            );
        return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
 }

 const serviceSummary=async(serviceId:string)=>{
    try {
         const summary = await pool.query(
                `SELECT
                    COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
                    COUNT(r.id)::int AS total_reviews
                 FROM reviews r
                 JOIN bookings b ON r.booking_id = b.id
                 WHERE b.service_id = $1`,
                [serviceId]
            );
        return summary
    } catch (error:any) {
        throw new Error(error.message);
    }
 }

 const getOwnReviews = async (customerId: string) => {
    const result = await pool.query(
        `SELECT
            r.id,
            r.booking_id,
            r.rating,
            r.comment,
            r.created_at,
            s.name AS service_name,
            b.scheduled_at
         FROM reviews r
         JOIN bookings b ON r.booking_id = b.id
         JOIN services s ON b.service_id = s.id
         WHERE r.customer_id = $1
         ORDER BY r.created_at DESC`,
        [customerId]
    );

    return result;
};
const reviewService={
    getReviewByTechId,
    summary,
    serviceReview,
    serviceSummary,
    getOwnReviews
};

export default reviewService;