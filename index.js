require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/products');

mongoose
    .connect(process.env.MONGODB_URI)
    .then(console.log('Mongodb connected..'))
    .catch((err) => console.log('Mongodb connection failed', err))

app.use(express.json());
app.use('/upload/category', express.static('upload/category'));
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/products', productRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});