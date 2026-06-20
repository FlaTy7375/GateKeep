import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Table, Button, Form, Alert,
    OverlayTrigger, Tooltip, Navbar, Badge, ButtonGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUnlock, FaTrash, FaUserSlash, FaUser } from 'react-icons/fa';
import api from '../../shared/api';
import { formatDate, getUniqIdValue } from '../../shared/lib';
import Logo from '../../shared/ui/Logo';

function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [sortType, setSortType] = useState('last_login_desc');
    const [selectedIds, setSelectedIds] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        navigate('/login');
    }, [navigate]);

    const showNotification = useCallback((text, variant = 'success') => {
        const id = getUniqIdValue();
        setNotifications((prev) => [...prev, { id, text, variant }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 4000);
    }, []);

    // IMPORTANT: функция для ручного закрытия уведомления
    const dismissNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
            setSelectedIds([]);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                // NOTE: ПЯТОЕ ТРЕБОВАНИЕ - выкидываем заблокированных или удаленных пользователей на страницу входа
                handleLogout();
            } else {
                showNotification('Не удалось загрузить список пользователей', 'danger');
            }
        } finally {
            setLoading(false);
        }
    }, [showNotification, handleLogout]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUsers();
    }, [fetchUsers]);

    // Логика сортировки
    const sortedUsers = useMemo(() => {
        const usersCopy = [...users];
        
        usersCopy.sort((a, b) => {
            switch (sortType) {
                case 'last_login_desc':
                    return new Date(b.last_login_time || 0) - new Date(a.last_login_time || 0);
                case 'last_login_asc':
                    return new Date(a.last_login_time || 0) - new Date(b.last_login_time || 0);
                case 'created_at_desc':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'created_at_asc':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                default:
                    return 0;
            }
        });
        
        return usersCopy;
    }, [users, sortType]);

    // NOTE: Переключение выделения одного пользователя
    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const sortedIds = sortedUsers.map(u => u.id);
        const allSortedSelected = sortedIds.length > 0 && sortedIds.every(id => selectedIds.includes(id));
        
        if (allSortedSelected) {
            // Если все отсортированные элементы выделены, снимаем с них выделение
            setSelectedIds(prev => prev.filter(id => !sortedIds.includes(id)));
        } else {
            // Иначе выделяем все отсортированные
            setSelectedIds(prev => Array.from(new Set([...prev, ...sortedIds])));
        }
    };

    const handleBlock = async () => {
        try {
            await api.post('/users/block', { ids: selectedIds });
            showNotification(`Заблокировано: ${selectedIds.length}`);
            await fetchUsers();
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
                return;
            }
            showNotification(err.response?.data?.message || 'Ошибка при блокировке', 'danger');
        }
    };

    const handleUnblock = async () => {
        try {
            await api.post('/users/unblock', { ids: selectedIds });
            showNotification(`Разблокировано: ${selectedIds.length}`);
            await fetchUsers();
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
                return;
            }
            showNotification(err.response?.data?.message || 'Ошибка при разблокировке', 'danger');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete('/users', { data: { ids: selectedIds } });
            showNotification(`Удалено: ${selectedIds.length}`);
            await fetchUsers();
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
                return;
            }
            showNotification(err.response?.data?.message || 'Ошибка при удалении', 'danger');
        }
    };

    const handleDeleteUnverified = async () => {
        try {
            const response = await api.delete('/users/unverified');
            showNotification(response.data.message);
            await fetchUsers();
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
                return;
            }
            showNotification(err.response?.data?.message || 'Ошибка при удалении', 'danger');
        }
    };

    const statusConfig = {
        active: { bg: 'success', label: 'Активен' },
        blocked: { bg: 'dark', label: 'Заблокирован' },
        blocked_unverified: { bg: 'dark', label: 'Заблокирован' },
        unverified: { bg: 'warning', text: 'dark', label: 'Не подтвержден' },
    };

    const renderStatusBadge = (status) => {
        const config = statusConfig[status] || { bg: 'secondary', label: status };
        return (
            <Badge bg={config.bg} text={config.text} className="badge-custom">
                {config.label}
            </Badge>
        );
    };

    // Определяем какой столбец сейчас активен и в какую сторону сортировка
    const getSortArrow = (columnKey) => {
        const isAsc = sortType === `${columnKey}_asc`;
        const isDesc = sortType === `${columnKey}_desc`;
        if (isAsc) return <span className="ms-1 text-dark" style={{ fontSize: '0.6rem', verticalAlign: 'text-top' }}>▲</span>;
        if (isDesc) return <span className="ms-1 text-dark" style={{ fontSize: '0.6rem', verticalAlign: 'text-top' }}>▼</span>;
        return null;
    };

    // Переключение сортировки при клике на заголовок столбца
    const toggleSort = (columnKey) => {
        const isDesc = sortType === `${columnKey}_desc`;
        setSortType(isDesc ? `${columnKey}_asc` : `${columnKey}_desc`);
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#fafafa' }}>
                <div className="fw-semibold text-muted">Загрузка данных...</div>
            </Container>
        );
    }

    const token = localStorage.getItem('token');
    let currentUserId = null;
    if (token) {
        try {
            currentUserId = JSON.parse(atob(token.split('.')[1])).userId;
        } catch {
            // игнорируем
        }
    }
    const currentUser = users.find(u => u.id === currentUserId);
    const currentUserName = currentUser ? currentUser.name : 'Пользователь';

    // Проверки для кнопок тулбара
    const selectedUsersData = users.filter(u => selectedIds.includes(u.id));
    const canBlock = selectedUsersData.length > 0 && selectedUsersData.some(u => !u.status.startsWith('blocked'));
    const canUnblock = selectedUsersData.length > 0 && selectedUsersData.some(u => u.status.startsWith('blocked'));
    const canDelete = selectedUsersData.length > 0;

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#fafafa' }}>
            {/* Навигация */}
            <Navbar bg="white" className="py-3 border-bottom shadow-sm">
                <Container fluid className="px-3 px-md-5" style={{ maxWidth: '1400px' }}>
                    <Navbar.Brand className="fw-bold m-0 d-flex align-items-center" style={{ letterSpacing: '-0.01em', fontSize: '1rem' }}>
                        <Logo size={28} />
                        <span className="ms-2 d-none d-sm-inline" style={{ color: '#1e1b4b' }}>GateKeep</span>
                        <span className="mx-2 text-muted" style={{ fontSize: '0.75rem' }}>|</span>
                        <FaUser className="text-muted" style={{ fontSize: '0.85rem', marginRight: '6px' }} />
                        <span className="text-muted fw-medium" style={{ fontSize: '0.85rem' }}>{currentUserName}</span>
                    </Navbar.Brand>
                    <Navbar.Collapse className="justify-content-end">
                        <Button variant="light" size="sm" onClick={handleLogout} className="fw-semibold px-4 py-2" style={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
                            Выйти
                        </Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid className="px-3 px-md-5 py-4 flex-grow-1" style={{ maxWidth: '1400px' }}>
                <div style={{ position: 'fixed', top: 90, right: 24, zIndex: 1050, maxWidth: 360 }}>
                    {notifications.map((n) => (
                        <Alert
                            key={n.id}
                            transition={false}
                            variant={n.variant === 'danger' ? 'danger' : 'dark'}
                            dismissible
                            onClose={() => dismissNotification(n.id)}
                            className="shadow-sm py-3 px-4 mb-2 small border-0 fw-medium text-white"
                            style={{ backgroundColor: n.variant === 'danger' ? '#ef4444' : '#111827', borderRadius: '10px' }}
                        >
                            {n.text}
                        </Alert>
                    ))}
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                    <div>
                        <h4 className="fw-bold mb-1 text-dark" style={{ letterSpacing: '-0.02em' }}>Пользователи</h4>
                        <p className="text-muted small mb-0">Управление учетными записями, доступами и статусами</p>
                    </div>

                    {/* Селектор сортировки */}
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                        <Form.Select 
                            value={sortType} 
                            onChange={(e) => setSortType(e.target.value)}
                            className="form-select-custom py-2 px-3 shadow-sm w-100"
                            style={{ fontSize: '0.85rem' }}
                        >
                            <option value="last_login_desc">Активность: Сначала новые</option>
                            <option value="last_login_asc">Активность: Сначала старые</option>
                            <option value="created_at_desc">Регистрация: Сначала новые</option>
                            <option value="created_at_asc">Регистрация: Сначала старые</option>
                            <option value="name_asc">Имя: А - Я</option>
                            <option value="name_desc">Имя: Я - А</option>
                        </Form.Select>
                    </div>
                </div>

                <div className="toolbar-custom p-2 mb-4 d-flex flex-wrap align-items-center gap-2">
                    <OverlayTrigger placement="top" overlay={<Tooltip>Заблокировать выбранных пользователей</Tooltip>}>
                        <span>
                            <Button
                                variant="dark"
                                size="sm"
                                onClick={handleBlock}
                                disabled={!canBlock}
                                className="fw-semibold px-3 px-sm-4 py-2 rounded-3"
                            >
                                Заблокировать
                            </Button>
                        </span>
                    </OverlayTrigger>

                    <div className="vr mx-1 d-none d-sm-block" style={{ backgroundColor: '#e5e7eb', width: '2px' }}></div>

                    <ButtonGroup className="gap-1">
                        <OverlayTrigger placement="top" overlay={<Tooltip>Разблокировать выбранных</Tooltip>}>
                            <span>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={handleUnblock}
                                    disabled={!canUnblock}
                                    className="border-0 px-3 py-2 rounded-3 text-success"
                                    style={{ backgroundColor: !canUnblock ? 'transparent' : '#f0fdf4' }}
                                >
                                    <FaUnlock />
                                </Button>
                            </span>
                        </OverlayTrigger>

                        <OverlayTrigger placement="top" overlay={<Tooltip>Удалить выбранных</Tooltip>}>
                            <span>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={!canDelete}
                                    className="border-0 px-3 py-2 rounded-3 text-danger"
                                    style={{ backgroundColor: !canDelete ? 'transparent' : '#fef2f2' }}
                                >
                                    <FaTrash />
                                </Button>
                            </span>
                        </OverlayTrigger>
                    </ButtonGroup>

                    <div className="vr mx-1 d-none d-sm-block" style={{ backgroundColor: '#e5e7eb', width: '2px' }}></div>

                    <OverlayTrigger placement="top" overlay={<Tooltip>Удалить всех неподтверждённых</Tooltip>}>
                        <span>
                            <Button
                                variant="light"
                                size="sm"
                                onClick={handleDeleteUnverified}
                                className="border-0 px-3 py-2 rounded-3 text-warning d-flex align-items-center gap-2 fw-medium"
                                style={{ backgroundColor: '#fffbeb' }}
                            >
                                <FaUserSlash /> <span className="d-none d-sm-inline small">Удалить неподтвержденных</span>
                            </Button>
                        </span>
                    </OverlayTrigger>

                    {selectedIds.length > 0 && (
                        <div className="selected-counter bg-dark text-white px-3 py-1 rounded-pill small fw-semibold" style={{ whiteSpace: 'nowrap' }}>
                            Выбрано: {selectedIds.length}
                        </div>
                    )}
                </div>

                <div className="table-custom-container">
                    <Table responsive className="table-custom text-nowrap" borderless>
                        <thead>
                            <tr>
                                <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                                    <Form.Check
                                        type="checkbox"
                                        checked={sortedUsers.length > 0 && sortedUsers.every(u => selectedIds.includes(u.id))}
                                        onChange={toggleSelectAll}
                                        className="m-0"
                                    />
                                </th>
                                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>Пользователь{getSortArrow('name')}</th>
                                <th onClick={() => toggleSort('last_login')} style={{ cursor: 'pointer' }}>Активность{getSortArrow('last_login')}</th>
                                <th onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer' }}>Регистрация{getSortArrow('created_at')}</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-5 border-0">
                                        Нет зарегистрированных пользователей
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={selectedIds.includes(user.id) ? 'table-active' : ''}
                                    >
                                        <td style={{ paddingLeft: '1.5rem' }}>
                                            <Form.Check
                                                type="checkbox"
                                                checked={selectedIds.includes(user.id)}
                                                onChange={() => toggleSelect(user.id)}
                                                className="m-0"
                                            />
                                        </td>
                                        <td>
                                            <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{user.name}</div>
                                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user.email}</div>
                                        </td>
                                        <td>
                                            <div className="fw-medium text-dark" style={{ fontSize: '0.85rem' }}>{formatDate(user.last_login_time)}</div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Вход в систему</div>
                                        </td>
                                        <td className="text-muted fw-medium" style={{ fontSize: '0.85rem' }}>{formatDate(user.created_at)}</td>
                                        <td>{renderStatusBadge(user.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
            </Container>
        </div>
    );
}

export default AdminPanel;
