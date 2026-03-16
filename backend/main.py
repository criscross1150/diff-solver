import os
import base64
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import anthropic

app = FastAPI()

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY no configurada.")
    return anthropic.Anthropic(api_key=api_key)

EXTRACT_PROMPT = """Eres un experto en matemáticas. Tu única tarea es LEER con precisión la ecuación diferencial de la imagen.

Extrae EXACTAMENTE la ecuación diferencial tal como aparece en la imagen.
- Usa notación matemática estándar (dy/dx, y', y'', etc.)
- Si hay condiciones iniciales, inclúyelas
- Si hay múltiples ecuaciones o partes, inclúyelas todas
- NO resuelvas nada, solo transcribe

Responde ÚNICAMENTE con la ecuación extraída, sin explicaciones adicionales."""

SOLVE_PROMPT = """Eres un profesor universitario experto en ecuaciones diferenciales. Debes resolver la siguiente ecuación diferencial siguiendo EXACTAMENTE la metodología académica estándar, paso a paso, sin omitir ningún cálculo intermedio.

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
  Sustituye el punto (x₀, y₀) en la solución general.
  Despeja K numéricamente.
  Escribe la solución particular final.
  Indica el dominio de validez si hay restricciones (ej: raíces, logaritmos).

▸ VERIFICACIÓN
  Sustituye la solución obtenida en la ecuación original y confirma que se cumple.

═══════════════════════════════════════
REGLAS DE FORMATO
═══════════════════════════════════════
- Usa → para indicar cada transformación algebraica
- Usa = para igualdades matemáticas
- Escribe integrales con ∫
- Escribe ln para logaritmo natural
- Separa cada PASO con una línea en blanco
- NO saltes pasos, aunque parezcan obvios
- NO cometas errores de cálculo: verifica cada operación antes de escribirla"""


@app.post("/api/extract")
async def extract_equation(image: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa JPG, PNG, GIF o WebP.")

    image_data = await image.read()
    image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = image.content_type
    if media_type == "image/jpg":
        media_type = "image/jpeg"

    try:
        client = get_client()
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64
                        }
                    },
                    {"type": "text", "text": EXTRACT_PROMPT}
                ]
            }]
        )
        equation = response.content[0].text.strip()
        return {"equation": equation}

    except anthropic.BadRequestError as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@app.post("/api/solve")
async def solve_equation(body: dict):
    equation = body.get("equation", "").strip()
    if not equation:
        raise HTTPException(status_code=400, detail="No se proporcionó ninguna ecuación.")

    def stream_solution():
        try:
            client = get_client()
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=8192,
                thinking={"type": "adaptive"},
                messages=[{
                    "role": "user",
                    "content": SOLVE_PROMPT.format(equation=equation)
                }]
            ) as stream:
                for event in stream:
                    if event.type == "content_block_delta":
                        if event.delta.type == "text_delta":
                            data = json.dumps({"type": "text", "content": event.delta.text})
                            yield f"data: {data}\n\n"

                yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        stream_solution(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
