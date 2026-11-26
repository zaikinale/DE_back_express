const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define(
    'Product',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        manufacturer: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        composition: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: '',
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 },
            get() {
                const value = this.getDataValue('price');
                return value === null ? null : Number(value);
            },
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0, isInt: true },
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        variants: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: 'products',
        timestamps: false,
    }
);

module.exports = Product;