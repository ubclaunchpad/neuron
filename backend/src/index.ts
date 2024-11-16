// backend/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";

import classRouter from "./routes/classRoutes.js"
import shiftRouter from "./routes/shiftRoutes.js"
import volunteerRouter from './routes/volunteerRoutes.js';
import instructorRouter from './routes/instructorRoutes.js';
import scheduleRouter from './routes/scheduleRoutes.js';
import { authRouter } from "./routes/authRouter.js";

// set default port to be 3001
const PORT: number = parseInt(process.env.PORT || "3001", 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send({ message: "Hello Team Neuron!" });
});

// define all routes
app.use('/volunteer', volunteerRouter);
app.use('/instructors', instructorRouter);
app.use("/classes", classRouter);
app.use("/classes/shifts", shiftRouter);
app.use('/schedules', scheduleRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});
