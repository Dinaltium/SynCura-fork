import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../api'
import { useSimulation } from '../simulationContext'
import usePulseClock from '../motion/usePulseClock'
import syncuraLogo from '../assets/syncura-logo.png'
import ArchitecturePage from './ArchitecturePage'

function SynCuraWord({ className = '' }) {
  return (
    <span className={`syncura-word ${className}`.trim()}>
      <span className="syncura-syn">Syn</span>
      <span className="syncura-cura">Cura</span>
    </span>
  )
}

const evaluatedEvidence = [
  { term: 'Holdout AUC', value: '84.4%', note: '95 percent CI 0.836 to 0.852' },
  { term: 'Validation AUC', value: '84.0%', note: 'Original PhysioNet validation split' },
  { term: 'Model input', value: '12 by 90', note: 'Twelve features across 90 minutes' },
  { term: 'Evaluation cohort', value: '8,000', note: 'PhysioNet 2012 ICU stays' },
]

const prototypeFunctions = [
  {
    term: 'Workflow',
    title: 'Queue-first monitoring',
    body: 'Review simulated patient state, risk, vitals, trends, and alerts from a ranked operational surface.',
  },
  {
    term: 'Model',
    title: 'Three-model ensemble',
    body: 'Explore the documented attention-based LSTM workflow using 12 features and 90-minute windows.',
  },
  {
    term: 'Evidence',
    title: '84.4 percent holdout AUC',
    body: 'Research-prototype holdout result from unseen set-B windows, with the evaluation caveats retained.',
  },
  {
    term: 'Review',
    title: 'Explainability beside prediction',
    body: 'Inspect synthetic risk impact, hand-built SVG trends, and NEWS2 comparison without leaving the workflow.',
  },
]

const workingAreas = [
  { to: '/dashboard', title: 'Dashboard', body: 'Ranked synthetic patients, scenarios, alerts, threshold tuning, and model snapshot.' },
  { to: '/simulated-data', title: 'Simulated data', body: 'Tabular synthetic stream with scenario, status, vitals, and risk history.' },
  { to: '/waveforms', title: 'Waveforms', body: 'Synthetic vital-sign trends by patient and selectable sensor.' },
  { to: '/training', title: 'Training', body: 'Training-job configuration, progress monitoring, and historical metrics.' },
  { to: '/architecture', title: 'Architecture', body: 'Data flow, technology stack, evaluation results, and deployment notes.' },
]

function AnimatedMetric({ value, decimals = 1, suffix = '%' }) {
  const metricRef = useRef(null)

  useEffect(() => {
    const node = metricRef.current
    if (!node) return undefined
    const finalText = `${value.toFixed(decimals)}${suffix}`
    node.textContent = finalText
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    let start = 0
    const duration = 1100
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min(1, (timestamp - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      node.textContent = `${(value * eased).toFixed(decimals)}${suffix}`
      if (progress < 1) frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [value, decimals, suffix])

  return <strong ref={metricRef}>{`${value.toFixed(decimals)}${suffix}`}</strong>
}

function SystemStatus() {
  const [system, setSystem] = useState({ phase: 'checking' })
  const controllerRef = useRef(null)

  const loadStatus = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setSystem({ phase: 'checking' })
    const timeout = window.setTimeout(() => controller.abort(), 8000)

    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch(`${API_URL}/health`, { signal: controller.signal }),
        fetch(`${API_URL}/metrics`, { signal: controller.signal }),
      ])
      if (!healthResponse.ok) throw new Error(`Health check failed: ${healthResponse.status}`)
      if (!metricsResponse.ok) throw new Error(`Metrics check failed: ${metricsResponse.status}`)
      const health = await healthResponse.json()
      const metrics = await metricsResponse.json()
      const degraded = health.status !== 'ok' || Boolean(metrics.error)
      setSystem({ phase: degraded ? 'degraded' : 'live', health, metrics })
    } catch (error) {
      if (controller.signal.aborted) {
        setSystem({ phase: 'unavailable', detail: 'The status request timed out.' })
      } else {
        setSystem({ phase: 'unavailable', detail: error.message })
      }
    } finally {
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    return () => controllerRef.current?.abort()
  }, [loadStatus])

  const backendLabel = system.phase === 'checking' ? 'Checking' : system.phase === 'live' ? 'Live' : system.phase === 'degraded' ? 'Degraded' : 'Unavailable'
  const backendNote = system.health
    ? `${system.health.ensemble_members ?? 0} ensemble members${system.health.load_error ? `. ${system.health.load_error}` : ''}`
    : 'Default backend is localhost:8000.'
  const metricsValue = typeof system.metrics?.auc === 'number' ? system.metrics.auc.toFixed(3) : '...'
  const metricsNote = system.metrics?.error || 'Deployed-model metrics endpoint.'

  return (
    <section className="welcome-section welcome-system reveal" aria-labelledby="welcome-system-title">
      <div className="welcome-section-intro">
        <h2 id="welcome-system-title">Live system status</h2>
        <p>Check whether the research backend and deployed-model metrics are reachable before opening training workflows.</p>
        <button type="button" className="welcome-btn welcome-btn-secondary" onClick={loadStatus} disabled={system.phase === 'checking'}>
          Refresh status
        </button>
      </div>
      <div className="welcome-status-grid" role="status" aria-live="polite">
        <div>
          <p className="welcome-status-label">Backend</p>
          <p className="welcome-status-value">{backendLabel}</p>
          <p className="welcome-status-note">{backendNote}</p>
        </div>
        <div>
          <p className="welcome-status-label">Deployed AUC</p>
          <p className="welcome-status-value">{metricsValue}</p>
          <p className="welcome-status-note">{metricsNote}</p>
        </div>
        {system.phase === 'unavailable' && system.detail && (
          <p className="welcome-status-note">Status detail: {system.detail}</p>
        )}
      </div>
    </section>
  )
}

function buildPulsePath(points, width, height, padding = 10) {
  if (!points.length) return ''
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const scaleX = (width - padding * 2) / Math.max(1, points.length - 1)
  return points
    .map((value, index) => {
      const x = padding + index * scaleX
      const y = padding + (height - padding * 2) * (1 - (value - min) / range)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function PulseWave({ points, className }) {
  const d = useMemo(() => buildPulsePath(points, 320, 120), [points])
  if (!d) return null
  return (
    <svg className={className} viewBox="0 0 320 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} className="pulse-wave-path" />
    </svg>
  )
}

export default function WelcomePage({ theme, onToggleTheme }) {
  const pulseRef = usePulseClock(62)
  const { patientQueue } = useSimulation()
  const pulsePoints = patientQueue[0]?.waveform ?? []
  return (
    <div ref={pulseRef} className={`welcome-container theme-${theme}`}>
      <nav className="welcome-nav" aria-label="Welcome">
        <div className="welcome-nav-content">
          <Link to="/" className="welcome-logo">
            <img src={syncuraLogo} alt="SynCura logo" className="welcome-logo-icon" />
            <span className="welcome-brand-name"><SynCuraWord /></span>
          </Link>
          <div className="welcome-nav-links">
            <a href="#features" className="welcome-nav-link">Features</a>
            <a href="#tech" className="welcome-nav-link">Tech Stack</a>
            <a href="#about" className="welcome-nav-link">About</a>
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
      </nav>

      <main className="welcome-main motion-route-enter">
        <section className="welcome-hero" aria-labelledby="welcome-title">
          <PulseWave points={pulsePoints} className="pulse-wave pulse-wave-hero" />
          <span className="visually-hidden">Ambient pulse visualization follows synthetic simulation data.</span>
          <div className="welcome-hero-copy">
            <p className="welcome-eyebrow">Research prototype</p>
            <h1 id="welcome-title" className="welcome-headline">
              Predictive clinical <span className="headline-accent">intelligence.</span>
            </h1>
            <p className="welcome-subheadline">
              SynCura studies ICU signals and mortality risk in a transparent research prototype. It is not clinical software.
            </p>
            <div className="welcome-cta-group">
              <Link to="/dashboard" className="welcome-btn welcome-btn-primary">
                Open dashboard
              </Link>
              <a href="#architecture" className="welcome-btn welcome-btn-secondary">
                Read architecture
              </a>
            </div>
          </div>

          <aside className="welcome-evidence" aria-labelledby="welcome-evidence-title">
            <h2 id="welcome-evidence-title">Evaluated research result</h2>
            <div className="welcome-evidence-primary">
              <p>Holdout AUC</p>
              <AnimatedMetric value={84.4} decimals={1} suffix="%" />
              <span>95 percent CI 0.836 to 0.852</span>
            </div>
            <dl className="welcome-evidence-list">
              {evaluatedEvidence.slice(1).map((item) => (
                <div key={item.term} className="welcome-evidence-row">
                  <dt>{item.term}</dt>
                  <dd>
                    <strong>{item.value}</strong>
                    <span>{item.note}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="welcome-evidence-note">
              The holdout participated in ensemble selection. It is research evidence, not clinical validation.
            </p>
          </aside>
        </section>

        <SystemStatus />

        <section className="welcome-section welcome-functions reveal" id="features" aria-labelledby="welcome-functions-title">
          <PulseWave points={pulsePoints} className="pulse-wave pulse-wave-features" />
          <div className="welcome-section-intro">
            <h2 id="welcome-functions-title">What the prototype shows</h2>
            <p>
              SynCura presents a synthetic ICU patient queue, local risk simulation, vital trends, explainability signals,
              NEWS2 comparison, and model-training workflows in one browser-based research prototype.
            </p>
          </div>
          <dl className="welcome-function-list">
            {prototypeFunctions.map((item) => (
              <div key={item.term} className="welcome-function-row">
                <dt>{item.term}</dt>
                <dd>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="welcome-section welcome-architecture reveal" aria-label="System architecture">
          <ArchitecturePage embedded={true} />
        </section>

        <section className="welcome-section welcome-about reveal" id="about" aria-labelledby="welcome-about-title">
          <div className="welcome-section-intro">
            <h2 id="welcome-about-title">About the working prototype</h2>
            <p>
              The landing material explains the research system. The application routes contain the working demonstration,
              including synthetic monitoring and backend-connected training workflows.
            </p>
          </div>
          <div className="welcome-route-list">
            {workingAreas.map((area) => (
              <Link key={area.to} to={area.to} className="welcome-route">
                <h3>{area.title}</h3>
                <p>{area.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="welcome-final reveal" aria-labelledby="welcome-final-title">
          <div>
            <h2 id="welcome-final-title">Open the simulated data feed</h2>
            <p>Browse synthetic patients, scenarios, vitals, and recent risk values in tabular form.</p>
          </div>
          <Link to="/simulated-data" className="welcome-btn welcome-btn-primary">
            Open simulated data
          </Link>
        </section>
      </main>
    </div>
  )
}
