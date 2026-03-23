const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    specifications: {
      filtrationCapacity: String,
      noiseLevel: String,
      airFlowRate: String,
      coverage: String,
      powerConsumption: String,
      warranty: String,
      weight: String,
      dimensions: String,
      filterLife: String,
      sensors: [String],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountPrice: Number, // Store discounted price for quick access
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['Bedroom', 'Office', 'Living Room', 'Pro Series', 'Accessories'],
      index: true,
    },
    subcategory: String,
    brand: {
      type: String,
      default: 'VERVA',
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: String,
        order: Number,
      },
    ],
    mainImage: {
      type: String,
      required: true,
    },
    inventory: {
      quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      reorderLevel: {
        type: Number,
        default: 10,
      },
      warehouseLocation: String,
      lastRestockedAt: Date,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
      distribution: {
        five: { type: Number, default: 0 },
        four: { type: Number, default: 0 },
        three: { type: Number, default: 0 },
        two: { type: Number, default: 0 },
        one: { type: Number, default: 0 },
      },
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    variants: [
      {
        name: String,
        color: String,
        colorCode: String,
        sku: String,
      },
    ],
    features: [String],
    tags: [String],
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    relatedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    bundleWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    issuelsFaq: [
      {
        question: String,
        answer: String,
      },
    ],
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means official VERVA product
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isLimitedEdition: {
      type: Boolean,
      default: false,
    },
    launchDate: Date,
    discontinuedDate: Date,
    views: {
      type: Number,
      default: 0,
    },
    purchases: {
      type: Number,
      default: 0,
    },
    returns: {
      type: Number,
      default: 0,
    },
    metadata: {
      fuelType: String,
      material: String,
      season: String,
      occasion: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name
productSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Calculate discount price
  if (this.discountPercent > 0) {
    this.discountPrice = 
      this.price - (this.price * this.discountPercent) / 100;
  }

  next();
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, isActive: 1 });

// Populate reviews with limited data
productSchema.query.withReviews = function () {
  return this.populate({
    path: 'reviews',
    options: { limit: 5, sort: { createdAt: -1 } },
    select: 'rating comment user createdAt',
  });
};

module.exports = mongoose.model('Product', productSchema);
