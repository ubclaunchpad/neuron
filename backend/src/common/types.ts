export interface Instructor {
    instructor_id: string; 
    fk_user_id?: string;   // Foreign key (optional, since it might be nullable)
    f_name: string;       
    l_name: string; 
    email: string;      
  }