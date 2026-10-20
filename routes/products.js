const express = require('express');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const router = express.Router();

router.post('/', authMiddleware, checkRole('seller'), (req, res) => {
    res.send('seller is here');
});

module.exports = router;