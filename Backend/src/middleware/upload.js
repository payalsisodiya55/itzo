import multer from 'multer';
import os from 'os';

const storage = multer.memoryStorage();

export const upload = multer({ storage });

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
});

export const diskUpload = multer({ storage: diskStorage });

