const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { sequelize, Category, User, Product, Order } = require('./models');

const VARIANT = process.env.VARIANT || 'variantB';

async function resetSequences() {
    const tables = ['categories', 'users', 'products', 'orders'];
    for (const table of tables) {
        await sequelize.query(
            `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), true);`
        );
    }
}

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const dataPath = path.join(__dirname, 'data', 'mockData.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const mockData = rawData[VARIANT];

    if (!mockData) {
      throw new Error(`Вариант "${VARIANT}" не найден в mockData.json`);
    }

    for (const cat of mockData.categories || []) {
      await Category.findOrCreate({
        where: { name: cat.name },
        defaults: {
          id: cat.id,
          name: cat.name,
        },
      });
    }

    for (const user of mockData.users || []) {
      await User.findOrCreate({
        where: { login: user.login },
        defaults: {
          id: user.id,
          login: user.login,
          fullName: user.full_name,
          role: user.role_code,
        },
      });
    }

    for (const product of mockData.products || []) {
      const variants = product.variants || [];
      const totalStock = variants.reduce((sum, v) => sum + Number(v.quantity || 0), 0);

      await Product.findOrCreate({
        where: { id: product.id },
        defaults: {
          id: product.id,
          name: product.name,
          manufacturer: product.manufacturer_name || null,
          composition: product.composition || null,
          description: product.description || '',
          price: product.base_price,
          stock: totalStock,
          image: product.image ? product.image : null,
          variants,
          categoryId: product.category_id,
        },
      });
    }

    let orderRowId = 1;
    for (const order of mockData.orders || []) {
      const createdAt = order.order_date ? new Date(order.order_date) : new Date();

      for (const item of order.items || []) {
        const currentId = orderRowId++;
        await Order.findOrCreate({
          where: { id: currentId },
          defaults: {
            id: currentId,
            userId: order.user_id,
            productId: item.product_id,
            quantity: item.quantity,
            totalPrice: Number(item.unit_price) * Number(item.quantity),
            status: 'completed',
            createdAt,
          },
        });
      }
    }

    await resetSequences();
    console.log(`База данных успешно заполнена (${VARIANT}) без дубликатов.`);
  } catch (error) {
    console.error('Ошибка при заполнении базы:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();