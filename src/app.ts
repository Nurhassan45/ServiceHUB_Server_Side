
import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./modules/auth/auth.router.js";
import serviceRouter from "./modules/services/services.router.js";
import techniciansRouter from "./modules/technicians/technicians.routes.js";
import bookingRouter from "./modules/bookings/bookings.routes.js";
import reviewRouter from "./modules/reviews/reviews.routes.js";
import paymentRouter from "./modules/payments/payments.route.js";

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/services", serviceRouter);
app.use("/api/technicians", techniciansRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/payments", paymentRouter);

export default app;
