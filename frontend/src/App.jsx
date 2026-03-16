import { useState, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || ''  // '' usa proxy local en dev

// ─── Estilos ────────────────────────────────────────────────────────────────

const S = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #0f1117 0%, #141824 100%)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #7c6af7, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    letterSpacing: '0.03em',
  },
  container: {
    width: '100%',
    maxWidth: '860px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    background: '#1a1d2e',
    border: '1px solid #2a2d45',
    borderRadius: '16px',
    padding: '28px',
  },
  cardTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#7c6af7',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dropzone: (isDragging, hasImage) => ({
    border: `2px dashed ${isDragging ? '#7c6af7' : hasImage ? '#3d4266' : '#2a2d45'}`,
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: isDragging ? 'rgba(124,106,247,0.05)' : 'transparent',
  }),
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: '8px',
    margin: '0 auto',
    display: 'block',
  },
  btn: (variant = 'primary', disabled = false) => ({
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
    background: variant === 'primary'
      ? 'linear-gradient(135deg, #7c6af7, #a78bfa)'
      : '#2a2d45',
    color: '#fff',
    boxShadow: variant === 'primary' && !disabled
      ? '0 4px 20px rgba(124,106,247,0.35)'
      : 'none',
  }),
  equationBox: {
    background: '#111320',
    border: '1px solid #2a2d45',
    borderRadius: '10px',
    padding: '20px 24px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '1.05rem',
    color: '#e2e8f0',
    lineHeight: 1.7,
    wordBreak: 'break-word',
  },
  solutionBox: {
    background: '#111320',
    border: '1px solid #2a2d45',
    borderRadius: '10px',
    padding: '24px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.88rem',
    color: '#cbd5e1',
    lineHeight: 1.85,
    whiteSpace: 'pre-wrap',
    minHeight: '120px',
    wordBreak: 'break-word',
  },
  badge: (type) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 500,
    background: type === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(124,106,247,0.15)',
    color: type === 'success' ? '#34d399' : '#a78bfa',
    border: `1px solid ${type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(124,106,247,0.3)'}`,
  }),
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    padding: '14px 18px',
    color: '#fca5a5',
    fontSize: '0.875rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTop: '2px solid #7c6af7',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },
}

// ─── Spinner CSS global ──────────────────────────────────────────────────────
const spinnerStyle = document.createElement('style')
spinnerStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
document.head.appendChild(spinnerStyle)

// ─── Componente principal ────────────────────────────────────────────────────

export default function App() {
  const [image, setImage] = useState(null)         // { file, url }
  const [equation, setEquation] = useState('')
  const [solution, setSolution] = useState('')
  const [status, setStatus] = useState('idle')     // idle | extracting | solving | done | error
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImage({ file, url: URL.createObjectURL(file) })
    setEquation('')
    setSolution('')
    setError('')
    setStatus('idle')
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const onFileInput = (e) => handleFile(e.target.files[0])

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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }
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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Error ${res.status}`)
      }

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
            const event = JSON.parse(raw)
            if (event.type === 'text') {
              setSolution(prev => prev + event.content)
            } else if (event.type === 'done') {
              setStatus('done')
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (parseErr) {
            // ignorar líneas malformadas
          }
        }
      }

      if (status !== 'done') setStatus('done')

    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const reset = () => {
    setImage(null)
    setEquation('')
    setSolution('')
    setStatus('idle')
    setError('')
  }

  const isExtracting = status === 'extracting'
  const isSolving = status === 'solving'
  const hasEquation = !!equation

  return (
    <div style={S.app}>
      {/* Header */}
      <header style={S.header}>
        <h1 style={S.title}>Solucionador de Ecuaciones Diferenciales</h1>
        <p style={S.subtitle}>Carga una imagen → Lee la ecuación → Resolución paso a paso</p>
      </header>

      <main style={S.container}>

        {/* ── CARD 1: Imagen ────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            <span>📷</span> 1. Cargar imagen
          </div>

          {!image ? (
            <div
              style={S.dropzone(isDragging, false)}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <p style={{ color: '#64748b', marginBottom: '8px', fontSize: '2rem' }}>⬆</p>
              <p style={{ color: '#94a3b8', marginBottom: '4px' }}>
                Arrastra una imagen aquí o haz clic para seleccionar
              </p>
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>JPG, PNG, WebP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileInput}
              />
            </div>
          ) : (
            <div>
              <img src={image.url} alt="Ecuación" style={S.imagePreview} />
              <div style={{ ...S.row, marginTop: '16px', justifyContent: 'center' }}>
                <button style={S.btn('secondary')} onClick={reset}>
                  Cambiar imagen
                </button>
                <button
                  style={S.btn('primary', isExtracting || isSolving)}
                  onClick={extractEquation}
                  disabled={isExtracting || isSolving}
                >
                  {isExtracting
                    ? <span style={S.row}><span style={S.spinner}/> Leyendo...</span>
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
              <span style={S.badge('success')}>✓ Leída correctamente</span>
            </div>
            <div style={S.equationBox}>{equation}</div>
            <div style={{ ...S.row, marginTop: '16px' }}>
              <button
                style={S.btn('primary', isSolving)}
                onClick={solveEquation}
                disabled={isSolving}
              >
                {isSolving
                  ? <span style={S.row}><span style={S.spinner}/> Resolviendo...</span>
                  : 'Resolver paso a paso'}
              </button>
            </div>
          </div>
        )}

        {/* ── CARD 3: Solución streaming ─────────────────────────────── */}
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

        {/* ── Error ─────────────────────────────────────────────────── */}
        {error && (
          <div style={S.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}

      </main>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
