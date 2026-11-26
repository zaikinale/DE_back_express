const express = require('express');
const { Category } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['id', 'ASC']] });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения категорий', error: error.message });
    } 
});

module.exports = router;