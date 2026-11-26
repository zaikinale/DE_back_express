const sequelize = require('../config/db')
const Category =  require('../models/Category')
const User =  require('../models/User')
const Product =  require('../models/Product')
const Order =  require('../models/Order')

Category.hasMany(Product, {foreignKey: 'categoriyId', as: 'products'});
Product.belongsTo(Category, {foreignKey: 'categoriyId', as: 'category'});

User.hasMany(Order, {foreignKey: 'userId', as: 'orders'});
Order.belongsTo(User, {foreignKey: 'userId', as: 'user'});

Product.hasMany(Order, {foreignKey: 'productId', as: 'orders'});
Order.belongsTo(Product, {foreignKey: 'productId', as: 'products'});

module.exports = {
    sequelize,
    Category, 
    User,
    Product,
    Order,
};