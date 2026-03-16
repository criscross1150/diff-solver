import { useState, useRef, useCallback, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''

// ─── Estilos ─────────────────────────────────────────────────────────────────

const S = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px',
    background: 'linear-gradient(135deg, #0f1117 0%, #141824 100%)',
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  title: {
    fontSize: 'clamp(1.4rem, 4vw, 2rem)',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #7c6af7, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: { color: '#64748b', fontSize: '0.9rem', letterSpacing: '0.03em' },
  container: { width: '100%', maxWidth: '860px', display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#1a1d2e', border: '1px solid #2a2d45', borderRadius: '16px', padding: '24px' },
  cardTitle: {
    fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: '#7c6af7', marginBottom: '16px',
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
  },
  btn: (variant = 'primary', disabled = false) => ({
    padding: '12px 22px',
    borderRadius: '10px',
    border: 'none',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
    background: variant === 'primary'
      ? 'linear-gradient(135deg, #7c6af7, #a78bfa)'
      : variant === 'camera'
      ? 'linear-gradient(135deg, #0f766e, #14b8a6)'
      : '#2a2d45',
    color: '#fff',
    boxShadow: (variant === 'primary' || variant === 'camera') && !disabled
      ? `0 4px 16px rgba(${variant === 'camera' ? '20,184,166' : '124,106,247'},0.35)`
      : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),
  row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  rowCenter: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' },
  spinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },
  badge: (type) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 500,
    background: type === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(124,106,247,0.15)',
    color: type === 'success' ? '#34d399' : '#a78bfa',
    border: `1px solid ${type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(124,106,247,0.3)'}`,
  }),
  equationBox: {
    background: '#111320', border: '1px solid #2a2d45', borderRadius: '10px',
    padding: '18px 22px', fontFamily: "'JetBrains Mono', monospace",
    fontSize: '1rem', color: '#e2e8f0', lineHeight: 1.7, wordBreak: 'break-word',
  },
  solutionBox: {
    background: '#111320', border: '1px solid #2a2d45', borderRadius: '10px',
    padding: '22px', fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.9,
    whiteSpace: 'pre-wrap', minHeight: '120px', wordBreak: 'break-word',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px', padding: '14px 18px', color: '#fca5a5', fontSize: '0.875rem',
  },
  dropzone: (dragging) => ({
    border: `2px dashed ${dragging ? '#7c6af7' : '#2a2d45'}`,
    borderRadius: '12px', padding: '28px 20px', textAlign: 'center',
    background: dragging ? 'rgba(124,106,247,0.05)' : 'transparent',
    transition: 'all 0.2s',
  }),
  // Crop
  cropWrap: { position: 'relative', display: 'inline-block', maxWidth: '100%', cursor: 'crosshair' },
  cropImg: { display: 'block', maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', userSelect: 'none' },
  cropCanvas: {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    borderRadius: '8px',
    touchAction: 'none',
  },
  cropHint: {
    marginTop: '10px', color: '#64748b', fontSize: '0.82rem', textAlign: 'center',
  },
}

// ─── Herramienta de recorte ───────────────────────────────────────────────────

function CropTool({ imageUrl, onCrop, onSkip }) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const dragging = useRef(false)
  const startPt = useRef(null)
  const [sel, setSel] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Sincroniza canvas al tamaño real de la imagen renderizada
  const syncCanvas = useCallback(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    canvas.width = img.offsetWidth
    canvas.height = img.offsetHeight
  }, [])

  useEffect(() => {
    if (!imgLoaded) return
    syncCanvas()
    window.addEventListener('resize', syncCanvas)
    return () => window.removeEventListener('resize', syncCanvas)
  }, [imgLoaded, syncCanvas])

  // Dibuja la selección sobre el canvas
  const draw = useCallback((currentSel) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!currentSel || currentSel.w === 0 || currentSel.h === 0) return

    const { x, y, w, h } = currentSel
    // Oscurecer todo
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Limpiar zona seleccionada
    ctx.clearRect(x, y, w, h)
    // Borde de selección
    ctx.strokeStyle = '#7c6af7'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)
    // Esquinas
    const cs = 10
    ctx.strokeStyle = '#a78bfa'
    ctx.lineWidth = 3
    ;[[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
      ctx.beginPath()
      ctx.moveTo(cx - cs * Math.sign(w || 1), cy)
      ctx.lineTo(cx, cy)
      ctx.lineTo(cx, cy - cs * Math.sign(h || 1))
      ctx.stroke()
    })
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return {
      x: Math.max(0, Math.min(src.clientX - rect.left, canvas.width)),
      y: Math.max(0, Math.min(src.clientY - rect.top, canvas.height)),
    }
  }

  const onStart = (e) => {
    e.preventDefault()
    syncCanvas()
    dragging.current = true
    const p = getPos(e)
    startPt.current = p
    setSel({ x: p.x, y: p.y, w: 0, h: 0 })
  }

  const onMove = (e) => {
    e.preventDefault()
    if (!dragging.current || !startPt.current) return
    const p = getPos(e)
    const newSel = {
      x: Math.min(startPt.current.x, p.x),
      y: Math.min(startPt.current.y, p.y),
      w: Math.abs(p.x - startPt.current.x),
      h: Math.abs(p.y - startPt.current.y),
    }
    setSel(newSel)
    draw(newSel)
  }

  const onEnd = (e) => {
    e.preventDefault()
    dragging.current = false
  }

  // Aplica el recorte y devuelve el File resultante
  const applyCrop = () => {
    if (!sel || sel.w < 10 || sel.h < 10) { onSkip(); return }
    const img = imgRef.current
    const canvas = canvasRef.current
    const scaleX = img.naturalWidth / canvas.width
    const scaleY = img.naturalHeight / canvas.height

    const out = document.createElement('canvas')
    out.width = Math.round(sel.w * scaleX)
    out.height = Math.round(sel.h * scaleY)
    out.getContext('2d').drawImage(
      img,
      Math.round(sel.x * scaleX), Math.round(sel.y * scaleY),
      out.width, out.height,
      0, 0, out.width, out.height
    )
    out.toBlob(blob => {
      const file = new File([blob], 'recorte.jpg', { type: 'image/jpeg' })
      onCrop(file)
    }, 'image/jpeg', 0.95)
  }

  return (
    <div>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
        Arrastra para seleccionar la zona con la ecuación
      </p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={S.cropWrap}>
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Recortar"
            style={S.cropImg}
            draggable={false}
            onLoad={() => { setImgLoaded(true); syncCanvas() }}
          />
          <canvas
            ref={canvasRef}
            style={S.cropCanvas}
            onMouseDown={onStart}
            onMouseMove={onMove}
            onMouseUp={onEnd}
            onTouchStart={onStart}
            onTouchMove={onMove}
            onTouchEnd={onEnd}
          />
        </div>
      </div>
      <p style={S.cropHint}>
        {sel && sel.w > 10 ? '✓ Zona seleccionada — confirma o redibuja' : 'Toca y arrastra sobre la ecuación'}
      </p>
      <div style={{ ...S.rowCenter, marginTop: '14px' }}>
        <button style={S.btn('secondary')} onClick={onSkip}>
          Usar imagen completa
        </button>
        <button
          style={S.btn('primary', !sel || sel.w < 10)}
          onClick={applyCrop}
          disabled={!sel || sel.w < 10}
        >
          ✂ Recortar y usar
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function App() {
  const [rawImage, setRawImage] = useState(null)   // URL original (para crop)
  const [image, setImage] = useState(null)          // { file, url } final
  const [cropping, setCropping] = useState(false)
  const [equation, setEquation] = useState('')
  const [solution, setSolution] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setRawImage(URL.createObjectURL(file))
    setCropping(true)
    setEquation('')
    setSolution('')
    setError('')
    setStatus('idle')
    setImage({ file, url: URL.createObjectURL(file) }) // fallback
  }, [])

  const onCropped = (croppedFile) => {
    setImage({ file: croppedFile, url: URL.createObjectURL(croppedFile) })
    setCropping(false)
  }

  const onSkipCrop = () => {
    setCropping(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    loadFile(e.dataTransfer.files[0])
  }

  const reset = () => {
    setRawImage(null)
    setImage(null)
    setCropping(false)
    setEquation('')
    setSolution('')
    setStatus('idle')
    setError('')
  }

  // ── PASO 1: Extraer ecuación ─────────────────────────────────────────────
  const extractEquation = async () => {
    if (!image) return
    setStatus('extracting')
    setError('')
    setEquation('')
    setSolution('')
    try {
      const form = new FormData()
      form.append('image', image.file)
      const res = await fetch(`${API}/api/extract`, { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Error ${res.status}`)
      const data = await res.json()
      setEquation(data.equation)
      setStatus('extracted')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  // ── PASO 2: Resolver paso a paso (streaming) ─────────────────────────────
  const solveEquation = async () => {
    if (!equation) return
    setStatus('solving')
    setError('')
    setSolution('')
    try {
      const res = await fetch(`${API}/api/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const ev = JSON.parse(raw)
            if (ev.type === 'text') setSolution(p => p + ev.content)
            else if (ev.type === 'done') setStatus('done')
            else if (ev.type === 'error') throw new Error(ev.message)
          } catch (_) {}
        }
      }
      setStatus(s => s !== 'done' ? 'done' : s)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const isExtracting = status === 'extracting'
  const isSolving = status === 'solving'
  const hasEquation = !!equation
  const showImage = image && !cropping

  return (
    <div style={S.app}>
      <header style={S.header}>
        <h1 style={S.title}>Solucionador de Ecuaciones Diferenciales</h1>
        <p style={S.subtitle}>Fotografía o carga una imagen → Recorta → Lee → Resuelve</p>
      </header>

      <main style={S.container}>

        {/* ── CARD 1: Captura ───────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span>📷</span> 1. Capturar ecuación
          </div>

          {/* Sin imagen: opciones de carga */}
          {!rawImage && (
            <div>
              {/* Botones principales */}
              <div style={{ ...S.rowCenter, marginBottom: '20px' }}>
                <button style={S.btn('camera')} onClick={() => cameraRef.current?.click()}>
                  <span style={{ fontSize: '1.1rem' }}>📷</span> Tomar foto
                </button>
                <button style={S.btn('secondary')} onClick={() => galleryRef.current?.click()}>
                  <span style={{ fontSize: '1.1rem' }}>🖼</span> Desde galería
                </button>
              </div>

              {/* Zona drag & drop (desktop) */}
              <div
                style={S.dropzone(isDragging)}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <p style={{ color: '#475569', fontSize: '0.82rem' }}>
                  O arrastra una imagen aquí (solo escritorio)
                </p>
              </div>

              {/* Inputs ocultos */}
              <input ref={galleryRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={e => loadFile(e.target.files[0])} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={e => loadFile(e.target.files[0])} />
            </div>
          )}

          {/* Herramienta de recorte */}
          {rawImage && cropping && (
            <CropTool
              imageUrl={rawImage}
              onCrop={onCropped}
              onSkip={onSkipCrop}
            />
          )}

          {/* Imagen final lista */}
          {showImage && (
            <div>
              <img src={image.url} alt="Ecuación" style={{
                maxWidth: '100%', maxHeight: '280px', objectFit: 'contain',
                borderRadius: '8px', margin: '0 auto', display: 'block',
              }} />
              <div style={{ ...S.rowCenter, marginTop: '14px' }}>
                <button style={S.btn('secondary')} onClick={reset}>
                  Nueva imagen
                </button>
                <button style={S.btn('secondary')} onClick={() => setCropping(true)}>
                  ✂ Recortar
                </button>
                <button
                  style={S.btn('primary', isExtracting || isSolving)}
                  onClick={extractEquation}
                  disabled={isExtracting || isSolving}
                >
                  {isExtracting
                    ? <><span style={S.spinner} /> Leyendo...</>
                    : 'Leer ecuación'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── CARD 2: Ecuación extraída ─────────────────────────────── */}
        {hasEquation && (
          <div style={S.card}>
            <div style={S.cardTitle}>
              <span>🔍</span> 2. Ecuación detectada
              <span style={S.badge('success')}>✓ Leída</span>
            </div>
            <div style={S.equationBox}>{equation}</div>
            <div style={{ ...S.row, marginTop: '14px' }}>
              <button
                style={S.btn('primary', isSolving)}
                onClick={solveEquation}
                disabled={isSolving}
              >
                {isSolving
                  ? <><span style={S.spinner} /> Resolviendo...</>
                  : 'Resolver paso a paso'}
              </button>
            </div>
          </div>
        )}

        {/* ── CARD 3: Solución ──────────────────────────────────────── */}
        {(solution || isSolving) && (
          <div style={S.card}>
            <div style={S.cardTitle}>
              <span>📐</span> 3. Resolución paso a paso
              {isSolving && <span style={S.badge('purple')}>Calculando...</span>}
              {status === 'done' && <span style={S.badge('success')}>✓ Completado</span>}
            </div>
            <div style={S.solutionBox}>
              {solution}
              {isSolving && <span style={{ animation: 'blink 1s step-end infinite' }}>▊</span>}
            </div>
          </div>
        )}

        {error && (
          <div style={S.errorBox}><strong>Error:</strong> {error}</div>
        )}

      </main>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
