import express from 'express'
import mongoose from 'mongoose'
import { auth } from '../middleware/auth.js'
import Article from '../models/Article.js'

const router = express.Router()

// Public Routes - MUST come before protected routes with params
router.get('/public', async (req, res) => {
  try {
    const articles = await Article.find({ published: true })
      .sort({ publishedAt: -1 })
      .populate('author', 'email')
      .select('title slug excerpt coverImage publishedAt author')
    
    res.json(articles)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles' })
  }
})

router.get('/public/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      published: true
    }).populate('author', 'email')

    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    res.json(article)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article' })
  }
})

// Protected Routes
router.use(auth) // Apply auth middleware to all routes below this line

router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ author: req.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'email')
    
    res.json(articles)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, published } = req.body

    const article = new Article({
      title,
      excerpt,
      content,
      coverImage,
      published,
      publishedAt: published ? new Date() : null,
      author: req.userId
    })

    await article.save()
    res.status(201).json(article)
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.slug) {
      res.status(400).json({ message: 'An article with this title already exists' })
    } else {
      res.status(500).json({ message: 'Error creating article' })
    }
  }
})

router.put('/:id/publish', async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      author: req.userId
    })

    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    article.published = !article.published
    article.publishedAt = article.published ? new Date() : null

    await article.save()
    res.json(article)
  } catch (error) {
    res.status(500).json({ message: 'Error updating article' })
  }
})

router.get('/:idOrSlug', async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.idOrSlug)
    
    const query = {
      [isObjectId ? '_id' : 'slug']: req.params.idOrSlug,
      author: req.userId
    }

    const article = await Article.findOne(query)
      .populate('author', 'email')

    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    res.json(article)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, published } = req.body
    
    const article = await Article.findOne({
      _id: req.params.id,
      author: req.userId
    })

    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    // Update fields
    article.title = title
    article.excerpt = excerpt
    article.content = content
    article.coverImage = coverImage
    
    // Handle published state change
    if (published !== article.published) {
      article.published = published
      article.publishedAt = published ? new Date() : null
    }

    await article.save()
    res.json(article)
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.slug) {
      res.status(400).json({ message: 'An article with this title already exists' })
    } else {
      res.status(500).json({ message: 'Error updating article' })
    }
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({
      _id: req.params.id,
      author: req.userId
    })

    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    res.json({ message: 'Article deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article' })
  }
})

export default router
