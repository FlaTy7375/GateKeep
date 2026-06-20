import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/login/LoginPage';
import RegisterPage from '../pages/register/RegisterPage';
import AdminPanel from '../pages/admin-panel/AdminPanel';
import './App.css'; // Импортируем кастомные стили

/*
 * ОIMPORTANT: бёртка для защиты роутов — проверяет наличие токена в localStorage.
 * Если токена нету, тогда выкидываем на страницу входа.
 */
function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute>
                            <AdminPanel />
                        </PrivateRoute>
                    }
                />
                {/* Любой неизвестный путь - логин */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
