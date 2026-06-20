import { useState } from 'react';
import { Form, Button, Container, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../shared/api';
import Logo from '../../shared/ui/Logo';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/login', { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось подключиться к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex min-vh-100">
            {/* Левая брендинговая панель */}
            <div className="d-none d-lg-flex flex-column justify-content-between p-5" style={{
                width: '45%',
                backgroundColor: '#1e1b4b',
                color: '#ffffff'
            }}>
                <div className="d-flex align-items-center gap-2">
                    <Logo size={36} light />
                    <span className="fw-bold" style={{ fontSize: '1.2rem', letterSpacing: '-0.01em' }}>GateKeep</span>
                </div>

                <div>
                    <h1 className="fw-bold mb-4" style={{ fontSize: '2.5rem', lineHeight: '1.12', letterSpacing: '-0.03em' }}>
                        Полный контроль доступа пользователей
                    </h1>
                    <p style={{ color: '#a5b4fc', fontSize: '1.05rem', lineHeight: '1.7' }}>
                        Блокировка, удаление и мониторинг статусов —
                        всё из единой панели управления. Быстро, безопасно, эффективно.
                    </p>

                    <div className="d-flex gap-4 mt-5" style={{ color: '#c7d2fe' }}>
                        <div>
                            <div className="fw-bold" style={{ fontSize: '1.5rem' }}>∞</div>
                            <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>Пользователей</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #312e81', height: '40px' }}></div>
                        <div>
                            <div className="fw-bold" style={{ fontSize: '1.5rem' }}>JWT</div>
                            <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>Авторизация</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #312e81', height: '40px' }}></div>
                        <div>
                            <div className="fw-bold" style={{ fontSize: '1.5rem' }}>PG</div>
                            <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>PostgreSQL</div>
                        </div>
                    </div>
                </div>

                <div style={{ color: '#6366f1', fontSize: '0.8rem' }}>
                    © 2026 GateKeep · Itransition Task 4
                </div>
            </div>

            {/* Правая панель с формой */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8fafc' }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col xs={11} sm={9} md={7} lg={8} xl={6}>
                            {/* Лого на мобильных */}
                            <div className="text-center mb-4 d-lg-none">
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                    <Logo size={32} />
                                    <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#1e1b4b' }}>GateKeep</span>
                                </div>
                            </div>

                            <h3 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em', color: '#1e1b4b' }}>С возвращением</h3>
                            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>Войдите, чтобы перейти к панели управления</p>

                            {error && (
                                <Alert variant="danger" transition={false} dismissible onClose={() => setError('')} className="py-2 small border-0" style={{ backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px' }}>
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="loginEmail">
                                    <Form.Label className="fw-semibold mb-2" style={{ fontSize: '0.85rem', color: '#1e1b4b' }}>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="py-2 px-3"
                                        style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="loginPassword">
                                    <Form.Label className="fw-semibold mb-2" style={{ fontSize: '0.85rem', color: '#1e1b4b' }}>Пароль</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="py-2 px-3"
                                        style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem' }}
                                    />
                                </Form.Group>

                                <Button
                                    type="submit"
                                    className="w-100 py-2 fw-semibold"
                                    disabled={loading}
                                    style={{ backgroundColor: '#4f46e5', border: 'none', borderRadius: '10px', fontSize: '0.95rem' }}
                                >
                                    {loading ? 'Вход...' : 'Войти'}
                                </Button>
                            </Form>

                            <div className="text-center mt-4">
                                <small className="text-muted">
                                    Нет аккаунта?{' '}
                                    <Link to="/register" className="text-decoration-none fw-semibold" style={{ color: '#4f46e5', borderBottom: '1px solid #4f46e5' }}>
                                        Зарегистрироваться
                                    </Link>
                                </small>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
}

export default LoginPage;
