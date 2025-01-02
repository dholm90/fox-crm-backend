import express from 'express';
import { auth } from '../middleware/auth.js';
import Gallery from '../models/Gallery.js';
import Image from '../models/Image.js';

const router = express.Router();

// Helper function to get or create gallery with populated images
const getOrCreateGallery = async (userId) => {
  let gallery = await Gallery.findOne().populate({
    path: 'images',
    select: 'title description url createdAt'
  });
  
  if (!gallery) {
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
};

// Get the gallery
router.get('/', async (req, res) => {
  try {
    const gallery = await getOrCreateGallery(req.userId);
    console.log('Fetched gallery:', gallery); // Debug log
    res.json(gallery);
  } catch (error) {
    console.error('Gallery fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add image to gallery
router.post('/images/:imageId', auth, async (req, res) => {
  try {
    let gallery = await getOrCreateGallery(req.userId);
    
    // Verify image exists
    const image = await Image.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    if (!gallery.images.includes(req.params.imageId)) {
      gallery.images.push(req.params.imageId);
    }
    gallery.lastUpdatedBy = req.userId;
    
    await gallery.save();
    
    const populatedGallery = await Gallery.findById(gallery._id)
      .populate({
        path: 'images',
        select: 'title description url createdAt'
      });
    
    console.log('Updated gallery:', populatedGallery); // Debug log
    res.json(populatedGallery);
  } catch (error) {
    console.error('Add image error:', error);
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
