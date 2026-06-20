const router = require('express').Router();
const db = require('../db');

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, last_login_time, status, created_at FROM users ORDER BY last_login_time DESC'
        );
        return res.json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// /api/users/block
router.post('/block', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Не выбраны пользователи" });
        }

        // Сохраняем информацию о том, был ли пользователь неподтвержден до блокировки
        await db.query(`
            UPDATE users 
            SET status = CASE 
                WHEN status = 'unverified' THEN 'blocked_unverified' 
                ELSE 'blocked' 
            END 
            WHERE id = ANY($1)
        `, [ids]);

        return res.status(200).json({ message: "Пользователь заблокирован!"});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// /api/users/unblock
router.post('/unblock', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Не выбраны пользователи" });
        }

        // Восстанавливаем статус в зависимости от того как пользователь был заблокирован (верифицирован или нет)
        await db.query(`
            UPDATE users 
            SET status = CASE 
                WHEN status = 'blocked_unverified' THEN 'unverified' 
                ELSE 'active' 
            END 
            WHERE id = ANY($1)
        `, [ids]);

        return res.status(200).json({ message: "Пользователь разблокирован!"});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/users
router.delete('/', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Не выбраны пользователи" });
        }

        await db.query("DELETE FROM users WHERE id = ANY($1)", [ids])

        return res.status(200).json({ message: "Аккаунт пользователя удален."});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE /api/users/unverified
router.delete('/unverified', async (req, res) => {
    try {
        const result = await db.query("DELETE FROM users WHERE status = 'unverified'");
        return res.status(200).json({ message: `Удалено неподтверждённых: ${result.rowCount}` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;