const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const User = require('../models/users');

const createUserSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    deliveryAddress: Joi.string().min(5).required()
});

router.post('/register', async (req, res) => {
    const { name, email, password, deliveryAddress } = req.body;
    const user = await User.findOne({ email });

    const joiValidation = createUserSchema.validate(req.body);

    if (joiValidation.error) {
        return res.status(400).json(
            joiValidation.error.details[0].message
        );
    };

    if (user) {
        return res.status(400).json({
            message: 'User already exist!'
        });
    };

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = new User({
        name,
        email,
        password: hashedPass,
        deliveryAddress
    });

    await newUser.save();

    const token = generateToken(
        { _id: newUser._id, name: newUser.name }
    );

    res.status(201).json(token);
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({
            message: 'Invalid credentials!'
        });
    };

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
        return res.status(400).json({
            message: 'Invalid credentials!'
        });
    };

    const token = generateToken(
        { _id: user._id, name: user.name }
    );

    res.status(201).json(token);
});

router.get('/', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
});

const generateToken = (data) => {
    return jwt.sign(
        data,
        process.env.JWT_KEY,
        { expiresIn: '2h' }
    );
}

module.exports = router;