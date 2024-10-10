// backend/index.ts
import express, { Request, Response } from 'express';
import cors from "cors";
import bodyParser from "body-parser";
import classRoutes from "./routes/classRoutes.js"

// set default port to be 3001
const PORT: number = parseInt(process.env.PORT || '3001', 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/", classRoutes);


app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});