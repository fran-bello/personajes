import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Toast } from './index';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMeChecked, setRememberMeChecked] = useState(true);
  const { login, rememberMe, savedEmail } = useAuth();
  const navigate = useNavigate();

  // Cargar preferencias guardadas
  useEffect(() => {
    setRememberMeChecked(rememberMe);
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [rememberMe, savedEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password, rememberMeChecked);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <img src="/img/logo-personajes.png" alt="Personajes" className="login-logo" />
          <h1 className="login-title">Personajes</h1>
          <p className="login-subtitle">Inicia sesión para jugar</p>
        </div>

        <Toast
          message={error}
          type="error"
          isVisible={!!error}
          onClose={() => setError('')}
        />

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="tu@email.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          <div
            className="login-remember"
            onClick={() => setRememberMeChecked(!rememberMeChecked)}
          >
            <input
              type="checkbox"
              checked={rememberMeChecked}
              onChange={(e) => setRememberMeChecked(e.target.checked)}
            />
            <label>
              Recordarme
            </label>
          </div>

          <Button
            title={loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            onClick={handleSubmit}
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            className="login-button"
          />
        </form>

        <p className="login-link">
          ¿No tienes cuenta?{' '}
          <Link to="/register">
            Regístrate aquí
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Login;
