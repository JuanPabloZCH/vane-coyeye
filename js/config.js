// ===================== CONFIGURACIÓN DEL JUEGO =====================
// Editá este archivo para personalizar mensajes, dificultad y contenido.
// Las referencias personales a la relación pueden agregarse en los arreglos.

const CONFIG = {
  gameName: "VANE COYEYE",
  subtitle: "Corre, Vane, corre... ¡COYEYE!",

  // Dificultad
  startSpeed: 180,            // px/s inicial (más lento para aprender)
  maxSpeed: 620,
  speedPerLevel: 55,          // incremento de velocidad por nivel
  speedLerp: 0.8,             // suavizado de velocidad
  laneCount: 3,
  spawnIntervalStart: 1.7,    // segundos entre obstáculos
  spawnIntervalMin: 0.5,
  collectibleChance: 0.42,

  // Vidas
  maxLives: 8,
  invulnerabilityTime: 1.3,   // segundos de invulnerabilidad tras daño
  damageNormal: 1,
  damageHeavy: 2,

  // Objetivos especiales
  specialDistance: 2500,      // metros para pantalla especial
  specialHearts: 15,          // corazones para pantalla especial

  // Mensajes de Game Over (se elige uno al azar)
  gameOverMessages: [
    "Las arañas ganaron esta vez... 🕷️",
    "Vane, ¿qué pasó ahí? 😂",
    "No importa, otra oportunidad 💙",
    "El amor nunca pierde, pero esta partida sí.",
    "¡COYEYE! A intentarlo de nuevo.",
    "Respira, ríete y vuelve a correr.",
  ],

  // Mensajes sorpresa que aparecen durante la partida (ocasionales)
  surpriseMessages: [
    "💙 Hecho pensando en ti.",
    "♾️ Siempre tú.",
    "🫰🏽 COYEYE",
    "08 · 10 · 2026",
    "Corre, Vane, corre... 💙",
    "¡Tú puedes!",
  ],

  // Dedicatoria final (editable)
  specialMessage: "Este pequeño juego fue hecho con cariño, risas y un poco de COYEYE, solo para ti. Gracias por ser mi persona favorita. 💙♾️ 08",

  // Controles táctiles visibles en móvil
  showTouchControls: true,

  // Audio
  audioFile: "assets/audio/coyeye.mp3",
  audioMinInterval: 1.6,     // segundos mínimos entre reproducciones
  audioVolume: 0.8,
};

// Apodos / frases / referencias personales.
// Agrega aquí contenidos personales si lo deseas.
const PERSONAL = {
  nicknames: ["Vane"],
  catchphrases: ["¡COYEYE!"],
};
window.CONFIG = CONFIG;
window.PERSONAL = PERSONAL;
