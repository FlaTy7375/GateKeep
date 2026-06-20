const jwt = require('jsonwebtoken');
const db = require('../db');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Нет токена авторизации' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // IMPORTANT: ПЯТОЕ ТРЕБОВАНИЕ - проверка, существует ли пользователь и не заблокирован ли он
        const result = await db.query('SELECT status FROM users WHERE id = $1', [decoded.userId]);
        const user = result.rows[0];

        // Если пользователь удален или заблокирован, отклоняем запрос
        if (!user || user.status === 'blocked' || user.status === 'blocked_unverified') {
            return res.status(403).json({ message: 'Пользователь заблокирован или удален' });
        }

        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Неверный токен' });
    }
}

module.exports = authMiddleware;