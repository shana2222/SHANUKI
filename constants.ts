
export const INTERDISCIPLINARY_SUGGESTIONS = [
  "Matemática", "Historia", "Geografía", "Biología", 
  "Ciencias Físicas", "Arte", "Idioma Español", "Inglés"
];

export const EDUCATIONAL_LEVELS = [
  "7mo Año (EBI)", "8vo Año (EBI)", "9no Año (EBI)", 
  "1er Año (Bachillerato)", "2do Año (Bachillerato)", "3er Año (Bachillerato)"
];

export const MASTER_PROMPT = `PROMPT MAESTRO 5.0: UNIDAD DE APRENDIZAJE INTEGRAL CON ABP (TEORÍA + QUIZ + CÓDIGO)

ROL Y OBJETIVO
Actúa como un Docente Experto en Didáctica de la Computación (Nivel Secundaria/Bachillerato Uruguay) y Desarrollador Web Senior. Tu misión es generar una Unidad de Aprendizaje Autónoma basada en Aprendizaje Basado en Problemas (ABP) en un solo archivo HTML.

PARÁMETROS DE ENTRADA
- Nivel Educativo: [NIVEL]
- Lenguaje: [LENGUAJE]
- Concepto Técnico: [TEMA]
- Materia Interdisciplinaria: [MATERIA]
- Contexto Sugerido: [CONTEXTO]
- Texto del Programa (Base de consulta): [PROGRAMA_TEXTO]

INSTRUCCIONES CRÍTICAS DE INTERDISCIPLINARIEDAD Y ABP
1. ANALIZA EL PROGRAMA: Si se proporcionó un [PROGRAMA_TEXTO], busca temas específicos de ese programa que conecten con el [TEMA] técnico.
2. DISEÑO ABP: La unidad debe centrarse en un PROBLEMA REAL que el estudiante de [NIVEL] debe resolver usando el [LENGUAJE]. El problema debe integrar conceptos de la [MATERIA].

ESTRUCTURA DE LA UNIDAD (ORDEN LÓGICO):
1. Gran Pregunta / Desafío Inicial: Presenta el problema interdisciplinario de forma motivadora.
2. Repaso Teórico (Flashcards): Conceptos técnicos necesarios para resolver el desafío.
3. Verificación Conceptual: Quiz de 3 preguntas con retroalimentación inmediata.
4. Desafío Práctico (Editor Python): Resolución del problema planteado inicialmente.

ESPECIFICACIONES TÉCNICAS (HTML5):
- Librerías: Pyodide para ejecución de Python, jsPDF para reportes, FontAwesome para iconos.
- UI: Estética profesional, modo oscuro por defecto, responsiva.
- Editor de código: Manejo de TAB (4 espacios), consola de salida, y validación con casos de prueba vinculados al problema.
- Generador de PDF: Debe capturar el proceso del estudiante (nombre, nivel, puntaje quiz, código final y resultado de validación).

IMPORTANTE: 
1. Entrega ÚNICAMENTE el código HTML completo y funcional dentro de bloques de código markdown si es necesario, o como texto plano.
2. AL FINAL DE TODO, después de cerrar el </html>, debes incluir obligatoriamente un bloque de datos técnicos encerrado entre las etiquetas <SHANUKI_DATA> y </SHANUKI_DATA>.
3. El contenido dentro de <SHANUKI_DATA> debe ser un objeto JSON válido con la siguiente estructura:
   {"distractorWords": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5", "palabra6"]}
4. Asegúrate de que el JSON sea válido, use comillas dobles y no tenga comas sobrantes.`;
