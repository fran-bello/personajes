import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, ActionCard, Card } from './index';
import { colors } from '../theme';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: 'transparent',
    padding: '24px',
    paddingBottom: '40px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  };

  const logoTitleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const logoStyle = {
    fontSize: '40px',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.text,
  };

  const welcomeCardStyle = {
    marginBottom: '24px',
  };

  const welcomeContentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const avatarStyle = {
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    backgroundColor: colors.surfaceLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
  };

  const welcomeTextStyle = {
    flex: 1,
  };

  const welcomeLabelStyle = {
    fontSize: '14px',
    color: colors.primaryLight,
    fontWeight: '500',
  };

  const welcomeTitleStyle = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: colors.text,
    marginTop: '2px',
  };

  const welcomeSubtitleStyle = {
    fontSize: '13px',
    color: colors.textSecondary,
    marginTop: '4px',
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: '16px',
    marginTop: '8px',
  };

  const statsRowStyle = {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  };

  const statCardStyle = {
    flex: 1,
    textAlign: 'center',
  };

  const statValueStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: '4px',
  };

  const statLabelStyle = {
    fontSize: '12px',
    color: colors.textMuted,
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={logoTitleStyle}>
          <span style={logoStyle}>🎭</span>
          <h1 style={titleStyle}>Personajes</h1>
        </div>
        <Button title="Salir" onClick={handleLogout} variant="secondary" size="small" />
      </div>

      {/* Welcome Card */}
      <Card style={welcomeCardStyle}>
        <div style={welcomeContentStyle}>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '32px',
              }}
            />
          ) : (
            <div style={avatarStyle}>👤</div>
          )}
          <div style={welcomeTextStyle}>
            <div style={welcomeLabelStyle}>Bienvenido</div>
            <div style={welcomeTitleStyle}>¡Hola, {user?.username}! 👋</div>
            <div style={welcomeSubtitleStyle}>Listo para jugar con tus amigos</div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <h2 style={sectionTitleStyle}>¿Qué quieres hacer?</h2>

      <ActionCard
        icon="👤"
        title="Gestionar Personajes"
        description="Agrega, edita o elimina tus personajes personalizados"
        badge={`${user?.characters?.length || 0} personajes`}
        onClick={() => navigate('/characters')}
      />

      <ActionCard
        icon="🌐"
        title="Partida Online"
        description="Crea una partida y comparte el código con tus amigos"
        onClick={() => navigate('/create-game')}
      />

      <ActionCard
        icon="📱"
        title="Juego Local"
        description="Juega en un solo dispositivo pasándolo por turnos"
        onClick={() => navigate('/local-game')}
      />

      {/* Stats */}
      <h2 style={sectionTitleStyle}>Tus estadísticas</h2>

      <div style={statsRowStyle}>
        <Card style={statCardStyle}>
          <div style={statValueStyle}>{user?.gamesPlayed || 0}</div>
          <div style={statLabelStyle}>Partidas Jugadas</div>
        </Card>

        <Card style={statCardStyle}>
          <div style={{ ...statValueStyle, color: colors.success }}>
            {user?.gamesWon || 0}
          </div>
          <div style={statLabelStyle}>Partidas Ganadas</div>
        </Card>
      </div>

      {/* Join Game */}
      <Card style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
          ¿Tienes un código de sala?
        </h3>
        <p style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '16px' }}>
          Si alguien te compartió un código, únete a su partida
        </p>
        <Button
          title="Unirse a Partida"
          onClick={() => navigate('/create-game')}
          variant="outline"
        />
      </Card>
    </div>
  );
}

export default Dashboard;
