// backend/index.ts
import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import morgan from 'morgan';
import { registerRoutes, Routes } from "./routes/routes.js";

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
