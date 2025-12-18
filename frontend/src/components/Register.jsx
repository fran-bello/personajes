import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Toast } from './index';
import { colors } from '../theme';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    setLoading(true);

    const result = await register(username.trim(), email.trim(), password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Error al registrarse');
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
    width: '80px',
    height: 'auto',
    marginBottom: '8px',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: '8px',
    textTransform: 'uppercase',
    textShadow: '3px 3px 6px rgba(102, 0, 102, 1), 2px 2px 4px rgba(0, 0, 0, 1), 1px 1px 2px rgba(0, 0, 0, 0.9)',
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: colors.textMuted,
  };

  const linkStyle = {
    textAlign: 'center',
    marginTop: '24px',
    color: colors.textMuted,
    fontSize: '14px',
  };

  const linkTextStyle = {
    color: '#00d4ff',
    textDecoration: 'none',
    fontWeight: '500',
  };

  return (
    <div style={containerStyle}>
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <img src="/img/logo-personajes.png" alt="Personajes" style={logoStyle} />
          <h1 style={titleStyle}>Crear Cuenta</h1>
          <p style={subtitleStyle}>Únete para jugar con tus amigos</p>
        </div>

        <Toast
          message={error}
          type="error"
          isVisible={!!error}
          onClose={() => setError('')}
        />

        <form onSubmit={handleRegister}>
          <Input
            label="Nombre de usuario"
            value={username}
            onChange={setUsername}
            placeholder="Tu nombre"
            required
          />

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

          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            required
          />

          <Button
            title={loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            onClick={handleRegister}
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            style={{ width: '100%' }}
          />
        </form>

        <p style={linkStyle}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={linkTextStyle}>
            Inicia sesión aquí
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Register;
