import express from 'express';
import { auth } from '../middleware/auth.js';
import Event from '../models/Event.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import Menu from '../models/Menu.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    // Get counts from all collections in parallel
    const [events, menuItems, categories, menus] = await Promise.all([
      Event.countDocuments(),
      MenuItem.countDocuments(),
      Category.countDocuments(),
      Menu.countDocuments()
    ]);

    res.json({
      events,
      menuItems,
      categories,
      menus
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

export default router;
