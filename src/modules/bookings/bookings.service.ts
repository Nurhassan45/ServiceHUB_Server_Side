// import { pool } from "../../DB";

import { pool } from "../../DB/index.js";

const serviceResult=async(service_id:string)=>{
    try {
           const result = await pool.query(
                `SELECT id, name, base_price
                 FROM services
                 WHERE id = $1 AND is_active = TRUE`,
                [service_id]
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

 const technicianResult =async(technician_id:string)=>{
    const result= await pool.query(
                    `SELECT id
                     FROM technician_profiles
                     WHERE id = $1
                     AND is_verified = TRUE
                     AND is_available = TRUE`,
                    [technician_id]
                );
    return result;        
            }

const getOwnBookings=async(userId:string)=>{
    try {
                 const result = await pool.query(
                `SELECT
                    b.*,
                    s.name AS service_name,
                    u.name AS technician_name
                 FROM bookings b
                 JOIN services s ON b.service_id = s.id
                 LEFT JOIN technician_profiles tp
                    ON b.technician_id = tp.id
                 LEFT JOIN users u
                    ON tp.user_id = u.id
                 WHERE b.customer_id = $1
                 ORDER BY b.created_at DESC`,
                [userId]
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const techniciansAssignedBooking=async(userId:string)=>{
    try {
             const result = await pool.query(
                `SELECT
                    b.*,
                    s.name AS service_name,
                    u.name AS customer_name,
                    u.phone AS customer_phone
                 FROM bookings b
                 JOIN services s ON b.service_id = s.id
                 JOIN users u ON b.customer_id = u.id
                 JOIN technician_profiles tp
                    ON b.technician_id = tp.id
                 WHERE tp.user_id = $1
                 ORDER BY b.created_at DESC`,
                [userId]
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const updatedAssignedBookings=async(action:string,id:string,userId:string)=>{
    try {
         const result = await pool.query(
                `UPDATE bookings b
                 SET status = $1
                 FROM technician_profiles tp
                 WHERE b.id = $2
                 AND b.technician_id = tp.id
                 AND tp.user_id = $3
                 AND b.status = 'pending'
                 RETURNING b.*`,
                [action, id, userId]
            );
        return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const updatedBookingsProgress=async(status:string,id:string,userId:string,previousStatus:string)=>{
    try {
           const result = await pool.query(
                `UPDATE bookings b
                 SET status = $1
                 FROM technician_profiles tp
                 WHERE b.id = $2
                 AND b.technician_id = tp.id
                 AND tp.user_id = $3
                 AND b.status = $4
                 RETURNING b.*`,
                [status, id, userId, previousStatus]
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const getAllBookingsByAdmin=async()=>{
    try {
        const result = await pool.query(
                `SELECT
                    b.*,
                    s.name AS service_name,
                    c.name AS customer_name,
                    t.name AS technician_name
                 FROM bookings b
                 JOIN services s ON b.service_id = s.id
                 JOIN users c ON b.customer_id = c.id
                 LEFT JOIN technician_profiles tp
                    ON b.technician_id = tp.id
                 LEFT JOIN users t
                    ON tp.user_id = t.id
                 ORDER BY b.created_at DESC`
            );
        return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const adminAssignToTechnician=async(id:string,technician_id:string)=>{
    try {
         const result = await pool.query(
                `UPDATE bookings b
                 SET technician_id = $1
                 WHERE b.id = $2
                 AND b.status = 'pending'
                 AND EXISTS (
                    SELECT 1
                    FROM technician_profiles tp
                    WHERE tp.id = $1
                    AND tp.is_verified = TRUE
                    AND tp.is_available = TRUE
                 )
                 RETURNING b.*`,
                [technician_id, id]
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const cancelOwnBooking = async (bookingId: string, customerId: string) => {
    return await pool.query(
        `UPDATE bookings
         SET status = 'cancelled'
         WHERE id = $1
         AND customer_id = $2
         AND status = 'pending'
         RETURNING *`,
        [bookingId, customerId]
    );
};
const bookingService={
    serviceResult,
    technicianResult,
    getOwnBookings,
    techniciansAssignedBooking,
    updatedAssignedBookings,
    updatedBookingsProgress,
    getAllBookingsByAdmin,
    adminAssignToTechnician,
    cancelOwnBooking
}

export default bookingService;