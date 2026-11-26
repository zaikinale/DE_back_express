const express = require('express');
const { Op } = require('sequelize');
const { Product, Category } = require('../models');
const {
    calcDiscountFields,
    getRecentOrderedProductIds,
    getProductDiscount,
} = require('../utils/discount');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { search, categoryId, sort } = req.query;
        const where = {};

        if (search && search.trim()) {
            const pattern = `%${search.trim()}%`;
            where[Op.or] = [
                { name: { [Op.iLike]: pattern } },
                { description: { [Op.iLike]: pattern } },
            ];
        }

        if (categoryId) {
            const parsedCategoryId = Number(categoryId);
            if (!Number.isInteger(parsedCategoryId)) {
                return res.status(400).json({ message: 'Некорректный categoryId' });
            }
            where.categoryId = parsedCategoryId;
        }

        const order = [];
        if (sort === 'price_asc') {
            order.push(['price', 'ASC']);
        } else if (sort === 'price_desc') {
            order.push(['price', 'DESC']);
        } else {
            order.push(['id', 'ASC']);
        }

        const products = await Product.findAll({
            where,
            include: [{ model: Category, as: 'category' }],
            order,
        });

        const recentIds = await getRecentOrderedProductIds(products.map((p) => p.id));

        const result = products.map((product) => {
            const plain = product.toJSON();
            const { discountPercent, finalPrice } = calcDiscountFields(
                plain.price,
                recentIds.has(plain.id)
            );
            return {
                ...plain,
                discountPercent,
                finalPrice,
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения товаров', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category' }],
        });

        if (!product) {
            return res.status(404).json({ message: 'Товар не найден' });
        }

        const plain = product.toJSON();
        const { discountPercent, finalPrice } = await getProductDiscount(plain.id, plain.price);

        res.json({
            ...plain,
            discountPercent,
            finalPrice,
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения товара', error: error.message });
    }
});

module.exports = router;