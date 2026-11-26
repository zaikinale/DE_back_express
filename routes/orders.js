const express = require('express');
const { sequelize, Order, Product, User } = require('../models');
const { authMiddleware, isAdmin, isManagerOrAdmin } = require('../middleware/auth');
const { getProductDiscount } = require('../utils/discount');

const router = express.Router();
const ALLOWED_STATUSES = ['new', 'completed', 'cancelled'];

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const where = isManagerOrAdmin(req.user.role) ? {} : { userId: req.user.id };

    const orders = await Order.findAll({
      where,
      include: [
        { model: Product, as: 'product' },
        { model: User, as: 'user', attributes: ['id', 'login', 'fullName', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения заказов', error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity);

  if (!productId || !Number.isInteger(qty) || qty < 1) {
    return res
      .status(400)
      .json({ message: 'Укажите корректные productId и quantity (целое число от 1)' });
  }

  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Указанный товар не существует' });
    }

    if (product.stock < qty) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Недостаточно товара на складе (доступно: ${product.stock})`,
      });
    }

    const { discountPercent, finalPrice } = await getProductDiscount(
      product.id,
      product.price,
      transaction
    );

    product.stock -= qty;
    await product.save({ transaction });

    const totalPrice = Number((finalPrice * qty).toFixed(2));

    const order = await Order.create(
      {
        userId: req.user.id,
        productId: product.id,
        quantity: qty,
        totalPrice,
        status: 'new',
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      ...order.toJSON(),
      discountPercent,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Ошибка создания заказа', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  const { status } = req.body;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Некорректный статус. Допустимые значения: ${ALLOWED_STATUSES.join(', ')}`,
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    if (!isManagerOrAdmin(req.user.role) && order.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Нет доступа к чужому заказу' });
    }

    if (status === 'cancelled') {
      if (order.status === 'cancelled') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Заказ уже отменён' });
      }

      const product = await Product.findByPk(order.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (product) {
        product.stock += order.quantity;
        await product.save({ transaction });
      }
    } else if (order.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Нельзя изменить статус уже отменённого заказа' });
    }

    order.status = status;
    await order.save({ transaction });

    await transaction.commit();
    res.json(order);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Ошибка обновления заказа', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Доступ запрещён: удалять заказы может только администратор' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    await order.destroy();
    res.json({ message: 'Заказ удалён', id: order.id });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления заказа', error: error.message });
  }
});

module.exports = router;