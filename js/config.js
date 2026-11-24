// ===================== CONFIGURACIÓN DEL JUEGO =====================
// Editá este archivo para personalizar mensajes, dificultad y contenido.
// Las referencias personales a la relación pueden agregarse en los arreglos.

const CONFIG = {
  gameName: "VANE COYEYE",
  subtitle: "Corre, Vane, corre... ¡COYEYE!",

  // Dificultad
  startSpeed: 220,            // px/s inicial
  maxSpeed: 720,
  speedRamp: 14,               // incremento de velocidad por segundo (px/s)
  laneCount: 3,
  spawnIntervalStart: 1.5,    // segundos entre obstáculos
  spawnIntervalMin: 0.55,
  collectibleChance: 0.45,

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
    "Mi Dulce Demonio 💙",
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
// Agrega aquí contenidos reales de tu chat "Mi Dulce Demonio".
const PERSONAL = {
  nicknames: ["Vane"],
  catchphrases: ["¡COYEYE!"],
};
window.CONFIG = CONFIG;
window.PERSONAL = PERSONAL;
