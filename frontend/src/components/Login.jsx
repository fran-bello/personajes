import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from './index';
import { colors } from '../theme';

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

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: 'transparent',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '400px',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '32px',
  };

  const logoStyle = {
    fontSize: '48px',
    marginBottom: '8px',
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: '8px',
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: colors.textMuted,
  };

  const rememberMeStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    cursor: 'pointer',
  };

  const linkStyle = {
    textAlign: 'center',
    marginTop: '24px',
    color: colors.textMuted,
    fontSize: '14px',
  };

  const linkTextStyle = {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: '500',
  };

  return (
    <div style={containerStyle}>
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>🎭</div>
          <h1 style={titleStyle}>Personajes</h1>
          <p style={subtitleStyle}>Inicia sesión para jugar</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                backgroundColor: `${colors.danger}20`,
                color: colors.danger,
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

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
            style={rememberMeStyle}
            onClick={() => setRememberMeChecked(!rememberMeChecked)}
          >
            <input
              type="checkbox"
              checked={rememberMeChecked}
              onChange={(e) => setRememberMeChecked(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: colors.primary,
              }}
            />
            <label style={{ color: colors.textSecondary, fontSize: '14px', cursor: 'pointer' }}>
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
            style={{ width: '100%' }}
          />
        </form>

        <p style={linkStyle}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={linkTextStyle}>
            Regístrate aquí
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Login;
