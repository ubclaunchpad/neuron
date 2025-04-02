import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import morgan from 'morgan';
import { NEURON_ENV, PORT } from "./config/environment.js";
import { Routes } from "./routes/routes.js";
import { registerRoutes } from "./utils/routeUtils.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('tiny', {
  skip: () => { 
    return NEURON_ENV === 'production'; 
  },
})); 

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Hello Team Neuron!" });
});

// Register all routes
registerRoutes(app, Routes);

app.listen(PORT, (err) => {
  if (err) {
    console.log(`Error starting server: ${err}`);
    process.exit(1);
  }

  console.log(`Neuron backend server listening on ${PORT}`);
});
