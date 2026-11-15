import type { Request, Response } from "express";
import { isValidUUID, ResMsg } from "../../utils/ResMsg.js";
import bookingService from "./bookings.service.js";
import { pool } from "../../DB/index.js";
// import { pool } from "../../DB";

const createBookings=async (req: Request, res: Response) => {
        try {
            const {
                service_id,
                technician_id,
                scheduled_at,
                address,
                description
            } = req.body;

            // 1. Validate required fields
            if (
                !service_id ||
                !scheduled_at ||
                !address ||
                typeof address !== "string" ||
                !address.trim()
            ) {
                ResMsg(res,400,false,"Service, schedule and address are required");
            }

            if (!isValidUUID(service_id)) {
                ResMsg(res,400,false, "Invalid service ID");
            }

            // 2. Validate booking date
            const bookingDate = new Date(scheduled_at);

            if (
                typeof scheduled_at !== "string" ||
                Number.isNaN(bookingDate.getTime()) ||
                bookingDate.getTime() <= Date.now()
            ) {
                     ResMsg(res,400,false,"Please provide a valid future booking date");
            }

            // 3. Check whether service exists and is active
            const serviceResult =await bookingService.serviceResult(service_id as string);

            if (serviceResult?.rows.length === 0) {
                    ResMsg(res,404,false, "Service not found or inactive");
            }

            // 4. Check selected technician (if provided)
            if (technician_id) {
                if (
                    typeof technician_id !== "string" ||
                    !isValidUUID(technician_id)
                ) {
                    ResMsg(res,400,false, "Invalid technician ID");
                }

                const technicianResult = await bookingService.technicianResult(technician_id as string)

                if (technicianResult.rows.length === 0) {
                    ResMsg(res,400,false, "Technician is not verified or available");
                }
            }

            // 5. Get price from database
            const totalPrice = serviceResult?.rows[0].base_price;

            // 6. Insert booking
            const result = await pool.query(
                `INSERT INTO bookings
                 (
                    customer_id,
                    technician_id,
                    service_id,
                    scheduled_at,
                    address,
                    description,
                    total_price
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    req.user!.id,
                    technician_id || null,
                    service_id,
                    bookingDate,
                    address.trim(),
                    description || null,
                    totalPrice
                ]
            );
            ResMsg(res,201,true,"Booking created successfully",result.rows[0]);
        } catch (error:any) {
           ResMsg(res,500,false,error.message);
        }
    }

const getOwnBookings= async (req: Request, res: Response) => {
        try {
            const userId=req.user!.id;
            const result = await bookingService.getOwnBookings(userId as string);
            ResMsg(res,200,true,"Your bookings retrieved successfully",result.rows)

        } catch (error:any) {
            ResMsg(res,500,false,error.message);
        }
    }

const technicianAssignedBookings= async (req: Request, res: Response) => {
        try {
            const userId=req.user!.id;
            const result = await bookingService.techniciansAssignedBooking(userId);
            
            ResMsg(res,200,true,"Assigned bookings retrieved successfully",result.rows);

        } catch (error:any) {
           ResMsg(res,500,false,"Failed to retrieve assigned bookings");
        }
    }

const updatedAssignedBooking= async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { action } = req.body;
            const userId=req.user!.id;
            if (!["accepted", "rejected"].includes(action)) {
                ResMsg(res,400,false, "Action must be accepted or rejected");
            }

            const result = await bookingService.updatedAssignedBookings(action,id as string,userId)

            if (result.rows.length === 0) {
                ResMsg(res,409,false,"Booking not found, not assigned to you, or already responded to");
            }
                ResMsg(res,200,true,`Booking ${action} successfully`,result.rows[0]);
        } catch (error:any) {
        ResMsg(res,500,false,error.message);
        }
    }
const updatedBookingsProgress=async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const transitions: Record<string, string> = {
                in_progress: "accepted",
                completed: "in_progress"
            };

            if (!transitions[status]) { ResMsg(res,400,false,"Status must be in_progress or completed") }

            const previousStatus = transitions[status];
            const userId=req.user!.id;
            const result = await bookingService.updatedBookingsProgress(status,id as string,userId,previousStatus as string)

            if (result.rows.length === 0) {
                ResMsg(res,409,false,"Booking not assigned to you or invalid status transition")
            }
            ResMsg(res,200,true,"Booking status updated successfully", result.rows[0])

        } catch (error:any) {
            ResMsg(res,500,false,error.message);
        }
    }

const getAllBookingsByAdmin= async (req: Request, res: Response) => {
        try {
            const result = await bookingService.getAllBookingsByAdmin();
            ResMsg(res,200,true,"All bookings retrieved successfully",result.rows);

        } catch (error:any) {
            ResMsg(res,500,false,error.message);
        }
    }

const adminAssignToTechnician=async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { technician_id } = req.body;

            if (
                typeof technician_id !== "string" ||
                !isValidUUID(technician_id)
            ) {
                ResMsg(res,400,false, "Valid technician profile ID is required")
            }

            const result = await bookingService.adminAssignToTechnician(id as string,technician_id)

            if (result.rows.length === 0) {
                ResMsg(res,409,false,"Booking not found, not pending, or technician is unavailable or unverified")
            }
                ResMsg(res,200,true,"Technician assigned successfully",result.rows[0])

        } catch (error:any) {
         ResMsg(res,500,false,error.message);
        }
    }

const cancelOwnBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.id;

        const result = await bookingService.cancelOwnBooking(
            id as string,
            customerId!
        );

        if (result.rowCount === 0) {
            return ResMsg(
                res,
                400,
                false,
                "Booking cannot be cancelled"
            );
        }

        return ResMsg(
            res,
            200,
            true,
            "Booking cancelled successfully",
            result.rows[0]
        );
    } catch (error) {
        console.error(error);
        return ResMsg(res, 500, false, "Internal server error");
    }
};
        const bookingControllar={
        createBookings,
        getOwnBookings,
        technicianAssignedBookings,
        updatedAssignedBooking,
        updatedBookingsProgress,
        getAllBookingsByAdmin,
        adminAssignToTechnician,
        cancelOwnBooking
    };
    export default bookingControllar;