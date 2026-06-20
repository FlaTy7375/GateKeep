const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Настройка транспортера для отправки писем
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER || 'example@gmail.com',
        pass: process.env.EMAIL_PASS || 'password123'
    },
    tls: {
        rejectUnauthorized: false // Помогает обойти проблемы с сертификатами и фаерволами
    }
});

// Асинхронная отправка письма подтверждения
const sendVerificationEmail = async (email, token) => {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const verifyLink = `${baseUrl}/api/verify?token=${token}`;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER || '"App" <noreply@example.com>',
            to: email,
            subject: 'Подтверждение регистрации',
            html: `
                <h3>Добро пожаловать!</h3>
                <p>Для подтверждения email перейдите по ссылке:</p>
                <a href="${verifyLink}">${verifyLink}</a>
            `
        });
        console.log(`Письмо подтверждения отправлено на ${email}`);
    } catch (error) {
        console.error('Ошибка отправки письма (проверьте настройки SMTP):', error.message);
        // Ошибка отправки не должна ломать регистрацию
    }
};

// api/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({ message: "Не все поля заполнены!" });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const queryText = `
            INSERT INTO users (name, email, password_hash, status, last_login_time) 
            VALUES ($1, $2, $3, 'unverified', NOW()) 
            RETURNING id
        `;

        const values = [name.trim(), email.trim().toLowerCase(), passwordHash];
        const result = await db.query(queryText, values);
        const userId = result.rows[0].id;
        
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // IMPORTANT: Отправка письма выполняется асинхронно как в тз указано
        sendVerificationEmail(email.trim().toLowerCase(), token);

        return res.status(201).json({ token, message: "Регистрация успешна!" });
    } catch (err) {
        // NOTA BENE: Ошибка 23505 означает нарушение UNIQUE INDEX на уровне бд
        if (err.code === '23505') {
            return res.status(409).json({ message: "Этот email уже занят" });
        }

        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// api/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({ message: "Не все поля заполнены!" });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: "Пользователя с таким email не существует." })
        }

        // NOTE: Пользователь может войти, даже если email не подтвержден. 
        // Запрет только для blocked и blocked_unverified. 
        if (user.status === "blocked" || user.status === "blocked_unverified") {
            return res.status(403).json({message: "Пользователь заблокирован."})
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({message: "Пароль неверный."})
        }

        await db.query('UPDATE users SET last_login_time = NOW() WHERE id = $1', [user.id]);
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).json({ token, message: "Вход выполнен!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// api/verify
router.get('/verify', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).send("Токен не предоставлен");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // NOTE: Обновляем статус на active, только если он unverified
        await db.query(
            "UPDATE users SET status = 'active' WHERE id = $1 AND status = 'unverified'",
            [decoded.userId]
        );
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: #166534;">Email успешно подтвержден!</h1>
                <p>Ваш аккаунт теперь активен.</p>
                <a href='${frontendUrl}/login' style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 8px;">Войти на сайт</a>
            </div>
        `);
    } catch (err) {
        res.status(400).send("Недействительный или просроченный токен");
    }
});

module.exports = router;