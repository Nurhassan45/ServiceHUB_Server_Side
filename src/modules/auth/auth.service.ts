import bcrypt from "bcryptjs";
// import { pool } from "../../DB";
import { ResMsg } from "../../utils/ResMsg.js";
import { pool } from "../../DB/index.js";

const userIntoDB=async(res:any,payLoad:any)=>{
try {
      const { name, email, password, phone, role } = payLoad;
           if (!name || !email || !password)
        { ResMsg(res,400,false,"Name, email and password are required");}
        if (typeof password !== "string" || password.length < 8)
       { ResMsg(res,400,false,"Password must be at least 8 characters");}
        const userRole = role || "customer";

        if (!["customer", "technician"].includes(userRole))
            { ResMsg(res,400,false, "Invalid role");}
          // 4. Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 5. Insert user into database
        const result = await pool.query(
            `INSERT INTO users (name, email, password, phone, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, phone, role, created_at`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                hashedPassword,
                phone || null,
                userRole
            ]
        );
    
    return result.rows[0];

} catch (error:any) {
   ResMsg(res,400,false,error.message);
}
};



const authService={
    userIntoDB,

};

export default authService;