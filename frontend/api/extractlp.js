import Groq from "groq-sdk";

const EXTRACT_LP_PROMPT = `Eres un experto en investigación de operaciones. Tu única tarea es LEER con precisión el problema de programación lineal de la imagen.

Extrae EXACTAMENTE el problema tal como aparece:
- Función objetivo (Maximizar o Minimizar Z = ...)
- Restricciones con sus operadores (≤, ≥, =)
- Condiciones de no negatividad
- Si hay datos adicionales (tabla de coeficientes, nombres de variables), inclúyelos

Usa notación matemática estándar: Z = 5x1 + 4x2, no LaTeX.
Responde ÚNICAMENTE con el problema extraído, sin resolverlo ni agregar explicaciones.`;

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
          { type: "text", text: EXTRACT_LP_PROMPT },
          { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } }
        ]
      }]
    });

    const problem = response.choices[0].message.content.trim();
    res.json({ problem });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}
