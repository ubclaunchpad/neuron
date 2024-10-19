// backend/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";

// volunteer routes
import volunteerRouter from './routes/volunteerRoutes.js';
import instructorRouter from './routes/instructorRoutes.js';
import { authRouter } from "./routes/authRouter.js";
// import { authMiddleware } from "./middlewares/authMiddleware.js";

// set the default port to be 3001
const PORT: number = parseInt(process.env.PORT || "3001", 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// app.use(authMiddleware);
app.use("/auth", authRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Working");
});

// define all routes
app.use('/volunteer', volunteerRouter);
app.use('/instructors', instructorRouter);

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});
