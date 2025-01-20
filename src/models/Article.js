import mongoose from 'mongoose'
import slugify from 'slugify'

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: false
  },
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Generate slug before saving
articleSchema.pre('save', async function(next) {
  if (this.isModified('title')) {
    // Generate the base slug
    let baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true
    })

    // Check if the slug exists
    let slug = baseSlug
    let counter = 1
    let exists = true

    while (exists) {
      // Check if there's another document with the same slug
      const doc = await this.constructor.findOne({ slug, _id: { $ne: this._id } })
      
      if (!doc) {
        exists = false
      } else {
        // If slug exists, append counter and try again
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    this.slug = slug
  }
  next()
})

export default mongoose.model('Article', articleSchema)
