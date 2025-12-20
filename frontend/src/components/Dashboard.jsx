import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, ActionCard, Card } from './index';
import './Dashboard.css';

function Dashboard() {
  const { user, logout, fetchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Refrescar datos del usuario cada vez que entres al Dashboard
  // Esto asegura que las estadísticas estén actualizadas cuando se navega desde una partida terminada
  useEffect(() => {
    if (fetchUser) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Ejecutar cada vez que cambie la ruta al Dashboard

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-logo-title">
          <img src="/img/logo-personajes.png" alt="Personajes" className="dashboard-logo" />
          <h1 className="dashboard-title">Personajes</h1>
        </div>
        <Button title="Salir" onClick={handleLogout} variant="secondary" size="small" />
      </div>

      {/* Welcome Card */}
      <Card className="welcome-card">
        <div className="welcome-content">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="welcome-avatar"
            />
          ) : (
            <div className="welcome-avatar">👤</div>
          )}
          <div className="welcome-text">
            <div className="welcome-label">Bienvenido</div>
            <div className="welcome-title">¡Hola, {user?.username}! 👋</div>
            <div className="welcome-subtitle">Listo para jugar con tus amigos</div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <h2 className="section-title">¿Qué quieres hacer?</h2>

      <ActionCard
        icon="🌐"
        title="Múltiples Dispositivos"
        description="Crea una partida y comparte el código con tus amigos"
        onClick={() => navigate('/create-game')}
      />

      <ActionCard
        icon="📱"
        title="Un Solo Dispositivo"
        description="Juega en un solo dispositivo pasándolo por turnos"
        onClick={() => navigate('/local-game')}
      />

      <ActionCard
        icon="📖"
        title="¿Cómo Jugar?"
        description="Aprende las reglas y consejos para ganar"
        onClick={() => navigate('/how-to-play')}
      />

      {/* Stats */}
      <h2 className="section-title">Tus estadísticas</h2>

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-value">{user?.gamesPlayed || 0}</div>
          <div className="stat-label">Partidas Jugadas</div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value success">{user?.gamesWon || 0}</div>
          <div className="stat-label">Partidas Ganadas</div>
        </Card>
      </div>

      {/* Join Game */}
      <Card className="join-game-card">
        <h3 className="join-game-title">
          ¿Tienes un código de sala?
        </h3>
        <p className="join-game-description">
          Si alguien te compartió un código, únete a su partida
        </p>
        <div style={{ width: '100%', marginTop: '16px' }}>
          <Button
            title="Unirse a Partida"
            onClick={() => navigate('/create-game?mode=join')}
            style={{ width: '100%' }}
          />
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
