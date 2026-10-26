const express = require('express');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const multer = require('multer');
const Product = require('../models/products');
const Category = require('../models/category');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/products');
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
        cb(null, `${timestamp}-${originalName}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    };
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

router.post('/', authMiddleware, checkRole('seller'), upload.array('images', 8), async (req, res) => {
    const { title, description, category, price, stock } = req.body;
    const images = req.files.map((image) => image.filename);

    if (images.length === 0) {
        return res.status(401).json({
            message: 'At least one image is required!'
        });
    };

    const newProduct = new Product({
        title,
        description,
        category,
        price,
        stock,
        images,
        seller: req.user._id
    });

    await newProduct.save();

    res.status(201).json(newProduct);
});

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = req.query.perPage || 8;

    const queryCategory = req.query.category || null;

    let query = {};

    if (queryCategory) {
        const category = await Category.findOne({ name: queryCategory });

        if (!category) {
            return res.status(404).json({
                message: 'Category not found!'
            });
        };

        query.category = category._id;
    };

    const products = await Product.find()
        .select('-description -seller -category -__v')
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean();

    const updatedProducts = products.map((product) => {
        const numberOfReviews = product.review.length;
        const sumOfRatings = product.review.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = sumOfRatings / (numberOfReviews || 1);

        return {
            ...product,
            images: product.images[0],
            review: { numberOfReviews, averageRating }
        };
    });

    const totalProducts = Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    res.json({
        products: updatedProducts,
        totalProducts,
        totalPages,
        currentPage: page,
        postPerPage: perPage
    });
})

module.exports = router;