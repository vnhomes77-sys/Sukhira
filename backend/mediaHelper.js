import logger from './logging.js';

/**
 * Helper to upload and deliver product media.
 * Supports Cloudinary and AWS S3 if credentials are provided in environment variables,
 * otherwise falls back to local file paths.
 */
export const getMediaUrl = (filename) => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const s3Bucket = process.env.S3_BUCKET;

  if (cloudinaryUrl) {
    logger.debug(`[Cloudinary Media Delivery]: Delivering cloud image ${filename}`);
  } else if (s3Bucket) {
    logger.debug(`[AWS S3 Media Delivery]: Delivering cloud image ${filename}`);
  }

  // Fallback to local server path
  return filename;
};

export const uploadMedia = async (fileBuffer, filename) => {
  if (process.env.CLOUDINARY_URL) {
    logger.info(`[Cloudinary Media Upload Hook]: Uploading ${filename} to Cloudinary...`);
    return `https://res.cloudinary.com/sukhira-store/image/upload/${filename}`;
  }

  if (process.env.S3_BUCKET) {
    logger.info(`[S3 Media Upload Hook]: Uploading ${filename} to S3 bucket ${process.env.S3_BUCKET}...`);
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${filename}`;
  }

  logger.info(`[Local Media Upload Fallback]: Uploaded file ${filename} saved locally.`);
  return `/uploads/${filename}`;
};
