import { uploadBufferDetailed } from './src/services/cloudinary.service.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'e:/itzo folder/itzo/Backend/.env' });

const dummyPdfBuffer = Buffer.from('%PDF-1.4 ... dummy content');

uploadBufferDetailed(dummyPdfBuffer, { folder: 'careers/resumes', resourceType: 'raw' })
  .then(res => {
    console.log("Upload response for raw:");
    console.log(res);
    return uploadBufferDetailed(dummyPdfBuffer, { folder: 'careers/resumes', resourceType: 'auto' });
  })
  .then(res => {
    console.log("Upload response for auto:");
    console.log(res);
    process.exit(0);
  })
  .catch(err => {
    console.error("Upload failed:", err);
    process.exit(1);
  });
