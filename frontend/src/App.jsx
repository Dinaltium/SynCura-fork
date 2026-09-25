import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import { BASE_PATIENTS, SimulationProvider, useSimulation } from './simulationContext'
import { API_URL } from './api'
import syncuraLogo from './assets/syncura-logo.png'
import './welcome.css'

const TrainingConfig = lazy(() => import('./components/TrainingConfig'))
const TrainingMonitor = lazy(() => import('./components/TrainingMonitor'))
const TrainingJobsList = lazy(() => import('./components/TrainingJobsList'))
const SimulatedDataFeed = lazy(() => import('./components/SimulatedDataFeed'))
const WelcomePage = lazy(() => import('./components/WelcomePage'))
const ArchitecturePage = lazy(() => import('./components/ArchitecturePage'))
const SensorWaveform = lazy(() => import('./components/SensorWaveform'))

const defaultModelStats = [
  { label: 'AUC-ROC', value: '...', tone: 'good' },
  { label: 'Accuracy', value: '...', tone: 'good' },
  { label: 'Precision', value: '...', tone: 'good' },
  { label: 'Recall', value: '...', tone: 'warn' },
]

const statusIcons = {
  stable: '●',
  watch: '▲',
  high: '▲!',
  critical: '◆!',
}

function riskTone(value) {
  if (value >= 85) return 'critical'
  if (value >= 70) return 'high'
  if (value >= 45) return 'watch'
  return 'stable'
}

function SynCuraWord({ className = '' }) {
  return (
    <span className={`syncura-word ${className}`.trim()}>
      <span className="syncura-syn">Syn</span>
      <span className="syncura-cura">Cura</span>
    </span>
  )
}

function Shell({ children, theme, onToggleTheme, statusNote = 'HTTP ingest ready' }) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="SynCura clinical intelligence">
          <img src={syncuraLogo} alt="SynCura logo" className="brand-logo" />
          <span>
            <strong><SynCuraWord /></strong>
            <small>Clinical Intelligence</small>
          </span>
        </Link>

        <nav className="nav-stack" aria-label="Primary navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/simulated-data" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Simulated Data
          </NavLink>
          <NavLink to="/waveforms" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Waveforms
          </NavLink>
          <NavLink to="/training" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Training
          </NavLink>
          <NavLink to="/architecture" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Architecture
          </NavLink>
        </nav>

        <button type="button" className="theme-toggle-sidebar" onClick={onToggleTheme} aria-pressed={theme === 'dark'}>
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        <div className="sidebar-status">
          <div>
            <strong>Stream state</strong>
            <small>{statusNote}</small>
          </div>
        </div>
      </aside>
      <main className="main-surface motion-route-enter" id="main-content" tabIndex="-1">{children}</main>
    </div>
  )
}

function Sparkline({ points, patientId, bed }) {
  const width = 148
  const height = 44
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const flat = max === min
  const scaleX = width / (points.length - 1)
  const scaleY = (value) => flat ? height / 2 : height - ((value - min) / range) * height
  const d = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * scaleX} ${scaleY(point)}`).join(' ')
  const label = patientId ? `Risk trend for patient ${patientId}${bed ? ` in ${bed}` : ''}` : 'Risk trend'

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={d} />
    </svg>
  )
}

function ExplainabilityWaveform({ points }) {
  const width = 280
  const height = 86
  const min = Math.min(...points)
  const max = Math.max(...points)
  const scaleX = width / Math.max(1, points.length - 1)
  const scaleY = (value) => height - ((value - min) / (max - min || 1)) * height
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * scaleX} ${scaleY(point)}`).join(' ')

  const explainBand = (value) => {
    if (value >= 80) return { label: 'SpO2 drop pattern', tone: 'spo2' }
    if (value >= 65) return { label: 'Respiratory strain', tone: 'resp' }
    if (value >= 45) return { label: 'Cardiac stress', tone: 'hr' }
    return { label: 'Thermal and inflammatory drift', tone: 'temp' }
  }

  return (
    <div className="explainability-waveform">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Synthetic contribution preview waveform by vital band">
        <path d={path} className="wave-line" />
        {points.map((point, index) => {
          const x = index * scaleX
          const y = scaleY(point)
          const band = explainBand(point)
          return (
            <g key={`${point}-${index}`}>
              <title>{`${band.label}: ${Math.round(point)}`}</title>
              <circle cx={x} cy={y} r="4" className={`wave-dot ${band.tone}`} />
            </g>
          )
        })}
      </svg>
      <ul className="wave-legend" aria-label="Vital band key">
        <li className="pill spo2">SpO2-related</li>
        <li className="pill resp">Resp-related</li>
        <li className="pill hr">HR-related</li>
        <li className="pill temp">Temp-related</li>
      </ul>
    </div>
  )
}

function RiskDial({ value, patientId }) {
  const normalized = Math.min(100, Math.max(0, value))
  const tone = riskTone(normalized)
  const label = patientId
    ? `Deterioration risk ${value} percent for patient ${patientId}`
    : `Deterioration risk ${value} percent`
  return (
    <div className={`risk-dial tone-${tone}`} role="img" aria-label={label} style={{ '--risk': `${normalized * 3.6}deg` }}>
      <span aria-hidden="true">{value}</span>
    </div>
  )
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function scoreContributions(vitals) {
  const contributions = [
    { name: 'Heart Rate', value: (vitals.HR - 85) * 0.24 },
    { name: 'SpO2 Saturation', value: (92 - vitals.SpO2) * 1.7 },
    { name: 'Respiratory Rate', value: (vitals.Resp - 18) * 0.6 },
    { name: 'Temperature', value: (vitals.Temp - 37) * 4.5 },
  ]
  const total = contributions.reduce((sum, metric) => sum + metric.value, 0)
  return {
    total,
    metrics: contributions.map((metric) => ({
      ...metric,
      points: Number((metric.value * 0.05).toFixed(2)),
    })),
  }
}

function buildAlerts(patients) {
  const alerts = []
  patients.forEach((patient) => {
    if (patient.risk >= 90) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'critical',
        icon: statusIcons.critical,
        text: `Patient ${patient.patient_id} at ${patient.risk}% risk. Immediate bedside review needed.`
      })
      return
    }
    if (patient.vitals.SpO2 <= 88) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'warning',
        icon: statusIcons.watch,
        text: `Patient ${patient.patient_id} has low SpO2 (${patient.vitals.SpO2}%).`
      })
    }
    if (patient.vitals.Resp >= 30) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'warning',
        icon: statusIcons.watch,
        text: `Patient ${patient.patient_id} respiratory rate elevated (${patient.vitals.Resp}/min).`
      })
    }
    if (patient.vitals.Temp >= 39) {
      alerts.push({
        patientId: patient.patient_id,
        level: 'info',
        icon: statusIcons.watch,
        text: `Patient ${patient.patient_id} temperature trend suggests infection (${patient.vitals.Temp} C).`
      })
    }
  })
  return alerts.slice(0, 5)
}

function calculateNews2(patient) {
  let score = 0
  const { HR, Resp, Temp, SpO2 } = patient.vitals
  if (Resp <= 8 || Resp >= 25) score += 3
  else if (Resp >= 21) score += 2
  else if (Resp >= 9 && Resp <= 11) score += 1

  if (SpO2 <= 91) score += 3
  else if (SpO2 <= 93) score += 2
  else if (SpO2 <= 95) score += 1

  if (Temp <= 35) score += 3
  else if (Temp >= 39.1) score += 2
  else if (Temp >= 38.1) score += 1

  if (HR <= 40 || HR >= 131) score += 3
  else if (HR >= 111) score += 2
  else if (HR >= 91 || HR <= 50) score += 1
  return score
}

function hasDeteriorationEvent(patient) {
  return patient.vitals.SpO2 <= 90 || patient.vitals.Resp >= 30 || patient.vitals.Temp >= 39.2 || patient.risk >= 88
}

function classificationStats(rows) {
  const totals = rows.reduce(
    (acc, row) => {
      if (row.predicted && row.actual) acc.tp += 1
      else if (row.predicted && !row.actual) acc.fp += 1
      else if (!row.predicted && row.actual) acc.fn += 1
      else acc.tn += 1
      return acc
    },
    { tp: 0, fp: 0, tn: 0, fn: 0 }
  )

  const sensitivity = totals.tp + totals.fn ? totals.tp / (totals.tp + totals.fn) : 0
  const specificity = totals.tn + totals.fp ? totals.tn / (totals.tn + totals.fp) : 0
  const precision = totals.tp + totals.fp ? totals.tp / (totals.tp + totals.fp) : 0

  return {
    ...totals,
    sensitivity: Number((sensitivity * 100).toFixed(1)),
    specificity: Number((specificity * 100).toFixed(1)),
    precision: Number((precision * 100).toFixed(1)),
  }
}

function Dashboard({ theme, onToggleTheme }) {
  const {
    activeScenario,
    activeScenarioLabel,
    scenarioEntries,
    patientQueue,
    lastUpdated,
    isPaused,
    setActiveScenario,
    toggleSimulation,
    resetSimulation,
  } = useSimulation()
  const [selectedPatientId, setSelectedPatientId] = useState(BASE_PATIENTS[0].patient_id)
  const [alertThreshold, setAlertThreshold] = useState(75)
  const [liveModelStats, setLiveModelStats] = useState(defaultModelStats)
  const [metricsError, setMetricsError] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/metrics`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setLiveModelStats([
            { label: 'AUC-ROC', value: data.auc != null ? data.auc.toFixed(3) : '...', tone: 'good' },
            { label: 'Accuracy', value: data.accuracy != null ? (data.accuracy * 100).toFixed(1) + '%' : '...', tone: 'good' },
            { label: 'Precision', value: data.precision != null ? (data.precision * 100).toFixed(1) + '%' : '...', tone: 'good' },
            { label: 'Recall', value: data.recall != null ? (data.recall * 100).toFixed(1) + '%' : '...', tone: data.recall < 0.7 ? 'warn' : 'good' },
          ])
        }
      })
      .catch(() => { setMetricsError(true) })
  }, [])

  const sortedQueue = useMemo(
    () => [...patientQueue].sort((a, b) => b.risk - a.risk),
    [patientQueue]
  )
  const criticalCount = patientQueue.filter((patient) => patient.risk >= 75).length
  const alertItems = useMemo(() => buildAlerts(patientQueue), [patientQueue])
  const selectedPatient = patientQueue.find((patient) => patient.patient_id === selectedPatientId) || patientQueue[0]
  const impactMetrics = selectedPatient ? scoreContributions(selectedPatient.vitals).metrics : []
  const currentNews2 = selectedPatient ? calculateNews2(selectedPatient) : 0

  const modelRows = useMemo(
    () =>
      patientQueue.map((patient) => ({
        actual: hasDeteriorationEvent(patient),
        predicted: patient.risk >= alertThreshold,
      })),
    [patientQueue, alertThreshold]
  )
  const news2Rows = useMemo(
    () =>
      patientQueue.map((patient) => ({
        actual: hasDeteriorationEvent(patient),
        predicted: calculateNews2(patient) >= 7,
      })),
    [patientQueue]
  )

  const modelPerf = useMemo(() => classificationStats(modelRows), [modelRows])
  const news2Perf = useMemo(() => classificationStats(news2Rows), [news2Rows])
  const averageLeadTime = useMemo(() => {
    const lead = patientQueue.map((patient) => clamp((100 - patient.risk) / 12, 0.5, 6))
    return (lead.reduce((sum, val) => sum + val, 0) / lead.length).toFixed(1)
  }, [patientQueue])

  useEffect(() => {
    if (!patientQueue.some((patient) => patient.patient_id === selectedPatientId)) {
      setSelectedPatientId(patientQueue[0]?.patient_id)
    }
  }, [patientQueue, selectedPatientId])

  return (
    <Shell theme={theme} onToggleTheme={onToggleTheme} statusNote={isPaused ? 'Paused. Resume to stream.' : 'HTTP ingest ready'}>
      <section className="page-header">
        <div>
          <p className="eyebrow">Real-time patient intelligence</p>
          <h1><SynCuraWord /> Dashboard</h1>
        </div>
        <div className="header-actions">
          <Link to="/training/new" className="button secondary">New model run</Link>
          <Link to="/training" className="button primary">View training</Link>
        </div>
      </section>

      <section className="summary-grid" aria-label="Operational summary">
        <article className="summary-tile danger">
          <span className="tile-label">High acuity</span>
          <strong>{criticalCount}</strong>
          <small>patients need review</small>
        </article>
        <article className="summary-tile">
          <span className="tile-label">Patients tracked</span>
          <strong>{patientQueue.length}</strong>
          <small>across ICU beds (simulated)</small>
        </article>
        <article className="summary-tile">
          <span className="tile-label">Average lead time</span>
          <strong>{averageLeadTime}h</strong>
          <small>simulated, before deterioration</small>
        </article>
        <article className="summary-tile">
          <span className="tile-label">False alarms now</span>
          <strong>{modelPerf.fp}</strong>
          <small>at threshold {'>='} {alertThreshold} (simulated)</small>
        </article>
      </section>

      <div className="simulation-banner" role="note" aria-label="Simulation disclaimer">
        <strong>Simulation mode. Synthetic data.</strong>
        <span> Patient vitals, risk scores, explanations, NEWS2 comparison, and lead times on this
        dashboard are generated locally for demonstration, not live outputs of the trained model.
        Model metrics (AUC 0.844 holdout) come from the offline PhysioNet evaluation.</span>
      </div>

      <section className="scenario-panel" aria-label="Scenario simulation controls">
        <div>
          <h2 className="scenario-heading">Simulation scenarios</h2>
          <p>
            Now running: {activeScenarioLabel}
            {isPaused ? ' (paused)' : ' (live)'}
          </p>
        </div>
        <div className="scenario-controls">
          <div className="scenario-buttons">
            {scenarioEntries.map(([scenarioKey, scenario]) => (
              <button
                key={scenarioKey}
                type="button"
                className={`scenario-button ${activeScenario === scenarioKey ? 'active' : ''}`}
                onClick={() => setActiveScenario(scenarioKey)}
              >
                {scenario.label}
              </button>
            ))}
          </div>
          <div className="simulation-actions">
            <button
              type="button"
              className="scenario-button action"
              onClick={toggleSimulation}
            >
              {isPaused ? 'Start Simulation' : 'Pause Simulation'}
            </button>
            <button
              type="button"
              className="scenario-button action"
              onClick={resetSimulation}
            >
              Reset to Baseline
            </button>
          </div>
        </div>
      </section>

      <section className="alerts-panel" aria-label="Active alerts" aria-live="polite">
        <div className="panel-heading compact">
          <h2 className="heading-with-icon">Active alerts</h2>
          <span className="model-badge">{alertItems.length} active</span>
        </div>
        {alertItems.length === 0 ? (
          <p className="alerts-empty">No threshold breaches. Monitoring continues.</p>
        ) : (
          <div className="alerts-list">
            {alertItems.map((alert, idx) => (
              <article key={`${alert.text}-${idx}`} className={`alert-item ${alert.level}`}>
                <span className="alert-icon" aria-hidden="true">{alert.icon}</span>
                {alert.text}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="analytics-grid" aria-label="Model analytics and threshold tuning">
        <article className="panel analytics-panel">
          <div className="panel-heading compact">
            <h2 className="heading-with-icon">Threshold tuning</h2>
            <span className="model-badge">Alert {'>='} {alertThreshold}</span>
          </div>
          <label className="slider-label" htmlFor="alert-threshold">
            Risk threshold ({alertThreshold})
          </label>
          <input
            id="alert-threshold"
            type="range"
            min="50"
            max="95"
            step="1"
            value={alertThreshold}
            onChange={(event) => setAlertThreshold(Number(event.target.value))}
          />
          <div className="metric-grid tuning">
            <div className="metric-card good">
              <span>Sensitivity</span>
              <strong>{modelPerf.sensitivity}%</strong>
            </div>
            <div className="metric-card good">
              <span>Specificity</span>
              <strong>{modelPerf.specificity}%</strong>
            </div>
            <div className="metric-card">
              <span>Precision</span>
              <strong>{modelPerf.precision}%</strong>
            </div>
            <div className="metric-card">
              <span>False alarms</span>
              <strong>{modelPerf.fp}</strong>
            </div>
          </div>
        </article>

        <article className="panel analytics-panel">
          <div className="panel-heading compact">
            <h2 className="heading-with-icon">NEWS2 baseline and model</h2>
            <span className="model-badge">Lead time {averageLeadTime}h</span>
          </div>
          <div className="compare-grid">
            <div>
              <h3>AI Model</h3>
              <p>Sensitivity {modelPerf.sensitivity}% | Specificity {modelPerf.specificity}%</p>
            </div>
            <div>
                <h3>NEWS2 ({'>='}7)</h3>
              <p>Sensitivity {news2Perf.sensitivity}% | Specificity {news2Perf.specificity}%</p>
            </div>
          </div>
          <small className="timestamp">Selected patient NEWS2 score: {currentNews2}</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="panel patient-panel">
          <div className="panel-heading">
            <div>
              <h2>Ranked patient risk</h2>
              <p>Sorted by deterioration probability</p>
            </div>
            <span className="timestamp">Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>

          <div className="patient-list">
            {sortedQueue.map((patient) => (
              <article className={`patient-row ${selectedPatientId === patient.patient_id ? 'selected' : ''}`} key={patient.patient_id}>
                <div className="patient-identity">
                  <span className={`status-pill ${patient.status.toLowerCase()}`}>
                    <span className="status-icon" aria-hidden="true">{statusIcons[patient.status.toLowerCase()]}</span>
                    {patient.status}
                  </span>
                  <strong>{patient.bed}</strong>
                  <small>Patient {patient.patient_id}</small>
                </div>
                <Sparkline points={patient.waveform} patientId={patient.patient_id} bed={patient.bed} />
                <div className="vital-strip" aria-label={`Vitals for patient ${patient.patient_id}`}>
                  <span><span className="vital-label">HR</span> <b>{patient.vitals.HR}</b></span>
                  <span><span className="vital-label">SpO2</span> <b>{patient.vitals.SpO2}</b></span>
                  <span><span className="vital-label">RR</span> <b>{patient.vitals.Resp}</b></span>
                  <span><span className="vital-label">T</span> <b>{patient.vitals.Temp}</b></span>
                </div>
                <div className="risk-block">
                  <RiskDial value={patient.risk} patientId={patient.patient_id} />
                  <small>{patient.trend} trend</small>
                </div>
                <div className="lead-signal">{patient.lead}</div>
                <button
                  type="button"
                  className={`inspect-button ${selectedPatientId === patient.patient_id ? 'active' : ''}`}
                  onClick={() => setSelectedPatientId(patient.patient_id)}
                >
                  Inspect impact
                </button>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel insight-panel">
          <div className="panel-heading compact">
            <h2>Model snapshot</h2>
            <span className="model-badge">3-model ensemble</span>
          </div>
          {metricsError && (
            <p className="metrics-note" role="note">Offline metrics unavailable. Showing placeholders. Start the backend API to load them.</p>
          )}
          <div className="metric-grid">
            {liveModelStats.map((stat) => (
              <div className={`metric-card ${stat.tone}`} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className="divider" />

          <h3>Risk impact: patient {selectedPatient?.patient_id} <small className="synthetic-tag">(synthetic preview, not attention/SHAP)</small></h3>
          <ExplainabilityWaveform points={selectedPatient?.waveform || []} />
          <div className="signal-list">
            {impactMetrics.map((metric) => (
              <div className="signal-row" key={metric.name}>
                <div>
                  <span>{metric.name}</span>
                  <small>{metric.points >= 0 ? '+' : ''}{metric.points} risk points</small>
                </div>
                <div className={`bar-track impact ${metric.points >= 0 ? 'up' : 'down'}`}>
                  <span style={{ width: `${Math.min(100, Math.abs(metric.value) * 10)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </Shell>
  )
}

function RoutedPage({ children, theme, onToggleTheme }) {
  return <Shell theme={theme} onToggleTheme={onToggleTheme}>{children}</Shell>
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('syncura-theme')
    return storedTheme === 'dark' ? 'dark' : 'light'
  })
  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))

  useEffect(() => {
    localStorage.setItem('syncura-theme', theme)
  }, [theme])

  return (
    <SimulationProvider>
      <BrowserRouter>
        <Suspense fallback={<main className="main-surface" aria-label="Loading page"><p>Loading…</p></main>}>
        <Routes>
          <Route path="/" element={<WelcomePage theme={theme} onToggleTheme={toggleTheme} />} />
          <Route
            path="/dashboard"
            element={<Dashboard theme={theme} onToggleTheme={toggleTheme} />}
          />
          <Route
            path="/simulated-data"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><SimulatedDataFeed /></RoutedPage>}
          />
          <Route
            path="/training"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><TrainingJobsList /></RoutedPage>}
          />
          <Route
            path="/training/new"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><TrainingConfig /></RoutedPage>}
          />
          <Route
            path="/training/:jobId"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><TrainingMonitor /></RoutedPage>}
          />
          <Route
            path="/architecture"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><ArchitecturePage /></RoutedPage>}
          />
          <Route
            path="/waveforms"
            element={<RoutedPage theme={theme} onToggleTheme={toggleTheme}><SensorWaveform /></RoutedPage>}
          />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </SimulationProvider>
  )
}
