import type { Request, Response } from "express";
import { ResMsg } from "../../utils/ResMsg.js";
import technicianService from "./technicians.service.js";

const postTechnicians=async (req: Request, res: Response) => {
        try {
            const { experience, address, bio } = req.body;

            if (!address || typeof address !== "string" || !address.trim()) {
                ResMsg(res,400,false,"Address is required")
            }
            const result =await technicianService.postTechnicianIntoDB(req);
       
            if(result.rows.length===0) ResMsg(res,403,false,'Tecnicial profile not created');
            ResMsg(res,201,true,"Technician profile created. Waiting for admin verification.",result.rows[0]);

        } catch (error:any) {
               ResMsg(res,400,false,error.message)
        
    }
}

const getTechniciansById= async (req: Request, res: Response) => {
        try {
           

            const result = await technicianService.getTechnicianByIdFrom(req);

            if (result.rows.length === 0) {
                ResMsg(res,404,false,"Technician profile not found");
            }
                ResMsg(res,200,true,"Technician profile ",result.rows[0]);

        } catch (error:any) {
            
                ResMsg(res,500,false,error.message);
        }
    }

const getAllTechniciansByAdmin= async (req: Request, res: Response) => {
        try {
            const result = await technicianService.getAllTechniciansByAdminFromDB();
            ResMsg(res,200,true,"Pending technicians retrieved successfully", result.rows);

        } catch (error:any) {
             ResMsg(res,500,false,"Failed to retrieve pending technicians");
        }
    }

const verifyTechniciansByAdmin=async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const result = await technicianService.verifyTechnicianByAdmin(id as string);

            if (result.rows.length === 0) {
                ResMsg(res,404,false,"Pending technician profile not found");
            }
                ResMsg(res,200,true,"Technician verified successfully",result.rows[0]);


        } catch (error:any) {
                           ResMsg(res,500,false,error.message);
        }
    }

const updatedOwnTechnicianlProfile= async (req: Request, res: Response) => {
        try {
            const { experience, address, bio, is_available } = req.body;

            const fields: string[] = [];
            const values: unknown[] = [];

            if (experience !== undefined) {
                values.push(experience);
                fields.push(`experience = $${values.length}`);
            }

            if (address !== undefined) {
                if (typeof address !== "string" || !address.trim()) {
                    ResMsg(res,400,false,"Address must be a non-empty string");
                }

                values.push(address.trim());
                fields.push(`address = $${values.length}`);
            }

            if (bio !== undefined) {
                values.push(bio);
                fields.push(`bio = $${values.length}`);
            }

            if (is_available !== undefined) {
                if (typeof is_available !== "boolean") {
                    ResMsg(res,400,false,"is_available must be true or false");
                }

                values.push(is_available);
                fields.push(`is_available = $${values.length}`);
            }

            if (fields.length === 0) {
                    ResMsg(res,400,false, "Provide at least one field to update");
            }

            values.push(req.user!.id);
            const result = await technicianService.updatedOwnTechnicianProfile(fields,values);

            if (result.rows.length === 0) {
                ResMsg(res,404,false,"Technician profile not found");
            }
             ResMsg(res,200,true,"Profile updated successfully", result.rows[0]);

        } catch (error:any) {
                ResMsg(res,500,false,error.message);
         
    }}

const getAllTechniciansByPublic=async (req: Request, res: Response) => {
    try {
       const result=await technicianService.getAllTechniciansByPublic();
        ResMsg(res,200,true, "Verified technicians retrieved successfully",result.rows)

    } catch (error:any) {
        ResMsg(res,500,false,error.message)
    }
};

const tecniciansControllar={
    postTechnicians,
    getTechniciansById,
    getAllTechniciansByAdmin,
    verifyTechniciansByAdmin,
    updatedOwnTechnicianlProfile,
    getAllTechniciansByPublic
    
};
export default tecniciansControllar;