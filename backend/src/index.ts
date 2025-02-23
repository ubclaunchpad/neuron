// backend/index.ts
import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import morgan from 'morgan';
import { Routes } from "./routes/routes.js";
import { registerRoutes } from "./utils/routeUtils.js";
import ApproveCoveragesModel from "./models/approveCoveragesModel.js";

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

// Register all routes
registerRoutes(app, Routes);

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});

// Example usage of ApproveCoveragesModel
const approveCoveragesModel = new ApproveCoveragesModel();
app.post("/approve-volunteer-coverage", async (req: Request, res: Response) => {
  const { request_id } = req.body;

  try {
    await approveCoveragesModel.approveVolunteerCoverage(request_id);
    res.status(200).json({ message: "Volunteer coverage approved successfully." });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});