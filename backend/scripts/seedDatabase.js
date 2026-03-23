require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const User = require('./models/User');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');
const logger = require('./config/logger');

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Starting database seed...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
    ]);

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@verva.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      phone: '+919876543210',
      role: 'admin',
      isEmailVerified: true,
    });
    await admin.save();
    logger.info('Admin user created');

    // Create sample products
    const products = [
      {
        sku: 'VERVA-BEDROOM-001',
        name: 'VERVA Bedroom',
        description: 'Perfect for bedrooms up to 25m². Ultra-silent 42dB operation for peaceful sleep.',
        price: 24999,
        discountPercent: 0,
        category: 'Bedroom',
        mainImage: 'assets/img/bedroom_purifier.png',
        images: [
          { url: 'assets/img/bedroom_purifier.png', alt: 'Main view' },
        ],
        inventory: { quantity: 50, reorderLevel: 10 },
        specifications: {
          filtrationCapacity: 'HEPA H13',
          noiseLevel: '28-42 dB',
          airFlowRate: '150 m³/h',
          coverage: '25m²',
          powerConsumption: '35W',
          warranty: '2 Years',
          weight: '3.5 kg',
          dimensions: '45×30×25 cm',
          filterLife: '12 months',
          sensors: ['PM2.5', 'PM10', 'VOCs'],
        },
        features: [
          'Sleep mode for whisper-quiet operation',
          '99.97% particle filtration',
          'Smart auto-adjust sensors',
          'Energy efficient',
          'Eco-friendly materials',
        ],
        isBestseller: true,
        ratings: { average: 4.9, count: 1240, distribution: { five: 1000, four: 200, three: 30, two: 5, one: 5 } },
      },
      {
        sku: 'VERVA-OFFICE-001',
        name: 'VERVA Office',
        description: 'Ideal for offices and workspaces up to 50m². Smart sensor technology adapts to air quality.',
        price: 34999,
        discountPercent: 10,
        category: 'Office',
        mainImage: 'assets/img/office_purifier.png',
        images: [
          { url: 'assets/img/office_purifier.png', alt: 'Main view' },
        ],
        inventory: { quantity: 30, reorderLevel: 10 },
        specifications: {
          filtrationCapacity: 'HEPA H13',
          noiseLevel: '32-48 dB',
          airFlowRate: '250 m³/h',
          coverage: '50m²',
          powerConsumption: '45W',
          warranty: '2 Years',
          weight: '4.5 kg',
          dimensions: '55×35×30 cm',
          filterLife: '12 months',
          sensors: ['PM2.5', 'PM10', 'VOCs', 'CO₂'],
        },
        features: [
          'Smart air quality display',
          'Real-time PM2.5 monitoring',
          'Whisper-quiet during work hours',
          'Auto-intensify when pollution detected',
          'Perfect for allergies and asthma',
        ],
        isNewArrival: true,
        ratings: { average: 4.8, count: 986, distribution: { five: 800, four: 150, three: 25, two: 5, one: 6 } },
      },
      {
        sku: 'VERVA-PRO-001',
        name: 'VERVA Pro',
        description: 'Professional-grade for living rooms and large spaces up to 80m². Multi-stage filtration system.',
        price: 49999,
        discountPercent: 5,
        category: 'Living Room',
        mainImage: 'assets/img/pro_purifier.png',
        images: [
          { url: 'assets/img/pro_purifier.png', alt: 'Main view' },
        ],
        inventory: { quantity: 20, reorderLevel: 5 },
        specifications: {
          filtrationCapacity: 'HEPA H13 + Activated Carbon',
          noiseLevel: '35-52 dB',
          airFlowRate: '350 m³/h',
          coverage: '80m²',
          powerConsumption: '55W',
          warranty: '2 Years',
          weight: '5.5 kg',
          dimensions: '60×40×35 cm',
          filterLife: '12 months',
          sensors: ['PM2.5', 'PM10', 'VOCs', 'CO₂', 'Humidity'],
        },
        features: [
          'Multi-stage filtration',
          'Activated carbon for odor removal',
          'WiFi connectivity',
          'Mobile app control',
          'Voice assistant compatible',
          'Advanced air quality analytics',
        ],
        isLimitedEdition: true,
        ratings: { average: 4.9, count: 2108, distribution: { five: 1700, four: 350, three: 40, two: 10, one: 8 } },
      },
    ];

    await Product.insertMany(products);
    logger.info('Sample products created');

    // Create coupons
    const coupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discountType: 'percentage',
        discountValue: 10,
        minPurchaseAmount: 5000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        usagePerUser: 1,
        isActive: true,
      },
      {
        code: 'SUMMER20',
        description: 'Summer special offering 20% discount',
        discountType: 'percentage',
        discountValue: 20,
        minPurchaseAmount: 25000,
        maxDiscount: 5000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
        usagePerUser: 1,
        isActive: true,
      },
    ];

    await Coupon.insertMany(coupons);
    logger.info('Sample coupons created');

    logger.info('✓ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
