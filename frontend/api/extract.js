import Groq from "groq-sdk";

const EXTRACT_PROMPT = `Eres un experto en matemáticas. Transcribe exactamente el problema que aparece en la imagen.

Reglas estrictas:
- Copia el texto del enunciado tal como aparece (ej: "Resuelve el problema de valores iniciales")
- Escribe la ecuación en LaTeX (ej: $\\frac{dy}{dx} = -xy$)
- Incluye las condiciones iniciales si existen (ej: $y(2) = 1$) — NO las omitas bajo ninguna circunstancia
- NO agregues títulos propios, pasos, ni explicaciones
- NO uses encabezados como "## Step" ni "Instrucción:"
- Responde solo con el enunciado del problema, en 1 a 4 líneas máximo`;

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
