// backend/index.ts
import express, { Request, Response } from 'express';
import cors from "cors";
import bodyParser from "body-parser";

// routers
import volunteerRouter from './routes/volunteerRoutes.js';
import shiftRouter from './routes/shiftRoutes.js';

// set default port to be 3001
const PORT: number = parseInt(process.env.PORT || '3001', 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req: Request, res: Response) =>  {
  res.send({ message: "Hello Team Neuron!" });
});

// all changes in the volunteers table
app.use('/volunteer', volunteerRouter);

// all changes in shifts table
app.use('/shift', shiftRouter);

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});