import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from './index';
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
          <h1 style={titleStyle}>Crear Cuenta</h1>
          <p style={subtitleStyle}>Únete para jugar con tus amigos</p>
        </div>

        <form onSubmit={handleRegister}>
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
