import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/event.js';
import menuItemRoutes from './routes/menuItem.js';
import menuRoutes from './routes/menu.js';
import tagRoutes from './routes/tag.js';
import categoryRoutes from './routes/category.js';
import imageRoutes from './routes/image.js';
import galleryRoutes from './routes/gallery.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/gallery', galleryRoutes); // Changed from plural to singular

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
