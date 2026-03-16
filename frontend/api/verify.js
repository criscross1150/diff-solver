import Groq from "groq-sdk";

const VERIFY_PROMPT = `Eres un sistema de verificación matemática. Resuelve esta ecuación diferencial de forma INDEPENDIENTE usando un enfoque de cálculo directo, sin explicaciones ni pasos intermedios.

Ecuación: {equation}

Responde ÚNICAMENTE con la solución final. Por ejemplo:
y = K(3+x)²
y = e^(-x²/2 + 2)
y = (x² ± 1)²

Solo la expresión final, nada más.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { equation } = req.body;
  if (!equation) return res.status(400).json({ status: "error", message: "No se proporcionó ecuación." });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 256,
      messages: [{ role: "user", content: VERIFY_PROMPT.replace("{equation}", equation) }]
    });

    const solution = response.choices[0].message.content.trim();
    res.json({ status: "ok", sympy_solution: solution });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
}
