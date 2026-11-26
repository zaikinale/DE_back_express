const { User } = require('../models');

function isAdmin(role) {
    return ['admin', 'Администратор'].includes(String(role).toLowerCase());
}

function isManagerOrAdmin(role) {
    return ['admin', 'Администратор', 'manager', 'Менеджер'].includes(
        String(role).toLowerCase()
    );
}

async function authMiddleware(req, res, next) {
    try {
        const rawUserId = req.headers['x-user-id'];
        const userId = Number(rawUserId);

        if (!rawUserId || !Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ message: 'Не передан корректный заголовок x-user-id' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Ошибка авторизации', error: error.message });
    }
}

module.exports = {
    authMiddleware,
    isAdmin,
    isManagerOrAdmin,
};