// backend/index.js

const express = require("express");

// set default port to be 3001
const PORT = process.env.PORT || 3001;
const app = express();

app.get("/api", (_, res) => {
  res.send("Hello Neuron!");
});

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});