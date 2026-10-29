const express = require('express');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const Product = require('../models/products');
const Category = require('../models/category');
const req = require('express/lib/request');
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

router.get('/suggestions', async (req, res) => {
    try {
        const search = req.query.search;
        const products = await Product.find({ title: { $regex: search, $options: 'i' } })
            .select('_id title')
            .limit(10);

        res.json(products);
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Internal Server Error!'
        });
    }
});

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = req.query.perPage || 8;

    const queryCategory = req.query.category || null;
    const querySearch = req.query.search || null;

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

    if (querySearch) {
        query.title = { $regex: querySearch, $options: '1' }
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

    const totalProducts = Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);

    res.json({
        products: updatedProducts,
        totalProducts,
        totalPages,
        currentPage: page,
        postPerPage: perPage
    });
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    const product = await Product.findById(id).populate('seller', '_id name email').populate('review.user', '_id name email').select('-category -__v')

    if (!product) {
        return res.status(404).json({
            message: 'Product not found!'
        });
    };

    res.json(product);
});

router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    const product = await Product.findById(id).select('seller images');

    if (!product) {
        return res.status(404).json({
            message: 'Product not found!'
        });
    };

    if (req.user.role === 'admin' || req.user._id === product.seller) {
        await product.deleteOne();

        if (product.images && product.images.length > 0) {
            product.images.forEach(async (imageName) => {
                const fullPath = path.join(__dirname, '../upload/products');

                try {
                    await fs.unlink(fullPath);
                } catch (error) {
                    console.error(`Error deleting file: ${fullPath}`, error);
                }

            });
        };

        return res.json({ message: 'Product deleted successfully!' });
    };


    return res
        .status(403)
        .json(
            { message: 'Access denied: Only admin or seller can delete this product!' }
        );
});

module.exports = router;