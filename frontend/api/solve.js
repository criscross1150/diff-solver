import { GoogleGenerativeAI } from "@google/generative-ai";

const SOLVE_PROMPT = `Eres un profesor universitario experto en ecuaciones diferenciales. Debes resolver la siguiente ecuación diferencial siguiendo EXACTAMENTE la metodología académica estándar, paso a paso, sin omitir ningún cálculo intermedio.

Ecuación: {equation}

═══════════════════════════════════════
ESTRUCTURA OBLIGATORIA DE LA SOLUCIÓN
═══════════════════════════════════════

▸ PASO 0 — CLASIFICACIÓN
  Indica:
  - Orden (número de la derivada más alta)
  - Grado (exponente de esa derivada)
  - Tipo: ordinaria o parcial
  - Lineal o no lineal (justifica brevemente)
  - Método de resolución que se usará

▸ PASO 1 — MANIOBRA ALGEBRAICA INICIAL
  Muestra exactamente qué operación algebraica se aplica para separar variables
  (dividir, multiplicar, reescribir). Escribe la ecuación antes y después.

▸ PASO 2 — SEPARACIÓN DE VARIABLES
  Escribe la ecuación en la forma:
      f(y) dy = g(x) dx
  Muestra cada término claramente a cada lado.

▸ PASO 3 — INTEGRACIÓN DE AMBOS LADOS
  Escribe:
      ∫ f(y) dy = ∫ g(x) dx
  Resuelve cada integral por separado, mostrando la antiderivada obtenida.
  Incluye la constante de integración c ∈ ℝ solo en un lado.

  Si se requieren fracciones parciales, desarrolla la descomposición completa.
  Si la integral no tiene forma elemental, exprésala como ecuación integral.

▸ PASO 4 — SOLUCIÓN GENERAL
  Despeja y (si es posible) usando propiedades de logaritmos y exponenciales.
  Define la constante final K = e^c (o K = e^(2c), según corresponda).
  Escribe la solución general: y = ...

▸ PASO 5 — SOLUCIONES DE EQUILIBRIO (si aplica)
  Si se dividió por f(y) al separar, verifica si f(y) = 0 genera soluciones
  constantes adicionales que se perdieron en el proceso.

▸ PASO 6 — CONDICIÓN INICIAL (solo si existe)
  Sustituye el punto (x₀, y₀) en la solución general.
  Despeja K numéricamente.
  Escribe la solución particular final.
  Indica el dominio de validez si hay restricciones (ej: raíces, logaritmos).

▸ VERIFICACIÓN
  Sustituye la solución obtenida en la ecuación original y confirma que se cumple.

═══════════════════════════════════════
REGLAS DE FORMATO
═══════════════════════════════════════
- Usa → para indicar cada transformación algebraica
- Usa = para igualdades matemáticas
- Escribe integrales con ∫
- Escribe ln para logaritmo natural
- Separa cada PASO con una línea en blanco
- NO saltes pasos, aunque parezcan obvios
- NO cometas errores de cálculo: verifica cada operación antes de escribirla`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { equation } = req.body;
  if (!equation) return res.status(400).json({ detail: "No se proporcionó ecuación." });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContentStream(
      SOLVE_PROMPT.replace("{equation}", equation)
    );

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
  }

  res.end();
}
