// backend/index.ts
import express, { Request, Response } from 'express';
import cors from "cors";
import bodyParser from "body-parser";

// volunteer routes
import volunteerRouter from './routes/volunteerRoutes.js';
import instructorRouter from './routes/instructorRoutes.js';

// set default port to be 3001
const PORT: number = parseInt(process.env.PORT || '3001', 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req: Request, res: Response) =>  {
  res.send({ message: "Hello Team Neuron!" });
});

// define all routes
app.use('/volunteer', volunteerRouter);
app.use('/instructors', instructorRouter);

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});