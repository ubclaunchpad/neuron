import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

// multer for uploading images
export const imageUploadMiddleware = multer({ 
    storage,
    fileFilter: (_req, file, cb) => {
        // Allowed ext
        const allowedExts = ['jpeg', 'jpg', 'png', 'gif'];
        // Check ext
        const extname = allowedExts.includes(path.extname(file.originalname).replace('.', '').toLowerCase());
        // Check mime
        const mimetype = allowedExts.map(ext => `image/${ext}`).includes(file.mimetype);

        if(mimetype && extname){
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
}).single('image');