import type { Request, Response } from "express";
import authService from "./auth.service.js";
import { ResMsg } from "../../utils/ResMsg.js";
// import { pool } from "../../DB";
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";
import { pool } from "../../DB/index.js";

//create user
const createUser=async(req:Request,res:Response)=>{
try {
    const result = await authService.userIntoDB(res,req.body);
    ResMsg(res,201,true,"Registration successful",result);
  
} catch (error:any) {
    ResMsg(res,400,false,error.message);
}
};

//login user
const loginUser=async(req:Request,res:Response)=>{
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            ResMsg(res,400,false,"Email and password are required");
        }
            const user = await pool.query(
            `SELECT id, name, email, password, role
             FROM users
             WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

           if (user.rows.length === 0) {
            ResMsg(res,400,false,"Invalid email or password");
        }


        const userPassword = user.rows[0].password;

        // 3. Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            userPassword
        );

         if (!isPasswordValid) { ResMsg(res,401,false,"Invalid email or password");}
             const accessToken = jwt.sign(
            {
                id: user.rows[0].id,
                role: user.rows[0].role
            },
            'Rabbi01855452494',
            {
                expiresIn: "1h"
            }
        );

       const result={
         accessToken,
            data: {
                id: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email,
                role: user.rows[0].role
            }
       }
        ResMsg(res,200,true,"Login successful",result)
     
      
    } catch (error:any) {
            ResMsg(res,400,false,error.message);
    }
}
const authControllar={
    createUser,
    loginUser
};

export default authControllar;