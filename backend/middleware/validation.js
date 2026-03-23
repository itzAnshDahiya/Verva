const Joi = require('joi');
const { ApiError } = require('./errorHandler');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        params: req.params,
        query: req.query,
      },
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(
        new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', errors)
      );
    }

    // Replace request data with validated data
    req.body = value.body || {};
    req.params = value.params || {};
    req.query = value.query || {};

    next();
  };
};

// Predefined schemas
const schemas = {
  // Auth
  signup: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50).trim().required(),
      email: Joi.string().email().lowercase().required(),
      password: Joi.string().min(6).required(),
      phone: Joi.string().optional(),
    }).required(),
  }),

  login: Joi.object({
    body: Joi.object({
      email: Joi.string().email().lowercase().required(),
      password: Joi.string().required(),
    }).required(),
  }),

  // Product
  createProduct: Joi.object({
    body: Joi.object({
      sku: Joi.string().uppercase().required(),
      name: Joi.string().max(200).required(),
      description: Joi.string().required(),
      price: Joi.number().min(0).required(),
      category: Joi.string().valid('Bedroom', 'Office', 'Living Room', 'Pro Series', 'Accessories').required(),
      mainImage: Joi.string().required(),
      images: Joi.array().items(Joi.object({
        url: Joi.string().required(),
        alt: Joi.string().optional(),
      })),
      inventory: Joi.object({
        quantity: Joi.number().min(0).required(),
        reorderLevel: Joi.number().default(10),
      }).required(),
    }).required(),
  }),

  // Order
  createOrder: Joi.object({
    body: Joi.object({
      items: Joi.array().items(Joi.object({
        product: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        variant: Joi.string().optional(),
      })).required(),
      shippingAddress: Joi.object({
        fullName: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        addressLine1: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
      }).required(),
      paymentMethod: Joi.string().valid('stripe', 'razorpay', 'paypal', 'cod').required(),
    }).required(),
  }),

  // Review
  createReview: Joi.object({
    body: Joi.object({
      rating: Joi.number().min(1).max(5).required(),
      title: Joi.string().max(100).required(),
      comment: Joi.string().min(10).max(5000).required(),
    }).required(),
    params: Joi.object({
      productId: Joi.string().required(),
    }).required(),
  }),

  // Pagination
  pagination: Joi.object({
    query: Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(20),
      sort: Joi.string().default('-createdAt'),
    }),
  }),

  // Coupon
  applyCoupon: Joi.object({
    body: Joi.object({
      code: Joi.string().uppercase().required(),
    }).required(),
  }),
};

module.exports = { validate, schemas };
