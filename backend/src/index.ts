// backend/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { authRouter } from "./routes/authRouter.js";
// import { authMiddleware } from "./middlewares/authMiddleware.js";
import { auth } from "express-openid-connect";
import authConfig from "./config/auth.js";

// set the default port to be 3001
const PORT: number = parseInt(process.env.PORT || "3001", 10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(auth(authConfig));

// app.use(authMiddleware);
app.use("/auth", authRouter);

app.get("/", (req: Request, res: Response) => {
  res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

app.listen(PORT, () => {
  console.log(`Neuron backend server listening on ${PORT}`);
});
