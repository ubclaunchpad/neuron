// Interfaces
export interface Instructor {
    instructor_id: string; 
    fk_user_id?: string;   // Foreign key (optional, since it might be nullable)
    f_name: string;       
    l_name: string; 
    email: string;      
  }

export interface Class {
    class_id: number,
    fk_instructor_id: string,
    class_name: string,
    instructions: string,
    zoom_link: string,
    start_date: Date,
    end_date: Date,
}