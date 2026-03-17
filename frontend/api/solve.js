import Groq from "groq-sdk";

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
  Dado el punto $(x_0, y_0)$, sigue estos sub-pasos OBLIGATORIOS sin saltarte ninguno:
  1. Escribe la solución general y sustituye literalmente $x = x_0$, $y = y_0$
  2. Calcula $x_0^2$ como número exacto (ej: si $x_0 = 2$ entonces $x_0^2 = 4$)
  3. Calcula cada operación sobre el exponente paso a paso
     (ej: $-\frac{x_0^2}{2} = -\frac{4}{2} = -2$, por lo tanto $e^{-2}$)
  4. Despeja $K$ algebraicamente mostrando cada paso:
     $K = \frac{y_0}{e^{\ldots}} = e^{\ldots}$
  5. Escribe la solución particular final con $K$ sustituido
  6. VERIFICACIÓN INMEDIATA: evalúa $y(x_0)$ con la solución particular
     y confirma explícitamente que el resultado es $y_0$

▸ VERIFICACIÓN
  a) Calcula $\frac{dy}{dx}$ de la solución obtenida paso a paso
  b) Sustituye en la ecuación original y confirma la igualdad algebraica
  c) Si hay condición inicial: evalúa $y(x_0)$ numéricamente y confirma que es $y_0$

═══════════════════════════════════════
REGLAS DE FORMATO
═══════════════════════════════════════
- Escribe TODA expresión matemática en LaTeX
- Expresión dentro de una oración: $expresión$
- Ecuación en línea propia (centrada y destacada): $$expresión$$
- Notación: \\frac{dy}{dx}, \\int f\\,dy, \\ln|y|, e^{C}, K = \\pm e^C
- Separa cada PASO con una línea en blanco
- NO saltes pasos, NO cometas errores de cálculo`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { equation } = req.body;
  if (!equation) return res.status(400).json({ detail: "No se proporcionó ecuación." });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 8192,
      stream: true,
      messages: [
        {
          role: "system",
          content: "Eres un experto en cálculo diferencial. Cuando hay condición inicial, SIEMPRE calcula x₀² como número, luego el exponente completo, luego despeja K. Verifica cada resultado numérico antes de continuar. Nunca cometas errores de signo."
        },
        { role: "user", content: SOLVE_PROMPT.replace("{equation}", equation) }
      ]
    });

    let inThink = false;
    let thinkNotified = false;
    let thinkBuf = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (!text) continue;

      // Filter <think>...</think> reasoning blocks; notify frontend once when thinking starts
      let remaining = thinkBuf + text;
      thinkBuf = "";
      let filtered = "";

      while (remaining.length > 0) {
        if (inThink) {
          const end = remaining.indexOf("</think>");
          if (end !== -1) {
            inThink = false;
            remaining = remaining.slice(end + 8);
          } else {
            thinkBuf = remaining;
            remaining = "";
          }
        } else {
          const start = remaining.indexOf("<think>");
          if (start !== -1) {
            filtered += remaining.slice(0, start);
            inThink = true;
            if (!thinkNotified) {
              thinkNotified = true;
              res.write(`data: ${JSON.stringify({ type: "thinking" })}\n\n`);
            }
            remaining = remaining.slice(start + 7);
          } else {
            filtered += remaining;
            remaining = "";
          }
        }
      }

      if (filtered) {
        res.write(`data: ${JSON.stringify({ type: "text", content: filtered })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
  }

  res.end();
}
