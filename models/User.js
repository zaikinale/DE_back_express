const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        login: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'client',
        }
    },
    {
        tableName: 'users',
        timestamps: false,
    }
)

module.exports = User;