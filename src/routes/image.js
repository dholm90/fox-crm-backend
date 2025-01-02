import express from 'express';
import { auth } from '../middleware/auth.js';
import Image from '../models/Image.js';
import { generateUploadURL, deleteFile } from '../utils/s3.js';

const router = express.Router();

// Get all images
router.get('/', async (req, res) => {
  try {
    const images = await Image.find().populate('uploadedBy', 'email');
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single image
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id).populate('uploadedBy', 'email');
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get presigned URL for upload
router.post('/upload-url', auth, async (req, res) => {
  try {
    const { fileType } = req.body;
    const { uploadURL, key } = await generateUploadURL(fileType);
    res.json({ uploadURL, key });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create image record after upload
router.post('/', auth, async (req, res) => {
  try {
    const image = new Image({
      ...req.body,
      uploadedBy: req.userId
    });
    await image.save();

    // After saving the image, try to add it to gallery automatically
    try {
      const gallery = await Gallery.findOne();
      if (gallery) {
        gallery.images.push(image._id);
        gallery.lastUpdatedBy = req.userId;
        await gallery.save();
      }
    } catch (galleryError) {
      console.error('Error adding image to gallery:', galleryError);
      // Don't fail the image upload if gallery update fails
    }

    res.status(201).json(image);
  } catch (error) {
    console.error('Image creation error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update image
router.put('/:id', auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    if (image.uploadedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(image, req.body);
    await image.save();
    res.json(image);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete image
router.delete('/:id', auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (image.uploadedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await deleteFile(image.key);
    await image.deleteOne();
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
