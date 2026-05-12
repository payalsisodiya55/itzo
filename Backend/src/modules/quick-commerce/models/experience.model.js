import mongoose from 'mongoose';

const quickExperienceSectionSchema = new mongoose.Schema({
  pageType: { type: String, enum: ['home', 'header'], default: 'home', index: true },
  headerId: { type: mongoose.Schema.Types.ObjectId, ref: 'quick_category', default: null, index: true },
  displayType: { type: String, enum: ['banners', 'categories', 'subcategories', 'products'], required: true },
  title: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, default: 0 },
}, { timestamps: true });

quickExperienceSectionSchema.index({ pageType: 1, headerId: 1, status: 1, order: 1 });

export const QuickExperienceSection = mongoose.model('quick_experience_section', quickExperienceSectionSchema, 'quick_experience_sections');
