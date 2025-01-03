import express from 'express';
import { auth } from '../middleware/auth.js';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    const menuItems = await MenuItem.find().populate(['tags', 'category']);
    res.json(menuItems.slice(0, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// IMPORTANT: Place slug route BEFORE :id route
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({ slug: req.params.slug }).populate(['tags', 'category']);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get menu items by tag
router.get('/tag/:tagId', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ tags: req.params.tagId }).populate(['tags', 'category']);
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get menu items by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ category: req.params.categoryId }).populate(['tags', 'category']);
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single menu item by ID (keep for backward compatibility)
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate(['tags', 'category']);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Create menu item
router.post('/', auth, async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update menu item
router.put('/:id', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { 
      new: true 
    }).populate(['tags', 'category']);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete menu item
router.delete('/:id', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Add tag to menu item
router.post('/:id/tags/:tagId', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    menuItem.tags.push(req.params.tagId);
    await menuItem.save();
    const updatedMenuItem = await MenuItem.findById(req.params.id).populate(['tags', 'category']);
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove tag from menu item
router.delete('/:id/tags/:tagId', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    menuItem.tags = menuItem.tags.filter(tag => tag.toString() !== req.params.tagId);
    await menuItem.save();
    const updatedMenuItem = await MenuItem.findById(req.params.id).populate(['tags', 'category']);
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



export default router;
