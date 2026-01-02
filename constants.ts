
export const INTERDISCIPLINARY_SUGGESTIONS = [
  "Matemática", "Historia", "Geografía", "Biología", 
  "Ciencias Físicas", "Arte", "Idioma Español", "Inglés"
];

export const EDUCATIONAL_LEVELS = [
  "7mo Año (EBI)", "8vo Año (EBI)", "9no Año (EBI)", 
  "1er Año (Bachillerato)", "2do Año (Bachillerato)", "3er Año (Bachillerato)"
];

export const GAMIFIED_THEMES = [
  "Cyberpunk / Hackers del Futuro",
  "Fantasía Medieval / Hechiceros de Código",
  "Apocalipsis Zombie / Supervivencia",
  "Exploración Espacial / Misión Marte",
  "Detectives / Misterio Noir",
  "Superhéroes / Academia de Poderes"
];

const COMMON_RULES = `
ESPECIFICACIONES TÉCNICAS (HTML5):
- Librerías: Pyodide para ejecución de Python, jsPDF para reportes, FontAwesome para iconos.
- UI: Estética profesional, responsiva.
- Editor de código: Manejo de TAB (4 espacios), consola de salida, y validación con casos de prueba.
- Generador de PDF: Debe capturar el proceso del estudiante (nombre, nivel, puntaje quiz, código final y resultado de validación).
- Footer: TODAS las páginas deben incluir un pie de página (footer) visible, centrado y estilizado con el siguiente texto exacto: "Recurso generado por la app SHANUKI creado por el equipo académico de ciencias de la computación - CEIBAL - DPD y Licencia: Creative Commons CC BY-SA 4.0".

IMPORTANTE:
1. Entrega ÚNICAMENTE el código HTML completo y funcional.
2. AL FINAL, incluye <SHANUKI_DATA>{"distractorWords": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5", "palabra6"]}</SHANUKI_DATA>.
`;

export const PBL_PROMPT = `PROMPT: UNIDAD DE APRENDIZAJE INTEGRAL CON ABP (TEORÍA + QUIZ + CÓDIGO)

ROL: Docente Experto en Didáctica de la Computación y ABP.
MODO: APRENDIZAJE BASADO EN PROBLEMAS (REALISTA E INTERDISCIPLINARIO).

PARÁMETROS:
- Nivel: [NIVEL]
- Lenguaje: [LENGUAJE]
- Tema Técnico: [TEMA]
- Materia Interdisciplinaria: [MATERIA]
- Contexto: [CONTEXTO]

MATERIALES DE CONSULTA:
1. TEÓRICO INFORMÁTICA: [CS_THEORY_TEXT] (Usa esto para las explicaciones y flashcards).
2. DOCUMENTO INTERDISCIPLINARIO: [PROGRAM_TEXT] (Usa esto para el contexto del problema).

ESTRUCTURA:
1. Problema Real: Presenta el desafío interdisciplinario.
2. Teoría: Explica el [TEMA] basándote en el TEÓRICO ADJUNTO.
3. Quiz: 3 preguntas conceptuales.
4. Desafío Práctico: Resuelve el problema de [MATERIA] usando código.

${COMMON_RULES}`;

export const GAMIFIED_PROMPT = `PROMPT: UNIDAD DE APRENDIZAJE GAMIFICADA (NARRATIVA + RETOS)

ROL: Diseñador de Videojuegos Educativos y Docente Senior.
MODO: GAMIFICACIÓN INMERSIVA.

PARÁMETROS:
- Nivel: [NIVEL]
- Lenguaje: [LENGUAJE]
- Tema Técnico: [TEMA]
- Temática Narrativa: [NARRATIVA]

MATERIALES DE CONSULTA:
1. TEÓRICO INFORMÁTICA: [CS_THEORY_TEXT] (Usa esto estrictamente para el contenido académico).

INSTRUCCIONES DE DISEÑO VISUAL Y NARRATIVO:
- Adapta todo el CSS y textos al estilo: [NARRATIVA].
- El estudiante es el "Héroe/Protagonista".
- El editor de código es la "Herramienta/Arma".

ESTRUCTURA:
1. Misión Inicial: Introduce la historia.
2. Entrenamiento (Teoría): Flashcards estilizadas según la narrativa.
3. Prueba de Acceso (Quiz): Preguntas para avanzar.
4. Misión Final (Editor): Resolver el reto usando código para "ganar" el nivel.

${COMMON_RULES}`;

export const EDIT_PROMPT = `ACTUALIZACIÓN DE UNIDAD DIDÁCTICA.

Tienes el siguiente código HTML de una unidad educativa:
[CURRENT_HTML]

El docente solicita el siguiente cambio/ajuste:
"[USER_FEEDBACK]"

INSTRUCCIONES:
1. Modifica el código HTML existente para satisfacer la solicitud del docente.
2. Mantén la estructura funcional (Pyodide, PDF, etc.).
3. Asegúrate de que el footer incluya el texto obligatorio: "Recurso generado por la app SHANUKI creado por el equipo académico de ciencias de la computación - CEIBAL - DPD y Licencia: Creative Commons CC BY-SA 4.0".
4. Devuelve el HTML completo corregido.
5. Incluye nuevamente el bloque <SHANUKI_DATA> al final.`;
