require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(console.log('Mongodb connected..'))
    .catch((err) => console.log('Mongodb connection failed', err))

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});