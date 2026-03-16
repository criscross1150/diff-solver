import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      EXTRACT_PROMPT,
      { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } },
    ]);

    const equation = result.response.text().trim();
    res.json({ equation });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
}
