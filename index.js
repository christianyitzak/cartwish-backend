require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');
const app = express();

const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/products');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()],
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(console.log('Mongodb connected..'))
    .catch((err) => console.log('Mongodb connection failed', err))

app.use(express.json());
app.use('/upload/category', express.static('upload/category'));
app.use('/upload/products', express.static('upload/products'));
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/products', productRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    logger.error(error.message, error);

    return res.status(500).json({
        message: 'Internal Server Error!'
    });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});