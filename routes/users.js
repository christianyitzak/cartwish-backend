const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../models/users');

router.post('/register', async (req, res) => {
    const { name, email, password, deliveryAddress } = req.body;
    const user = await User.findOne({ email });

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
    res.status(201).json(newUser);
});

module.exports = router;