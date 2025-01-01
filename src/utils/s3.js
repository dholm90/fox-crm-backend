import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Verify credentials are available
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Log configuration (without sensitive data)
console.log('S3 Configuration:', {
  region: process.env.AWS_REGION,
  bucketName: process.env.AWS_BUCKET_NAME,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
});

// Create S3 client with explicit credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export const generateUploadURL = async (fileType) => {
  try {
    const key = `uploads/${uuidv4()}${getFileExtension(fileType)}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType
    });

    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    console.log('Generated upload URL:', {
      key,
      bucket: process.env.AWS_BUCKET_NAME,
      contentType: fileType
    });

    return { uploadURL, key };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
};

export const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    console.log('Deleted file:', { key });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Helper function to get file extension from mime type
const getFileExtension = (mimeType) => {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
  };
  return extensions[mimeType] || '.jpg';
};
