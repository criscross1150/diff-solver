import Groq from "groq-sdk";

const EXTRACT_PROMPT = `Eres un experto en matemáticas. Tu única tarea es transcribir con precisión el enunciado completo del problema que aparece en la imagen.

Extrae TODO el contenido relevante en este orden:
1. La instrucción del ejercicio si existe (ej: "Resuelve el problema de valores iniciales", "Encuentra la solución general", etc.)
2. La ecuación diferencial en notación LaTeX
3. Las condiciones iniciales o de frontera si existen (ej: y(2) = 1, y(0) = 3) — MUY IMPORTANTE, no las omitas
4. Cualquier restricción o dato adicional

Usa LaTeX para las expresiones matemáticas (ej: $\\frac{dy}{dx}$, $y(2)=1$).
Responde con el enunciado completo tal como aparece, sin resolver ni agregar explicaciones.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ detail: "No se recibió imagen." });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: EXTRACT_PROMPT },
          { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } }
        ]
      }]
    });

    const equation = response.choices[0].message.content.trim();
    res.json({ equation });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}
