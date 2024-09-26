// backend/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

// set default port to be 3001
const PORT = process.env.PORT || 3001;
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (_, res) => {
  res.send({ message: "Hello Team Neuron!" });
});

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});