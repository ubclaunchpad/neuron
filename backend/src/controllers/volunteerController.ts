// volunteerController.ts

import { Request, Response } from 'express';
import connectionPool from '../config/database.js';


// Get volunteer availability 
export const getVolunteerAvailability = async (req: Request, res: Response) => {
    const volunteerId = req.params.id;
    const query = `SELECT availability FROM Volunteers WHERE volunteer_id = ?`;

    connectionPool.query(query, [volunteerId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Volunteer not found' });
        }

        // Assuming availability is stored as JSON
        res.json({
            volunteerId,
            availability: JSON.parse(results[0].availability),
        });
    });
};
