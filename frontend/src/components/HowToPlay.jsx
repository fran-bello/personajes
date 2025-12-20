import { useNavigate } from 'react-router-dom';
import { Button, Card } from './index';
import { colors } from '../theme';
import './HowToPlay.css';

function HowToPlay() {
  const navigate = useNavigate();

  const rounds = [
    {
      number: 1,
      icon: '🗣️',
      title: 'DESCRIBE',
      description: 'Puedes usar todas las palabras que quieras para describir al personaje',
      rules: [
        'No digas el nombre del personaje',
        'No uses rimas ni deletrees',
        'Sé creativo con las descripciones'
      ]
    },
    {
      number: 2,
      icon: '☝️',
      title: 'UNA PALABRA',
      description: 'Solo puedes decir UNA palabra para que adivinen',
      rules: [
        'Elige la palabra más representativa',
        'Puedes repetir la misma palabra',
        'No puedes hacer gestos'
      ]
    },
    {
      number: 3,
      icon: '🎭',
      title: 'MÍMICA',
      description: 'Solo puedes usar gestos y movimientos. ¡Prohibido hablar!',
      rules: [
        'No puedes emitir sonidos',
        'Usa todo tu cuerpo',
        'Puedes señalar objetos del entorno'
      ]
    }
  ];

  return (
    <div className="how-to-play-container">
      {/* Header */}
      <div className="how-to-play-header">
        <div className="how-to-play-logo-title">
          <img src="/img/logo-personajes.png" alt="Personajes" className="how-to-play-logo" />
          <h1 className="how-to-play-title">¿Cómo Jugar?</h1>
        </div>
        <Button 
          title="Volver" 
          onClick={() => navigate('/dashboard')} 
          variant="secondary" 
          size="small" 
        />
      </div>

      {/* Main Content */}
      <div className="how-to-play-content">
        {/* Introducción */}
        <Card className="intro-card">
          <h2 className="section-title">🎯 Objetivo del Juego</h2>
          <p className="intro-text">
            <strong>Personajes</strong> es un juego de adivinanzas por equipos donde debes hacer que tu equipo 
            adivine el mayor número de personajes posibles en el tiempo límite. Cada ronda tiene reglas diferentes 
            que hacen el juego más desafiante.
          </p>
        </Card>

        {/* Cómo Funciona */}
        <Card className="section-card">
          <h2 className="section-title">📋 Cómo Funciona</h2>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Forma tu equipo</h3>
                <p>Puedes jugar en equipos o parejas. Cada equipo competirá para adivinar más personajes.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Selecciona personajes</h3>
                <p>Elige personajes de una categoría predefinida o crea tus propios personajes personalizados.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Juega por turnos</h3>
                <p>Cada jugador tiene un tiempo límite para hacer adivinar personajes a su equipo. Los turnos alternan entre equipos.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Completa 3 rondas</h3>
                <p>El juego tiene 3 rondas con reglas diferentes. El equipo con más puntos al final gana.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Reglas por Ronda */}
        <Card className="section-card">
          <h2 className="section-title">🎮 Las 3 Rondas</h2>
          <div className="rounds-grid">
            {rounds.map((round) => (
              <div key={round.number} className="round-card">
                <div className="round-header">
                  <div className="round-icon">{round.icon}</div>
                  <div className="round-title-section">
                    <div className="round-label">RONDA {round.number}</div>
                    <h3 className="round-title">{round.title}</h3>
                  </div>
                </div>
                <p className="round-description">{round.description}</p>
                <div className="round-rules">
                  <h4>Reglas:</h4>
                  <ul>
                    {round.rules.map((rule, index) => (
                      <li key={index}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Modos de Juego */}
        <Card className="section-card">
          <h2 className="section-title">🌐 Modos de Juego</h2>
          <div className="modes-grid">
            <div className="mode-card">
              <div className="mode-icon">🌐</div>
              <h3>Múltiples Dispositivos</h3>
              <p>Juega con amigos desde diferentes dispositivos. Crea una sala y comparte el código para que otros se unan.</p>
              <ul>
                <li>Crea una partida y obtén un código de sala</li>
                <li>Comparte el código con tus amigos</li>
                <li>Juega en tiempo real desde cualquier lugar</li>
              </ul>
            </div>
            <div className="mode-card">
              <div className="mode-icon">📱</div>
              <h3>Un Solo Dispositivo</h3>
              <p>Juega en un solo dispositivo pasándolo por turnos. Perfecto para reuniones presenciales.</p>
              <ul>
                <li>Un solo dispositivo para todos</li>
                <li>Pasa el dispositivo cuando sea tu turno</li>
                <li>Ideal para fiestas y reuniones</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Consejos */}
        <Card className="section-card">
          <h2 className="section-title">💡 Consejos para Ganar</h2>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-icon">🎯</span>
              <p><strong>Sé estratégico:</strong> En la ronda 1, usa descripciones claras. En la ronda 2, elige la palabra más representativa.</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">⏱️</span>
              <p><strong>Gestiona el tiempo:</strong> No te detengas mucho en un personaje difícil. Pásalo y continúa con otros.</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">👥</span>
              <p><strong>Conoce a tu equipo:</strong> Adapta tus pistas según lo que tu equipo conoce mejor.</p>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🎭</span>
              <p><strong>Practica la mímica:</strong> La ronda 3 es la más difícil. Practica gestos claros y expresivos.</p>
            </div>
          </div>
        </Card>

        {/* Botón Volver */}
        <div className="how-to-play-footer">
          <Button
            title="Volver al Dashboard"
            onClick={() => navigate('/dashboard')}
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default HowToPlay;
