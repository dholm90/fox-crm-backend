import express from 'express';
import { auth } from '../middleware/auth.js';
import Gallery from '../models/Gallery.js';

const router = express.Router();

// Get the gallery
router.get('/', async (req, res) => {
  try {
    const gallery = await Gallery.findOne()
      .populate({
        path: 'images',
        select: 'title description url createdAt'
      });
    
    if (!gallery) {
      // Create a new gallery if it doesn't exist
      const newGallery = new Gallery({ 
        images: [],
        lastUpdatedBy: req.userId || null 
      });
      await newGallery.save();
      return res.json(newGallery);
    }
    
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add image to gallery
router.post('/images/:imageId', auth, async (req, res) => {
  try {
    let gallery = await Gallery.findOne();
    
    if (!gallery) {
      gallery = new Gallery({
        images: [req.params.imageId],
        lastUpdatedBy: req.userId
      });
    } else {
      if (!gallery.images.includes(req.params.imageId)) {
        gallery.images.push(req.params.imageId);
      }
      gallery.lastUpdatedBy = req.userId;
    }
    
    await gallery.save();
    
    const populatedGallery = await Gallery.findById(gallery._id)
      .populate({
        path: 'images',
        select: 'title description url createdAt'
      });
    
    res.json(populatedGallery);
  } catch (error) {
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
    res.status(400).json({ message: error.message });
  }
});

export default router;
