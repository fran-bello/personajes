/**
 * Servicio de sonidos para el juego Personajes
 * 
 * Este servicio maneja la reproducción de sonidos del juego.
 * Los sonidos se cargan desde la carpeta /sounds en public.
 * 
 * Para agregar sonidos:
 * 1. Coloca los archivos de sonido (MP3, WAV, OGG) en frontend/public/sounds/
 * 2. Actualiza el objeto SOUNDS con las rutas de tus archivos
 * 3. Los sonidos se reproducirán automáticamente en los eventos correspondientes
 */

// Configuración de sonidos
const SOUNDS = {
  // Sonidos de juego
  hit: '/sounds/success.wav',       // Acierto
  fail: '/sounds/fail.wav',         // Fallo
  timeUp: '/sounds/fail.wav',       // Tiempo agotado (usa fail por ahora)
  tick: '/sounds/tictac.wav',       // Tick del timer (10 segundos exactos)
  roundStart: null,  // Inicio de ronda (sin sonido)
  gameStart: null,   // Inicio de partida (sin sonido)
  gameEnd: '/sounds/success.wav',   // Fin de partida (usa success por ahora)
  cardFlip: '/sounds/slice.wav',  // Voltear tarjeta (cuando se presiona para ver el personaje) - ÚNICO uso de slice.wav
  pause: '/sounds/select.flac',     // Pausar
  resume: '/sounds/select.flac',    // Reanudar
  button: '/sounds/select.flac',    // Sonido genérico para botones
};

// Cache de Audio objects
const audioCache = {};

// Configuración
let enabled = true;
let volume = 0.7; // Volumen por defecto (0.0 a 1.0)

/**
 * Pre-cargar un sonido
 */
function preloadSound(soundName) {
  if (!SOUNDS[soundName]) {
    console.warn(`Sonido no encontrado: ${soundName}`);
    return null;
  }

  if (audioCache[soundName]) {
    return audioCache[soundName];
  }

  try {
    const audio = new Audio(SOUNDS[soundName]);
    audio.volume = volume;
    audioCache[soundName] = audio;
    return audio;
  } catch (error) {
    console.warn(`Error al cargar sonido ${soundName}:`, error);
    return null;
  }
}

/**
 * Reproducir un sonido
 */
function playSound(soundName, options = {}) {
  if (!enabled) return;

  const audio = preloadSound(soundName);
  if (!audio) return;

  try {
    // Si el audio ya está reproduciéndose, reiniciarlo desde el principio
    if (!audio.paused) {
      audio.currentTime = options.startTime !== undefined ? options.startTime : 0;
    } else {
      // Si está pausado, establecer el tiempo inicial
      if (options.startTime !== undefined) {
        audio.currentTime = options.startTime;
      } else {
        audio.currentTime = 0;
      }
    }

    // Aplicar opciones
    if (options.volume !== undefined) {
      audio.volume = Math.min(Math.max(options.volume, 0), 1);
    } else {
      audio.volume = volume;
    }

    // Reproducir
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Si se especifica un tiempo de fin, detener el audio en ese momento
        if (options.endTime !== undefined) {
          const checkTime = () => {
            if (audio.currentTime >= options.endTime) {
              audio.pause();
              audio.removeEventListener('timeupdate', checkTime);
            }
          };
          audio.addEventListener('timeupdate', checkTime);
        }
      }).catch(error => {
        // Los navegadores pueden bloquear la reproducción automática
        // Solo mostrar error si no es un error de reproducción bloqueada
        if (error.name !== 'NotAllowedError' && error.name !== 'NotSupportedError') {
          console.warn(`Error al reproducir sonido ${soundName}:`, error);
        }
      });
    }
  } catch (error) {
    console.warn(`Error al reproducir sonido ${soundName}:`, error);
  }
}

/**
 * Generar un sonido simple usando Web Audio API (fallback)
 */
function generateTone(frequency, duration, type = 'sine') {
  if (!enabled) return;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Si no se puede crear el contexto de audio, no hacer nada
  }
}

/**
 * Sonidos de fallback usando Web Audio API
 */
const fallbackSounds = {
  hit: () => generateTone(800, 0.1, 'sine'),
  fail: () => generateTone(200, 0.2, 'sawtooth'),
  tick: () => generateTone(1000, 0.05, 'sine'),
  timeUp: () => {
    generateTone(400, 0.2, 'sine');
    setTimeout(() => generateTone(300, 0.3, 'sine'), 200);
  },
  roundStart: () => {
    generateTone(600, 0.15, 'sine');
    setTimeout(() => generateTone(800, 0.15, 'sine'), 150);
  },
  button: () => generateTone(600, 0.08, 'sine'), // Sonido de botón genérico
};

/**
 * Reproducir sonido con fallback
 */
function playSoundWithFallback(soundName, options = {}) {
  const audio = preloadSound(soundName);
  
  // Si el archivo no existe o falla, usar fallback
  if (!audio) {
    if (fallbackSounds[soundName]) {
      fallbackSounds[soundName]();
    }
    return;
  }

  // Intentar reproducir el archivo
  playSound(soundName, options);

  // Si falla la reproducción del archivo, usar fallback
  audio.onerror = () => {
    if (fallbackSounds[soundName]) {
      fallbackSounds[soundName]();
    }
  };
}

export const soundService = {
  /**
   * Habilitar/deshabilitar sonidos
   */
  setEnabled(value) {
    enabled = value;
    // Guardar preferencia en localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('soundsEnabled', JSON.stringify(value));
    }
  },

  /**
   * Obtener estado de habilitación
   */
  isEnabled() {
    return enabled;
  },

  /**
   * Cargar preferencias desde localStorage
   */
  loadPreferences() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('soundsEnabled');
      if (saved !== null) {
        enabled = JSON.parse(saved);
      }
      
      const savedVolume = localStorage.getItem('soundsVolume');
      if (savedVolume !== null) {
        volume = parseFloat(savedVolume);
      }
    }
  },

  /**
   * Establecer volumen (0.0 a 1.0)
   */
  setVolume(value) {
    volume = Math.min(Math.max(value, 0), 1);
    
    // Actualizar volumen de todos los sonidos en caché
    Object.values(audioCache).forEach(audio => {
      audio.volume = volume;
    });

    // Guardar preferencia
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('soundsVolume', volume.toString());
    }
  },

  /**
   * Obtener volumen actual
   */
  getVolume() {
    return volume;
  },

  /**
   * Pre-cargar todos los sonidos
   */
  preloadAll() {
    Object.keys(SOUNDS).forEach(soundName => {
      preloadSound(soundName);
    });
  },

  // Métodos de reproducción para cada tipo de sonido
  playHit() {
    // Reproducir success.wav con volumen aumentado
    if (!enabled) return;
    
    if (!SOUNDS.hit) {
      // Si no hay sonido configurado, usar fallback
      if (fallbackSounds.hit) {
        fallbackSounds.hit();
      }
      return;
    }

    try {
      // Crear una nueva instancia de Audio para reproducir el sonido con volumen aumentado
      const hitAudio = new Audio(SOUNDS.hit);
      hitAudio.volume = volume * 0.9; // Volumen aumentado para success (90% del volumen)
      
      const playPromise = hitAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'NotAllowedError' && error.name !== 'NotSupportedError') {
            console.warn('Error al reproducir hit:', error);
          }
          // Si falla, usar fallback
          if (fallbackSounds.hit) {
            fallbackSounds.hit();
          }
        });
      }
    } catch (error) {
      console.warn('Error al reproducir hit:', error);
      // Si falla, usar fallback
      if (fallbackSounds.hit) {
        fallbackSounds.hit();
      }
    }
  },

  playFail() {
    playSoundWithFallback('fail');
  },

  playTimeUp() {
    playSoundWithFallback('timeUp');
  },

  playTick() {
    // Reproducir tictac.wav cuando queden 10 segundos (el archivo dura exactamente 10 segundos)
    if (!enabled) return;

    if (!SOUNDS.tick) {
      // Si no hay sonido configurado, usar fallback
      if (fallbackSounds.tick) {
        fallbackSounds.tick();
      }
      return;
    }

    try {
      // Crear una nueva instancia de Audio para reproducir el sonido
      const tickAudio = new Audio(SOUNDS.tick);
      tickAudio.volume = volume * 0.9; // Volumen aumentado para tictac (90% del volumen)
      
      const playPromise = tickAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'NotAllowedError' && error.name !== 'NotSupportedError') {
            console.warn('Error al reproducir tick:', error);
          }
          // Si falla, usar fallback
          if (fallbackSounds.tick) {
            fallbackSounds.tick();
          }
        });
      }
    } catch (error) {
      console.warn('Error al reproducir tick:', error);
      // Si falla, usar fallback
      if (fallbackSounds.tick) {
        fallbackSounds.tick();
      }
    }
  },

  playRoundStart() {
    // Sin sonido - slice.wav es solo para voltear tarjeta
  },

  playGameStart() {
    // Sin sonido - slice.wav es solo para voltear tarjeta
  },

  playGameEnd() {
    playSound('gameEnd');
  },

  playCardFlip() {
    // Sonido específico para voltear la tarjeta (slice) - acelerado
    if (!enabled) return;
    
    if (!SOUNDS.cardFlip) {
      // Si no hay sonido configurado, usar fallback
      if (fallbackSounds.button) {
        fallbackSounds.button();
      }
      return;
    }

    try {
      // Crear una nueva instancia de Audio para reproducir el sonido acelerado
      const cardFlipAudio = new Audio(SOUNDS.cardFlip);
      cardFlipAudio.volume = volume;
      cardFlipAudio.playbackRate = 1.3; // Acelerar el sonido en un 30%
      
      const playPromise = cardFlipAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'NotAllowedError' && error.name !== 'NotSupportedError') {
            console.warn('Error al reproducir cardFlip:', error);
          }
          // Si falla, usar fallback
          if (fallbackSounds.button) {
            fallbackSounds.button();
          }
        });
      }
    } catch (error) {
      console.warn('Error al reproducir cardFlip:', error);
      // Si falla, usar fallback
      if (fallbackSounds.button) {
        fallbackSounds.button();
      }
    }
  },

  playPause() {
    playSoundWithFallback('button'); // Usar sonido de botón genérico (select)
  },

  playResume() {
    playSoundWithFallback('button'); // Usar sonido de botón genérico (select)
  },

  // Método genérico para reproducir sonido de botón (select)
  playButtonClick() {
    playSoundWithFallback('button');
  },

  // Método genérico para reproducir cualquier sonido
  play(soundName, options) {
    playSoundWithFallback(soundName, options);
  },
};

// Cargar preferencias al inicializar
if (typeof window !== 'undefined') {
  soundService.loadPreferences();
}

