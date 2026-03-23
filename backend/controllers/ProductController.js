const Product = require('../models/Product');
const Review = require('../models/Review');
const { ApiError } = require('../middleware/errorHandler');
const PaginationHelper = require('../utils/PaginationHelper');
const CacheHelper = require('../utils/CacheHelper');
const logger = require('../config/logger');

class ProductController {
  // Get all products with filters
  static async getProducts(req, res, next) {
    try {
      const { category, minPrice, maxPrice, search, sort, ...pagination } = req.query;

      // Check cache
      const cacheKey = `${category}-${minPrice}-${maxPrice}-${search}-${sort}`;
      const cachedProducts = await CacheHelper.getWithPrefix(CacheHelper.PRODUCTS, cacheKey);
      if (cachedProducts) {
        return res.status(200).json({
          success: true,
          code: 'PRODUCTS_FOUND',
          message: 'Products retrieved',
          data: cachedProducts,
          cached: true,
        });
      }

      const filter = { isActive: true };

      if (category) {
        filter.category = category;
      }

      if (search) {
        filter.$text = { $search: search };
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      const { page, limit, skip } = PaginationHelper.getPaginationParams(pagination);
      const sortObj = PaginationHelper.getSortObject(sort);

      const [products, totalCount] = await Promise.all([
        Product.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);

      const response = PaginationHelper.buildPaginationResponse(products, page, limit, totalCount);

      // Cache for 1 hour
      await CacheHelper.setWithPrefix(CacheHelper.PRODUCTS, cacheKey, response, 3600);

      res.status(200).json({
        success: true,
        code: 'PRODUCTS_FOUND',
        message: 'Products retrieved',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product
  static async getProduct(req, res, next) {
    try {
      const { slug } = req.params;

      // Check cache
      const cached = await CacheHelper.getWithPrefix(CacheHelper.PRODUCT, slug);
      if (cached) {
        return res.status(200).json({
          success: true,
          code: 'PRODUCT_FOUND',
          message: 'Product retrieved',
          data: cached,
        });
      }

      const product = await Product.findOne({ slug, isActive: true })
        .populate('reviews', 'rating title comment user createdAt -_id')
        .populate('relatedProducts', 'name slug price discountPrice mainImage -_id');

      if (!product) {
        throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      // Increment views
      product.views += 1;
      await product.save();

      // Cache for 1 hour
      await CacheHelper.setWithPrefix(CacheHelper.PRODUCT, slug, product.toObject(), 3600);

      res.status(200).json({
        success: true,
        code: 'PRODUCT_FOUND',
        message: 'Product retrieved',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get featured products
  static async getFeaturedProducts(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 6;

      const products = await Product.find({
        isActive: true,
        $or: [{ isFeatured: true }, { isBestseller: true }],
      })
        .limit(limit)
        .sort({ views: -1, 'ratings.average': -1 })
        .select('name slug price discountPrice mainImage category ratings.average -_id')
        .lean();

      res.status(200).json({
        success: true,
        code: 'FEATURED_PRODUCTS_FOUND',
        message: 'Featured products retrieved',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product recommendations
  static async getRecommendations(req, res, next) {
    try {
      const { productId } = req.params;
      const limit = parseInt(req.query.limit) || 4;

      const product = await Product.findById(productId).select('category relatedProducts');

      if (!product) {
        throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      let recommendations;

      if (product.relatedProducts.length > 0) {
        recommendations = await Product.find({
          _id: { $in: product.relatedProducts },
          isActive: true,
        })
          .limit(limit)
          .select('name slug price discountPrice mainImage', 'ratings.average -_id')
          .lean();
      } else {
        // Fallback: get similar category products
        recommendations = await Product.find({
          category: product.category,
          _id: { $ne: productId },
          isActive: true,
        })
          .limit(limit)
          .sort({ 'ratings.average': -1 })
          .select('name slug price discountPrice mainImage ratings.average -_id')
          .lean();
      }

      res.status(200).json({
        success: true,
        code: 'RECOMMENDATIONS_FOUND',
        message: 'Recommendations retrieved',
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get categories
  static async getCategories(req, res, next) {
    try {
      const categories = await Product.distinct('category', { isActive: true });

      res.status(200).json({
        success: true,
        code: 'CATEGORIES_FOUND',
        message: 'Categories retrieved',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  // Search products
  static async searchProducts(req, res, next) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        throw new ApiError(400, 'SEARCH_QUERY_REQUIRED', 'Search query is required');
      }

      const products = await Product.find(
        { $text: { $search: q }, isActive: true },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit))
        .select('name slug price discountPrice mainImage -_id')
        .lean();

      res.status(200).json({
        success: true,
        code: 'SEARCH_RESULTS_FOUND',
        message: 'Search results retrieved',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get low stock products (admin only)
  static async getLowStockProducts(req, res, next) {
    try {
      const products = await Product.find({
        $expr: { $lte: ['$inventory.quantity', '$inventory.reorderLevel'] },
      }).select('name sku category inventory -_id');

      res.status(200).json({
        success: true,
        code: 'LOW_STOCK_PRODUCTS_FOUND',
        message: 'Low stock products retrieved',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
