const db = require('../db');

async function checkUserStatus(req, res, next) {
    const result = await db.query('SELECT status FROM users WHERE id = $1', [req.userId]);
    
    if (!result.rows.length || result.rows[0].status === 'blocked') {
        return res.status(403).json({ message: 'Аккаунт заблокирован или удалён' });
    }
    
    next();
}

module.exports = checkUserStatus;