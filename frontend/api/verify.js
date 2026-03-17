import Groq from "groq-sdk";

const VERIFY_PROMPT = `Eres un sistema de verificación matemática. Resuelve esta ecuación diferencial de forma INDEPENDIENTE usando un enfoque de cálculo directo, sin explicaciones ni pasos intermedios.

Ecuación: {equation}

Responde ÚNICAMENTE con la solución final en formato LaTeX, en una sola línea. Ejemplos:
$$y = K(3+x)^2$$
$$y = e^{-x^2/2 + 2}$$
$$y = \\pm\\sqrt{x^2 + 1}$$

Solo esa línea LaTeX, nada más.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { equation } = req.body;
  if (!equation) return res.status(400).json({ status: "error", message: "No se proporcionó ecuación." });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 256,
      messages: [
        {
          role: "system",
          content: "Eres un verificador matemático con precisión absoluta. Regla crítica: al separar variables el signo de g(x) NUNCA cambia. Si la ecuación tiene -xy, entonces al separar obtienes dy/y = -x dx, y la integral es -x²/2, NO +x²/2. Verifica el signo antes de integrar."
        },
        { role: "user", content: VERIFY_PROMPT.replace("{equation}", equation) }
      ]
    });

    const solution = response.choices[0].message.content.trim();
    res.json({ status: "ok", sympy_solution: solution });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
}
