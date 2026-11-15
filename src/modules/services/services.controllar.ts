import type { Request, Response } from "express";
import { ResMsg } from "../../utils/ResMsg.js";
import servicesService from "./services.service.js";
import { pool } from "../../DB/index.js";
// import { pool } from "../../DB";

const postService=async(req:Request,res:Response)=>{
    try {
          const { name, description, base_price, image_url } = req.body;

            if (
                typeof name !== "string" ||
                !name.trim() ||
                base_price === undefined ||
                !Number.isFinite(Number(base_price)) ||
                Number(base_price) <= 0
            ) { ResMsg(res,400,false,"Valid name and positive base_price are required"); }
            const result =await servicesService.postServiceIntoDB(req.body); 
            if(result.rows.length===0) ResMsg(res,400,false,'Unsuccessfull post Operation '); 
            ResMsg(res,201,true,result.rows[0]);
    } catch (error:any) {
        ResMsg(res,400,false,error.message); 
    }
}

const getAllService=async(req:Request,res:Response)=>{
try {
    const result = await servicesService.getAllServiceFromDB();
    if(result.rows.length===0) ResMsg(res,500,false,'unsuccessfull get operation ');
    ResMsg(res,200,true,"Services retrieved successfully", result.rows);
} catch (error:any) {
    ResMsg(res,500,false,error.message);
}
}

const getServiceById=async(req:Request,res:Response)=>{
    try {
        const { id } = req.params;

        const result = await servicesService.getServiceFromDBbyID(id as string);
        if (result.rows.length === 0) {
            ResMsg(res,404,false,"Service not found")
        }
            ResMsg(res,200,true,"Service retrive SuccessFully",result.rows[0]);

    } catch (error:any) {
            ResMsg(res,500,false,error.message);
    }
}

const updatedService=async(req:Request,res:Response)=>{
try {
     const { id } = req.params;
            const { name, description, base_price, image_url } = req.body;

            const fields: string[] = [];
            const values: unknown[] = [];

            if (name !== undefined) {
                if (typeof name !== "string" || !name.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: "Name must be a non-empty string"
                    });
                }

                values.push(name.trim());
                fields.push(`name = $${values.length}`);
            }

            if (description !== undefined) {
                values.push(description);
                fields.push(`description = $${values.length}`);
            }

            if (base_price !== undefined) {
                if (
                    !Number.isFinite(Number(base_price)) ||
                    Number(base_price) <= 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "base_price must be positive"
                    });
                }

                values.push(Number(base_price));
                fields.push(`base_price = $${values.length}`);
            }

            if (image_url !== undefined) {
                values.push(image_url);
                fields.push(`image_url = $${values.length}`);
            }

            if (fields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Provide at least one field to update"
                });
            }

            values.push(id);
              const result = await pool.query(
                `UPDATE services
                 SET ${fields.join(", ")}
                 WHERE id = $${values.length}
                 RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Service updated successfully",
                data: result.rows[0]
            });
} catch (error:any) {
    ResMsg(res,500,false,error.message);
}
}

const deleteService=async(req:Request,res:Response)=>{
    try {
        const { id } = req.params;
        const result=await servicesService.deleteServiceFromDB(id as string);
             if (result.rows.length === 0) {
                ResMsg(res,404,false,"Active service not found");
            }
             ResMsg(res,200,true,"Service deactivated successfully", result.rows[0]);
          
    } catch (error:any) {
        ResMsg(res,500,false,error.message);
    }
}
const serviceControllar={
    postService,
    getAllService,
    getServiceById,
    updatedService,
    deleteService
}

export default serviceControllar;