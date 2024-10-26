import { Request, Response } from 'express';
import ClassesModel from '../models/classModel.js';
import ScheduleModel from '../models/scheduleModel.js';
import { Class, Schedule } from '../common/interfaces.js'

export default class ClassesController {

	public async getAllClasses(req: Request, res: Response){
		const classesModel = new ClassesModel();
		
		try {
			const classes = await classesModel.getClasses();
			res.status(200).json(classes);
		} catch (error) {
			return res.status(500).json({
				error: `Internal server error: ${error}`
			});
		}
	}

	 // New method to add a class
	 public async addClass(req: Request, res: Response) {
        const classesModel = new ClassesModel();
		const scheduleModel = new ScheduleModel();
        const { fk_instructor_id, class_name, instructions, zoom_link, start_date, end_date } = req.body;

        // Input validation
        if (!fk_instructor_id || !class_name || !start_date || !end_date) {
            return res.status(400).json({
                error: 'Missing required fields: fk_instructor_id, class_name, start_date, and end_date are required.'
            });
        }

        try {
            const newClass: Class = {
				class_id: 0, 
				fk_instructor_id,
				class_name,
				instructions: instructions,
				zoom_link: zoom_link,
				start_date: start_date,
				end_date: end_date
			};

            const result = await classesModel.addClass(newClass);
            const newClassId = result.class_id;
			const addedClass = {
                class_id: newClassId,
                fk_instructor_id,
                class_name,
                instructions,
                zoom_link,
                start_date,
                end_date
            };

            // Create a schedule object using the Schedule interface
            // const newSchedule: Schedule = {
            //     schedule_id: 0,
            //     fk_class_id: newClassId,
			// 	// Not sure how we are going to get these values
            //     // day_of_week,
            //     // start_time,
            //     // end_time
            // };

            // await scheduleModel.addScheduleToDB(newSchedule);
			return res.status(201).json({
				message: 'Class added successfully',
				data: addedClass
			});
        } catch (error) {
            return res.status(500).json({
                error: `Internal server error: ${error}`
            });
        }
    }
}