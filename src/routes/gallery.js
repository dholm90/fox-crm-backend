import express from 'express';
import { auth } from '../middleware/auth.js';
import Gallery from '../models/Gallery.js';
import Image from '../models/Image.js';

const router = express.Router();

// Helper function to get or create gallery with populated images
const getOrCreateGallery = async (userId) => {
  try {
    let gallery = await Gallery.findOne().populate({
      path: 'images',
      select: 'title description url createdAt'
    });
    
    if (!gallery) {
      console.log('Creating new gallery for user:', userId);
      gallery = new Gallery({ 
        images: [],
        lastUpdatedBy: userId
      });
      await gallery.save();
      gallery = await Gallery.findById(gallery._id).populate({
        path: 'images',
        select: 'title description url createdAt'
      });
    }
    
    return gallery;
  } catch (error) {
    console.error('Error in getOrCreateGallery:', error);
    throw error;
  }
};

router.get('/', async (req, res) => {
  try {
    const gallery = await Gallery.findOne().populate({
      path: 'images',
      select: 'title description url createdAt'
    });

    if (!gallery) {
      // Create a new gallery if none exists
      const newGallery = new Gallery({
        images: [],
        lastUpdatedBy: req.userId || null
      });
      await newGallery.save();
      return res.json(newGallery);
    }

    res.json(gallery);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add image to gallery
router.post('/images/:imageId', auth, async (req, res) => {
  try {
    console.log('Adding image to gallery:', req.params.imageId);
    
    // Verify image exists
    const image = await Image.findById(req.params.imageId);
    if (!image) {
      console.log('Image not found:', req.params.imageId);
      return res.status(404).json({ message: 'Image not found' });
    }

    let gallery = await getOrCreateGallery(req.userId);
    console.log('Current gallery state:', gallery);

    // Check if image is already in gallery
    if (!gallery.images.includes(req.params.imageId)) {
      gallery.images.push(req.params.imageId);
      gallery.lastUpdatedBy = req.userId;
      await gallery.save();
    }

    // Fetch updated gallery with populated images
    const updatedGallery = await Gallery.findById(gallery._id)
      .populate({
        path: 'images',
        select: 'title description url createdAt'
      });

    console.log('Updated gallery:', updatedGallery);
    res.json(updatedGallery);
  } catch (error) {
    console.error('Error adding image to gallery:', error);
    res.status(400).json({ message: error.message });
  }
});

// Remove image from gallery
router.delete('/images/:imageId', auth, async (req, res) => {
  try {
    const gallery = await Gallery.findOne();
    
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    gallery.images = gallery.images.filter(
      image => image.toString() !== req.params.imageId
    );
    gallery.lastUpdatedBy = req.userId;
    
    await gallery.save();
    
    const populatedGallery = await Gallery.findById(gallery._id)
      .populate({
        path: 'images',
        select: 'title description url createdAt'
      });
    
    res.json(populatedGallery);
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Reorder images
router.put('/reorder', auth, async (req, res) => {
  try {
    const { imageIds } = req.body;
    const gallery = await Gallery.findOne();
    
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Verify all images exist in the gallery
    const validOrder = imageIds.every(id => 
      gallery.images.some(imgId => imgId.toString() === id)
    );

    if (!validOrder || imageIds.length !== gallery.images.length) {
      return res.status(400).json({ message: 'Invalid image order provided' });
    }

    gallery.images = imageIds;
    gallery.lastUpdatedBy = req.userId;
    await gallery.save();
    
    const populatedGallery = await Gallery.findById(gallery._id)
      .populate({
        path: 'images',
        select: 'title description url createdAt'
      });
    
    res.json(populatedGallery);
  } catch (error) {
    console.error('Reorder images error:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
