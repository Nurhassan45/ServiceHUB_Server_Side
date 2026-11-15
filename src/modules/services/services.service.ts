// import { pool } from "../../DB";

import { pool } from "../../DB/index.js";

const postServiceIntoDB=async(payLoad:any)=>{
    try {
        const { name, description, base_price, image_url } = payLoad;
             const result = await pool.query(
                `INSERT INTO services
                 (name, description, base_price, image_url)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [
                    name.trim(),
                    description || null,
                    Number(base_price),
                    image_url || null
                ]
            );
        return result;
    } catch (error:any) {
        throw new Error(error.message)
    }
}

const getAllServiceFromDB=async()=>{
    try {
            const result = await pool.query(
            `SELECT * FROM services
             WHERE is_active = TRUE
             ORDER BY created_at DESC`
        );

        return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}

const getServiceFromDBbyID=async(id:string)=>{
    try {
        const result = await pool.query(
            `SELECT * FROM services
             WHERE id = $1 AND is_active = TRUE`,
            [id]
        );

        return result;
    } catch (error:any) {
        throw new Error(error.message)
    }
}

const deleteServiceFromDB=async(id:string)=>{
    try {
         const result = await pool.query(
                `UPDATE services
                 SET is_active = FALSE
                 WHERE id = $1 AND is_active = TRUE
                 RETURNING id, name, is_active`,
                [id]
            );
        return result;
    } catch (error:any) {
        throw new Error(error.message);
    }
}
const servicesService={
    postServiceIntoDB,
    getAllServiceFromDB,
    getServiceFromDBbyID,
    deleteServiceFromDB
}

export default servicesService;