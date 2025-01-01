import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Ensure only one gallery instance exists
gallerySchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      const error = new Error('Only one gallery instance can exist');
      next(error);
    }
  }
  next();
});

export default mongoose.model('Gallery', gallerySchema);
