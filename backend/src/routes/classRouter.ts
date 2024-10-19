import express from "express";
import { getClassesByDay } from "../controllers/classController.js";

const classRouter = express.Router();

classRouter.get("/schedule/:day", async (req, res) => {
  await getClassesByDay(req, res);
});

export default classRouter;
