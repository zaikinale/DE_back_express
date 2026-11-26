const { Op } = require('sequelize');
const { Order } = require('../models');

function getOneMonthAgoDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
}

function calcDiscountFields(price, hasRecentOrders) {
    const numericPrice = Number(price);
    const discountPercent = hasRecentOrders ? 0 : 25;
    const finalPrice =
        discountPercent > 0
            ? Number((numericPrice * 0.75).toFixed(2))
            : Number(numericPrice.toFixed(2));

    return { discountPercent, finalPrice };
}

async function getRecentOrderedProductIds(productIds) {
    if (!productIds.length) return new Set();

    const recentOrders = await Order.findAll({
        attributes: ['productId'],
            where: {
                productId: { [Op.in]: productIds },
                status: { [Op.ne]: 'cancelled' },
                createdAt: { [Op.gte]: getOneMonthAgoDate() },
            },
        group: ['productId'],
    });

    return new Set(recentOrders.map((o) => o.productId));
}

async function getProductDiscount(productId, price, transaction = null) {
    const recentOrder = await Order.findOne({
        where: {
            productId,
            status: { [Op.ne]: 'cancelled' },
            createdAt: { [Op.gte]: getOneMonthAgoDate() },
        },
        transaction,
    });

    return calcDiscountFields(price, Boolean(recentOrder));
}

module.exports = {
    calcDiscountFields,
    getRecentOrderedProductIds,
    getProductDiscount,
};