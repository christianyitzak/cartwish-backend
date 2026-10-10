const express = require('express');
const multer = require('multer');
const router = express.Router();

const Category = require('../models/category');

const upload = multer({
    dest: 'upload/category'
});

router.post('/', upload.single('icon'), async (req, res) => {
    if (!req.body.name || !req.file) {
        return res.status(401).json({
            message: 'Name and icon are required!'
        });
    };

    console.log(req.file);

    const newCategory = new Category({
        name: req.body.name,
        image: req.file.filename
    });

    await newCategory.save();
    res.status(201).json({
        message: 'Category added successfully!',
        category: newCategory
    });
});

module.exports = router;