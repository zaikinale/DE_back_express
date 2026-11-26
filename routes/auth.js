const express = require('express');
const { User } = require('../models');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { login } = req.body;
        if (!login) {
            return res.status(400).json({ message: 'Необходимо передать login' });
        }

        const user = await User.findOne({ where: { login } });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({
            id: user.id,
            login: user.login,
            fullName: user.fullName,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при входе', error: error.message });
    }
});

module.exports = router;