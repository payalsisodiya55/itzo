import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'appzeto-master-product',
  api_key: process.env.CLOUDINARY_API_KEY || '162394882262924',
  api_secret: process.env.CLOUDINARY_API_SECRET || '4ez2ejhlzVxtoiiZ4ZOFuvX7V3E'
});

async function convertToWebp() {
  let next_cursor = null;
  let convertedCount = 0;
  let skippedCount = 0;

  console.log("Starting conversion to WebP...");

  do {
    try {
      const result = await cloudinary.api.resources({
        max_results: 100,
        next_cursor: next_cursor,
        resource_type: 'image'
      });
      
      const resources = result.resources;
      
      for (const resource of resources) {
        if (resource.format !== 'webp') {
          console.log(`Converting: ${resource.public_id}.${resource.format} -> webp`);
          try {
            await cloudinary.uploader.upload(resource.secure_url, {
              public_id: resource.public_id,
              format: 'webp',
              overwrite: true,
              invalidate: true
            });
            convertedCount++;
          } catch (uploadError) {
            console.error(`Failed to convert ${resource.public_id}:`, uploadError.message);
          }
        } else {
          skippedCount++;
        }
      }
      next_cursor = result.next_cursor;
    } catch (apiError) {
      console.error("API Error:", apiError.message);
      break;
    }
  } while (next_cursor);

  console.log(`\nConversion completed!`);
  console.log(`Converted: ${convertedCount} images`);
  console.log(`Skipped (already webp): ${skippedCount} images`);
}

convertToWebp().catch(console.error);
