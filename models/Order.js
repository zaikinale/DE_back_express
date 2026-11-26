const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define(
    'Order',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, isInt: true },
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 },
            get() {
                const value = this.getDataValue('totalPrice');
                return value === null ? null : Number(value);
            },
        },
        status: {
            type: DataTypes.ENUM('new', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'new',
        },
    },
    {
        tableName: 'orders',
        timestamps: true,
        updatedAt: false,
    }
);

module.exports = Order;
