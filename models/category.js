const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true }
});

const category = mongoose.model('Category', categorySchema);

module.exports = category;