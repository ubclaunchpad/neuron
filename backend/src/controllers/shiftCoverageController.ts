// backend/src/controllers/shiftCoverageController.ts
import { Request, Response } from "express";
import ApproveCoveragesModel from "../models/approveCoveragesModel.js";

const approveCoveragesModel = new ApproveCoveragesModel();

export const approveVolunteerCoverage = async (req: Request, res: Response) => {
    const { request_id } = req.body;

    try {
        await approveCoveragesModel.approveVolunteerCoverage(request_id);
        res.status(200).json({ message: "Volunteer coverage approved successfully." });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};