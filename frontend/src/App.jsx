import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const API = ''

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
  header: { textAlign: 'center', marginBottom: '28px' },
  title: {
    fontSize: 'clamp(1.4rem, 4vw, 2rem)',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #7c6af7, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: { color: '#64748b', fontSize: '0.9rem', letterSpacing: '0.03em', marginBottom: '24px' },
  tabs: {
    display: 'inline-flex',
    gap: '4px',
    background: '#1a1d2e',
    borderRadius: '12px',
    padding: '4px',
    border: '1px solid #2a2d45',
  },
  tab: (active) => ({
    padding: '10px 22px',
    borderRadius: '9px',
    border: 'none',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg, #7c6af7, #a78bfa)' : 'transparent',
    color: active ? '#fff' : '#64748b',
    boxShadow: active ? '0 2px 10px rgba(124,106,247,0.4)' : 'none',
  }),
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
    padding: '22px', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.9,
    minHeight: '120px', wordBreak: 'break-word', fontFamily: 'Inter, sans-serif',
  },
  textarea: {
    width: '100%', minHeight: '160px', background: '#111320',
    border: '1px solid #2a2d45', borderRadius: '10px', padding: '14px 16px',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88rem',
    color: '#e2e8f0', resize: 'vertical', outline: 'none',
    boxSizing: 'border-box', lineHeight: 1.7,
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

// ─── Renderizador LaTeX ──────────────────────────────────────────────────────

function parseMath(text) {
  const segments = []
  const re = /(\$\$[\s\S]+?\$\$|\$[^\n$]+?\$)/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ t: 'text', v: text.slice(last, m.index) })
    const isDisplay = m[0].startsWith('$$')
    segments.push({ t: isDisplay ? 'display' : 'inline', v: m[0].slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1) })
    last = m.index + m[0].length
  }
  if (last < text.length) segments.push({ t: 'text', v: text.slice(last) })
  return segments
}

function MathText({ text }) {
  const segments = useMemo(() => parseMath(text || ''), [text])
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.t === 'display') {
          try {
            const html = katex.renderToString(seg.v.trim(), { displayMode: true, throwOnError: false })
            return <div key={i} style={{ textAlign: 'center', margin: '10px 0', overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: html }} />
          } catch { return <div key={i}>$${seg.v}$$</div> }
        }
        if (seg.t === 'inline') {
          try {
            const html = katex.renderToString(seg.v, { displayMode: false, throwOnError: false })
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
          } catch { return <span key={i}>${seg.v}$</span> }
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{seg.v}</span>
      })}
    </>
  )
}

// ─── Herramienta de recorte ───────────────────────────────────────────────────

function CropTool({ imageUrl, onCrop, onSkip }) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const dragging = useRef(false)
  const startPt = useRef(null)
  const [sel, setSel] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)

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

  const draw = useCallback((currentSel) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!currentSel || currentSel.w === 0 || currentSel.h === 0) return
    const { x, y, w, h } = currentSel
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.clearRect(x, y, w, h)
    ctx.strokeStyle = '#7c6af7'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)
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
        Arrastra para seleccionar la zona con el problema
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
        {sel && sel.w > 10 ? '✓ Zona seleccionada — confirma o redibuja' : 'Toca y arrastra sobre el problema'}
      </p>
      <div style={{ ...S.rowCenter, marginTop: '14px' }}>
        <button style={S.btn('secondary')} onClick={onSkip}>Usar imagen completa</button>
        <button style={S.btn('primary', !sel || sel.w < 10)} onClick={applyCrop} disabled={!sel || sel.w < 10}>
          ✂ Recortar y usar
        </button>
      </div>
    </div>
  )
}

// ─── Solucionador de Programación Lineal ─────────────────────────────────────

function LPSolver() {
  const [inputMode, setInputMode] = useState('text')   // 'text' | 'image'
  const [problem, setProblem]     = useState('')
  const [solution, setSolution]   = useState('')
  const [status, setStatus]       = useState('idle')   // idle | extracting | solving | done | error
  const [error, setError]         = useState('')
  const [rawImage, setRawImage]   = useState(null)
  const [image, setImage]         = useState(null)
  const [cropping, setCropping]   = useState(false)

  const galleryRef = useRef(null)
  const cameraRef  = useRef(null)

  const isExtracting = status === 'extracting'
  const isSolving    = status === 'solving'

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setRawImage(URL.createObjectURL(file))
    setImage({ file, url: URL.createObjectURL(file) })
    setCropping(true)
    setError('')
  }, [])

  const onCropped = (croppedFile) => {
    setImage({ file: croppedFile, url: URL.createObjectURL(croppedFile) })
    setCropping(false)
  }

  const changeMode = (mode) => {
    setInputMode(mode)
    if (mode === 'text') {
      setRawImage(null); setImage(null); setCropping(false)
    }
  }

  const extractFromImage = async () => {
    if (!image?.file) return
    setStatus('extracting')
    setError('')
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const [header, data] = e.target.result.split(',')
          resolve({ data, mimeType: header.match(/:(.*?);/)[1] })
        }
        reader.onerror = reject
        reader.readAsDataURL(image.file)
      })
      const res = await fetch(`${API}/api/extractlp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data.data, mimeType: base64Data.mimeType }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Error ${res.status}`)
      const data = await res.json()
      setProblem(data.problem)
      setStatus('idle')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const solveProblem = async () => {
    if (!problem.trim()) return
    setStatus('solving')
    setError('')
    setSolution('')
    try {
      const res = await fetch(`${API}/api/solvelp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
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

  const reset = () => {
    setProblem(''); setSolution(''); setStatus('idle'); setError('')
    setRawImage(null); setImage(null); setCropping(false)
  }

  const showImage = image && !cropping

  return (
    <div style={S.container}>

      {/* Card 1: Input del problema */}
      <div style={S.card}>
        <div style={S.cardTitle}><span>📊</span> 1. Ingresar problema</div>

        {/* Selector de modo */}
        <div style={{ ...S.row, marginBottom: '18px' }}>
          <button
            style={{ ...S.btn(inputMode === 'text' ? 'primary' : 'secondary'), padding: '9px 18px', fontSize: '0.83rem' }}
            onClick={() => changeMode('text')}
          >✏️ Escribir problema</button>
          <button
            style={{ ...S.btn(inputMode === 'image' ? 'camera' : 'secondary'), padding: '9px 18px', fontSize: '0.83rem' }}
            onClick={() => changeMode('image')}
          >📷 Desde imagen</button>
        </div>

        {/* Modo texto */}
        {inputMode === 'text' && (
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            style={S.textarea}
            placeholder={`Ejemplo:\nMaximizar Z = 5x1 + 4x2\nSujeto a:\n  6x1 + 4x2 ≤ 24\n  x1 + 2x2 ≤ 6\n  x1, x2 ≥ 0`}
          />
        )}

        {/* Modo imagen: selección */}
        {inputMode === 'image' && !rawImage && (
          <div>
            <div style={{ ...S.rowCenter, marginBottom: '16px' }}>
              <button style={S.btn('camera')} onClick={() => cameraRef.current?.click()}>
                <span>📷</span> Tomar foto
              </button>
              <button style={S.btn('secondary')} onClick={() => galleryRef.current?.click()}>
                <span>🖼</span> Desde galería
              </button>
            </div>
            <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => loadFile(e.target.files[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
              onChange={e => loadFile(e.target.files[0])} />
          </div>
        )}

        {/* Modo imagen: recorte */}
        {rawImage && cropping && (
          <CropTool imageUrl={rawImage} onCrop={onCropped} onSkip={() => setCropping(false)} />
        )}

        {/* Modo imagen: preview + extraer */}
        {inputMode === 'image' && showImage && (
          <div>
            <img src={image.url} alt="Problema" style={{
              maxWidth: '100%', maxHeight: '280px', objectFit: 'contain',
              borderRadius: '8px', margin: '0 auto', display: 'block',
            }} />
            <div style={{ ...S.rowCenter, marginTop: '14px' }}>
              <button style={S.btn('secondary')} onClick={() => { setRawImage(null); setImage(null) }}>
                Nueva imagen
              </button>
              <button style={S.btn('secondary')} onClick={() => setCropping(true)}>✂ Recortar</button>
              <button style={S.btn('primary', isExtracting)} onClick={extractFromImage} disabled={isExtracting}>
                {isExtracting ? <><span style={S.spinner} /> Extrayendo...</> : 'Extraer problema'}
              </button>
            </div>
          </div>
        )}

        {/* Problema extraído de imagen (editable) */}
        {inputMode === 'image' && problem && !cropping && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '8px' }}>
              Problema extraído — puedes editarlo antes de resolver:
            </p>
            <textarea
              value={problem}
              onChange={e => setProblem(e.target.value)}
              style={{ ...S.textarea, minHeight: '120px' }}
            />
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ ...S.row, marginTop: '16px' }}>
          {problem.trim() && (
            <button style={S.btn('primary', isSolving)} onClick={solveProblem} disabled={isSolving}>
              {isSolving ? <><span style={S.spinner} /> Resolviendo...</> : 'Resolver paso a paso'}
            </button>
          )}
          {(problem || solution) && (
            <button style={S.btn('secondary')} onClick={reset}>Nuevo problema</button>
          )}
        </div>
      </div>

      {/* Card 2: Solución */}
      {(solution || isSolving) && (
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span>📐</span> 2. Resolución paso a paso
            {isSolving && <span style={S.badge('purple')}>Calculando...</span>}
            {status === 'done' && <span style={S.badge('success')}>✓ Completado</span>}
          </div>
          <div style={S.solutionBox}>
            <MathText text={solution} />
            {isSolving && <span style={{ animation: 'blink 1s step-end infinite' }}>▊</span>}
          </div>
        </div>
      )}

      {error && <div style={S.errorBox}><strong>Error:</strong> {error}</div>}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('diffeq')

  // Estado para ecuaciones diferenciales
  const [rawImage, setRawImage]       = useState(null)
  const [image, setImage]             = useState(null)
  const [cropping, setCropping]       = useState(false)
  const [equation, setEquation]       = useState('')
  const [solution, setSolution]       = useState('')
  const [verification, setVerification] = useState(null)
  const [status, setStatus]           = useState('idle')
  const [isThinking, setIsThinking]   = useState(false)
  const [error, setError]             = useState('')
  const [isDragging, setIsDragging]   = useState(false)

  const galleryRef = useRef(null)
  const cameraRef  = useRef(null)

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setRawImage(URL.createObjectURL(file))
    setCropping(true)
    setEquation(''); setSolution(''); setError(''); setStatus('idle')
    setImage({ file, url: URL.createObjectURL(file) })
  }, [])

  const onCropped    = (f) => { setImage({ file: f, url: URL.createObjectURL(f) }); setCropping(false) }
  const onSkipCrop   = () => setCropping(false)
  const onDrop       = (e) => { e.preventDefault(); setIsDragging(false); loadFile(e.dataTransfer.files[0]) }

  const verifyWithSympy = async (eq) => {
    setVerification({ status: 'loading' })
    try {
      const res = await fetch(`${API}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation: eq }),
      })
      setVerification(await res.json())
    } catch {
      setVerification({ status: 'error', message: 'No se pudo conectar con el verificador.' })
    }
  }

  const reset = () => {
    setRawImage(null); setImage(null); setCropping(false)
    setEquation(''); setSolution(''); setVerification(null)
    setStatus('idle'); setIsThinking(false); setError('')
  }

  const extractEquation = async () => {
    if (!image) return
    setStatus('extracting'); setError(''); setEquation(''); setSolution('')
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const [header, data] = e.target.result.split(',')
          resolve({ data, mimeType: header.match(/:(.*?);/)[1] })
        }
        reader.onerror = reject
        reader.readAsDataURL(image.file)
      })
      const res = await fetch(`${API}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data.data, mimeType: base64Data.mimeType }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Error ${res.status}`)
      const data = await res.json()
      setEquation(data.equation)
      setStatus('extracted')
    } catch (err) {
      setError(err.message); setStatus('error')
    }
  }

  const solveEquation = async () => {
    if (!equation) return
    setStatus('solving'); setError(''); setSolution(''); setIsThinking(false)
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
            if (ev.type === 'thinking') setIsThinking(true)
            else if (ev.type === 'text') { setIsThinking(false); setSolution(p => p + ev.content) }
            else if (ev.type === 'done') { setStatus('done'); verifyWithSympy(equation) }
            else if (ev.type === 'error') throw new Error(ev.message)
          } catch (_) {}
        }
      }
      setStatus(s => { if (s !== 'done') { verifyWithSympy(equation); return 'done' } return s })
    } catch (err) {
      setError(err.message); setStatus('error')
    }
  }

  const isExtracting = status === 'extracting'
  const isSolving    = status === 'solving'
  const hasEquation  = !!equation
  const showImage    = image && !cropping

  return (
    <div style={S.app}>
      <header style={S.header}>
        <h1 style={S.title}>Solucionador Matemático</h1>
        <p style={S.subtitle}>Fotografía o escribe un problema → Resuelve paso a paso</p>
        <div style={S.tabs}>
          <button style={S.tab(activeTab === 'diffeq')} onClick={() => setActiveTab('diffeq')}>
            📐 Ecuaciones Diferenciales
          </button>
          <button style={S.tab(activeTab === 'lp')} onClick={() => setActiveTab('lp')}>
            📊 Programación Lineal
          </button>
        </div>
      </header>

      {/* ════ PESTAÑA: ECUACIONES DIFERENCIALES ════ */}
      {activeTab === 'diffeq' && (
        <main style={S.container}>

          {/* Card 1: Captura */}
          <div style={S.card}>
            <div style={S.cardTitle}><span>📷</span> 1. Capturar ecuación</div>

            {!rawImage && (
              <div>
                <div style={{ ...S.rowCenter, marginBottom: '20px' }}>
                  <button style={S.btn('camera')} onClick={() => cameraRef.current?.click()}>
                    <span style={{ fontSize: '1.1rem' }}>📷</span> Tomar foto
                  </button>
                  <button style={S.btn('secondary')} onClick={() => galleryRef.current?.click()}>
                    <span style={{ fontSize: '1.1rem' }}>🖼</span> Desde galería
                  </button>
                </div>
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
                <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => loadFile(e.target.files[0])} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                  onChange={e => loadFile(e.target.files[0])} />
              </div>
            )}

            {rawImage && cropping && (
              <CropTool imageUrl={rawImage} onCrop={onCropped} onSkip={onSkipCrop} />
            )}

            {showImage && (
              <div>
                <img src={image.url} alt="Ecuación" style={{
                  maxWidth: '100%', maxHeight: '280px', objectFit: 'contain',
                  borderRadius: '8px', margin: '0 auto', display: 'block',
                }} />
                <div style={{ ...S.rowCenter, marginTop: '14px' }}>
                  <button style={S.btn('secondary')} onClick={reset}>Nueva imagen</button>
                  <button style={S.btn('secondary')} onClick={() => setCropping(true)}>✂ Recortar</button>
                  <button style={S.btn('primary', isExtracting || isSolving)} onClick={extractEquation}
                    disabled={isExtracting || isSolving}>
                    {isExtracting ? <><span style={S.spinner} /> Leyendo...</> : 'Leer ecuación'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Ecuación detectada */}
          {hasEquation && (
            <div style={S.card}>
              <div style={S.cardTitle}>
                <span>🔍</span> 2. Ecuación detectada
                <span style={S.badge('success')}>✓ Leída</span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '8px' }}>
                Revisa y corrige si la lectura no fue exacta:
              </p>
              <textarea
                value={equation}
                onChange={e => { setEquation(e.target.value); setSolution(''); setVerification(null) }}
                style={{ ...S.textarea, minHeight: '80px' }}
              />
              {equation && (
                <div style={{ ...S.equationBox, marginTop: '10px', fontSize: '0.95rem' }}>
                  <MathText text={equation} />
                </div>
              )}
              <div style={{ ...S.row, marginTop: '14px' }}>
                <button style={S.btn('primary', isSolving)} onClick={solveEquation} disabled={isSolving}>
                  {isSolving ? <><span style={S.spinner} /> Resolviendo...</> : 'Resolver paso a paso'}
                </button>
              </div>
            </div>
          )}

          {/* Card 3: Solución */}
          {(solution || isSolving) && (
            <div style={S.card}>
              <div style={S.cardTitle}>
                <span>📐</span> 3. Resolución paso a paso
                {isThinking && <span style={S.badge('purple')}>🧠 Analizando el problema...</span>}
                {isSolving && !isThinking && <span style={S.badge('purple')}>Calculando...</span>}
                {status === 'done' && <span style={S.badge('success')}>✓ Completado</span>}
              </div>
              {isThinking && (
                <div style={{ ...S.row, color: '#64748b', fontSize: '0.85rem', marginBottom: '12px' }}>
                  <span style={S.spinner} /> El modelo está razonando internamente antes de escribir la solución...
                </div>
              )}
              <div style={S.solutionBox}>
                <MathText text={solution} />
                {isSolving && <span style={{ animation: 'blink 1s step-end infinite' }}>▊</span>}
              </div>
            </div>
          )}

          {/* Card 4: Verificación */}
          {verification && (
            <div style={{ ...S.card, borderColor: verification.status === 'ok' ? 'rgba(52,211,153,0.3)' : verification.status === 'loading' ? '#2a2d45' : 'rgba(251,191,36,0.3)' }}>
              <div style={S.cardTitle}>
                <span>🔬</span> 4. Verificación simbólica
                {verification.status === 'loading' && <span style={S.badge('purple')}>Verificando...</span>}
                {verification.status === 'ok'      && <span style={S.badge('success')}>✓ Verificado</span>}
                {verification.status === 'error'   && <span style={{ ...S.badge('purple'), color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.1)' }}>⚠ No verificable</span>}
              </div>

              {verification.status === 'loading' && (
                <div style={{ ...S.row, color: '#64748b', fontSize: '0.85rem' }}>
                  <span style={S.spinner} /> Calculando solución exacta independiente...
                </div>
              )}

              {verification.status === 'ok' && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '10px' }}>
                    Solución calculada de forma independiente:
                  </p>
                  <div style={{ ...S.equationBox, borderColor: 'rgba(52,211,153,0.25)', fontSize: '1rem', textAlign: 'center' }}>
                    <MathText text={verification.sympy_solution} />
                  </div>
                </div>
              )}

              {verification.status === 'error' && (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  No se pudo verificar automáticamente — confía en la solución principal.
                  {verification.message && <span style={{ color: '#64748b' }}> ({verification.message})</span>}
                </p>
              )}
            </div>
          )}

          {error && <div style={S.errorBox}><strong>Error:</strong> {error}</div>}
        </main>
      )}

      {/* ════ PESTAÑA: PROGRAMACIÓN LINEAL ════ */}
      {activeTab === 'lp' && <LPSolver />}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        textarea:focus { border-color: #7c6af7 !important; }
      `}</style>
    </div>
  )
}
