import express from 'express';
import { auth } from '../middleware/auth.js';
import Menu from '../models/Menu.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find().populate({
      path: 'menuItems',
      populate: [
        { path: 'category' },
        { path: 'tags' }
      ]
    });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get menu by slug
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const menu = await Menu.findOne({ slug: req.params.slug }).populate('menuItems');
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).populate('menuItems');
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const menu = new Menu(req.body);
    await menu.save();
    res.status(201).json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.json({ message: 'Menu deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/menu-items/:menuItemId', auth, async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    menu.menuItems.push(req.params.menuItemId);
    await menu.save();
    res.json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id/menu-items/:menuItemId', auth, async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    menu.menuItems = menu.menuItems.filter(item => item.toString() !== req.params.menuItemId);
    await menu.save();
    res.json(menu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
