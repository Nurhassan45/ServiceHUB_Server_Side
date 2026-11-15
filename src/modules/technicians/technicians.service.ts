import type { Request } from "express";
import { pool } from "../../DB/index.js";
// import { pool } from "../../DB";

const postTechnicianIntoDB=async(req:Request)=>{
try {
        const { experience, address, bio } = req.body;
          const result = await pool.query(
                `INSERT INTO technician_profiles
                 (user_id, experience, address, bio)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [
                    req.user!.id,
                    experience || null,
                    address.trim(),
                    bio || null
                ]
            );
            return result
} catch (error:any) {
    throw new Error(error.message)
}
}

const getTechnicianByIdFrom=async(req:Request)=>{
    try {
          const result = await pool.query(
                `SELECT * FROM technician_profiles
                 WHERE user_id = $1`,
                [req.user!.id]
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const getAllTechniciansByAdminFromDB=async()=>{
    try {
           const result = await pool.query(
                `SELECT
                    tp.id,
                    tp.experience,
                    tp.address,
                    tp.bio,
                    tp.created_at,
                    u.name,
                    u.email,
                    u.phone
                 FROM technician_profiles tp
                 JOIN users u ON tp.user_id = u.id
                 WHERE tp.is_verified = FALSE
                 ORDER BY tp.created_at ASC`
            );

            return result;
    } catch (error:any) {
         throw new Error(error.message);
    }
}

const verifyTechnicianByAdmin=async(id:string)=>{
    try {
           const result = await pool.query(
                `UPDATE technician_profiles
                 SET is_verified = TRUE
                 WHERE id = $1 AND is_verified = FALSE
                 RETURNING id, user_id, is_verified`,
                [id]
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const updatedOwnTechnicianProfile=async(fields:string[],values:unknown[])=>{
    try {
           const result = await pool.query(
                `UPDATE technician_profiles
                 SET ${fields.join(", ")}
                 WHERE user_id = $${values.length}
                 RETURNING *`,
                values
            );
            return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const getAllTechniciansByPublic=async()=>{
    try {
         const result = await pool.query(
            `SELECT
                tp.id,
                tp.experience,
                tp.address,
                tp.bio,
                tp.is_available,
                u.name
             FROM technician_profiles tp
             JOIN users u ON tp.user_id = u.id
             WHERE tp.is_verified = TRUE
             ORDER BY tp.created_at DESC`
        );
    return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}
const technicianService={
    postTechnicianIntoDB,
    getTechnicianByIdFrom,
    getAllTechniciansByAdminFromDB,
    verifyTechnicianByAdmin,
    updatedOwnTechnicianProfile,
    getAllTechniciansByPublic
};

export default technicianService;