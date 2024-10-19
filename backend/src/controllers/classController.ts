import { Request, Response } from "express";
import ClassesModel from "../models/classModel.js";

const classModel = new ClassesModel();

export async function getClassesByDay(req: Request, res: Response) {
  const day = req.params.day;
  if (!day) {
    return res.status(400).json({
      error: "Missing required parameter: 'day'",
    });
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
  if (!regex.test(day)) {
    return res.status(400).json({
      error: "Invalid day format. Please use YYYY-MM-DD.",
    });
  }
  try {
    const classes = await classModel.getClassesByDay(day);
    res.status(200).json(classes);
  } catch (error: any) {
    return res.status(error.status).json({
      error: error.message,
    });
  }
}
