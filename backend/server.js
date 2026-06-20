require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const authMiddleware = require('./middleware/auth');
const checkUserStatus = require('./middleware/userStatus');

app.use(express.json());

app.use(cors());

app.use('/api', authRoutes);
app.use('/api/users', authMiddleware, checkUserStatus, usersRoutes);

app.get("/", (req, res) => {
    res.json({ message: 'Сервер работает!' });
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Сервер доступен по ссылке "http://localhost:5000/"`);
})