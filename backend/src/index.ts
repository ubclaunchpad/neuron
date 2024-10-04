// backend/index.ts
import express, { Request, Response } from 'express';
import cors from "cors";
import bodyParser from "body-parser";
import {authRouter} from "./routes/authRouter.js";
import {authMiddleware} from "./middlewares/authMiddleware.js";

// set the default port to be 3001
const PORT: number = parseInt(process.env.PORT || '3001', 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(authMiddleware);
app.use(authRouter);

app.get('/', (_: Request, res: Response) =>  {
  if (!res.locals.user) {
    // This isn't needed - but for types. You can make a helper function for this
    res.send({ message: 'Hello Team Neuron! Please login' });
    return;
  }
  res.send({ message: `Hello Team Neuron! You are logged in as ${res.locals.user.email}` });
});

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});