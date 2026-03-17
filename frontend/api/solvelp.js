import Groq from "groq-sdk";

const LP_PROMPT = `Eres un profesor universitario experto en investigación de operaciones y programación lineal. Resuelve el siguiente problema siguiendo EXACTAMENTE la metodología académica estándar, paso a paso, sin omitir ningún cálculo intermedio.

Problema: {problem}

═══════════════════════════════════════
ESTRUCTURA OBLIGATORIA DE LA SOLUCIÓN
═══════════════════════════════════════

▸ PASO 0 — CLASIFICACIÓN
  Indica:
  - Tipo: maximización o minimización
  - Variables de decisión y su significado
  - Número de restricciones
  - Método a usar: Método Gráfico (si hay exactamente 2 variables) o Método Simplex (3 o más variables)

▸ PASO 1 — FORMULACIÓN MATEMÁTICA
  Escribe con claridad:
  - Función objetivo: $$\\text{max/min } Z = c_1 x_1 + c_2 x_2 + \\cdots$$
  - Restricciones etiquetadas (R1, R2, ...):
    $$a_{11}x_1 + a_{12}x_2 \\leq b_1$$
  - Condición de no negatividad: $x_1, x_2 \\geq 0$

▸ PASO 2 — FORMA ESTÁNDAR (si usas Simplex)
  Agrega variables de holgura $s_i$ para convertir desigualdades en igualdades.
  Escribe el sistema resultante y la base inicial.

▸ PASO 3 — RESOLUCIÓN

  Si MÉTODO GRÁFICO (2 variables):
  — Para cada restricción, despeja $x_2$ y encuentra dos puntos de la recta
  — Describe la región factible
  — Lista todos los vértices del polígono factible con sus coordenadas
  — Evalúa $Z$ en cada vértice:
    $$\\begin{array}{c|c|c}
    \\text{Vértice} & (x_1, x_2) & Z \\\\
    \\hline
    \\vdots & \\vdots & \\vdots
    \\end{array}$$

  Si MÉTODO SIMPLEX:
  — Construye el tableau inicial:
    $$\\begin{array}{c|ccccc|c}
    \\text{Base} & x_1 & x_2 & s_1 & s_2 & \\cdots & b \\\\
    \\hline
    \\vdots & \\vdots & \\vdots & \\vdots & \\vdots & \\cdots & \\vdots \\\\
    \\hline
    Z & \\cdots & \\cdots & \\cdots & \\cdots & \\cdots & \\cdots
    \\end{array}$$
  — En cada iteración:
    · Identifica la variable entrante (coeficiente más negativo en fila Z para max)
    · Calcula razones $b_i / a_{ij}$ para identificar la variable saliente
    · Aplica operaciones de fila para actualizar el tableau
    · Muestra el nuevo tableau completo
  — Continúa hasta criterio de optimalidad

▸ PASO 4 — SOLUCIÓN ÓPTIMA
  - Valores de todas las variables: $x_1^* = \\ldots,\\; x_2^* = \\ldots$
  - Valor óptimo: $Z^* = \\ldots$
  - Variables de holgura (si aplica)
  - Interpretación del resultado en contexto del problema

▸ VERIFICACIÓN
  Sustituye la solución en cada restricción original y confirma que todas se satisfacen.
  $$R_i:\\; \\ldots \\leq b_i \\quad \\checkmark$$

═══════════════════════════════════════
REGLAS DE FORMATO
═══════════════════════════════════════
- Escribe TODA expresión matemática en LaTeX
- Expresión dentro de una oración: $expresión$
- Ecuación en línea propia (centrada): $$expresión$$
- Tableaux y tablas: $$\\begin{array}{...} ... \\end{array}$$
- Separa cada PASO con una línea en blanco
- NO saltes pasos, NO cometas errores de cálculo`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { problem } = req.body;
  if (!problem) return res.status(400).json({ detail: "No se proporcionó el problema." });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 8192,
      stream: true,
      messages: [{ role: "user", content: LP_PROMPT.replace("{problem}", problem) }]
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
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
