import Groq from "groq-sdk";

const EXTRACT_PROMPT = `Eres un experto en matemáticas. Tu única tarea es LEER con precisión la ecuación diferencial de la imagen.

Extrae EXACTAMENTE la ecuación diferencial tal como aparece en la imagen.
- Usa notación matemática estándar (dy/dx, y', y'', etc.)
- Si hay condiciones iniciales, inclúyelas
- Si hay múltiples ecuaciones o partes, inclúyelas todas
- NO resuelvas nada, solo transcribe

Responde ÚNICAMENTE con la ecuación extraída, sin explicaciones adicionales.`;

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
