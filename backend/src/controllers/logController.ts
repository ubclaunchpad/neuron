import { Response } from "express";
import { AuthenticatedRequest } from "../common/types.js";
import { logModel } from "../config/models.js";

export async function getLogs(req: AuthenticatedRequest, res: Response) {
    const { page, perPage, q } = req.query;

    const logs = await logModel.getLogsForList({ 
        page: parseInt(page as string), 
        perPage: parseInt(perPage as string), 
        search: q as string,
    });

    res.status(200).json(logs);
}