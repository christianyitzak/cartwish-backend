const express = require('express');
const authMiddleware = require('../middleware/auth');
const checkSeller = require('../middleware/checkSeller');
const router = express.Router();

router.post('/', authMiddleware, checkSeller, (req, res) => {
    res.send('seller is here');
});

module.exports = router;