// backend/index.ts
import express, { Request, Response } from 'express';
import cors from "cors";
import bodyParser from "body-parser";
import getUsersFromDB from './models/classModel.js';

// set default port to be 3001
const PORT: number = parseInt(process.env.PORT || '3001', 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.get('/', async (req: Request, res: Response) => {
  try {
    const users = await getUsersFromDB(); 
    res.send( { 
      message: "Hello Team Neuron!",
      users: users[0].id.toString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// app.get('/', (req: Request, res: Response) =>  {
//   res.send({ message: "Hello Team Neuron!" });
// });


app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});