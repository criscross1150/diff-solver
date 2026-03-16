import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(
      VERIFY_PROMPT.replace("{equation}", equation)
    );

    const solution = result.response.text().trim();
    res.json({ status: "ok", sympy_solution: solution });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
}
