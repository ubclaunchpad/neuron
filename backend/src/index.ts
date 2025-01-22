// backend/index.ts
import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import morgan from 'morgan';

import adminRouter from "./routes/adminRoutes.js";
import authRouter from "./routes/authRoutes.js";
import classRouter from "./routes/classRoutes.js";
import imageRouter from "./routes/imageRoutes.js";
import instructorRouter from "./routes/instructorRoutes.js";
import scheduleRouter from "./routes/scheduleRoutes.js";
import shiftRouter from "./routes/shiftRoutes.js";
import userRouter from "./routes/userRoutes.js";
import volunteerRouter from "./routes/volunteerRoutes.js";

// set default port to be 3001
const PORT: number = parseInt(process.env.PORT || "3001", 10);
const ENVIRONMENT: string = process.env.NEURON_ENV || 'development';
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('tiny', {
  skip: () => { 
    return ENVIRONMENT === 'production'; 
  },
})); 

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Hello Team Neuron!" });
});

// define all routes
app.use("/volunteer", volunteerRouter);
app.use("/admin", adminRouter);
app.use("/instructors", instructorRouter);
app.use("/classes", classRouter);
app.use("/classes/shifts", shiftRouter);
app.use('/schedules', scheduleRouter);
app.use("/user", userRouter);
app.use("/image", imageRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});
