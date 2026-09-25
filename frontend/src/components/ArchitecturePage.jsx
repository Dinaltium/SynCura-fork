import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const pipelineStages = [
  {
    title: 'Data ingestion',
    body: 'Real-time vitals from bedside monitors via MQTT or HTTP endpoints.',
    stack: 'MQTT, HTTP, WebSocket',
  },
  {
    title: 'Preprocessing',
    body: 'Normalization, feature engineering, and temporal windowing.',
    stack: 'Feature engineering, windowing',
  },
  {
    title: 'LSTM inference',
    body: 'Deep learning inference for outcome prediction.',
    stack: 'PyTorch, LSTM, GPU ready',
  },
  {
    title: 'Risk scoring',
    body: 'Probabilistic predictions with clinical alerts and Discord notifications.',
    stack: 'NEWS2, SHAP, webhooks',
  },
]

const technologyGroups = [
  {
    key: 'backend',
    title: 'Backend',
    items: [
      ['FastAPI', 'REST endpoints and async I/O'],
      ['PyTorch', 'LSTM inference engine'],
      ['SQLite', 'Patient data persistence'],
      ['MQTT', 'Real-time vital streaming'],
    ],
  },
  {
    key: 'frontend',
    title: 'Frontend',
    items: [
      ['React 18', 'UI component framework'],
      ['Vite', 'Next-generation build tooling'],
      ['React Router', 'Client-side navigation'],
      ['Tailwind CSS', 'Responsive styling'],
    ],
  },
  {
    key: 'ml',
    title: 'ML Pipeline',
    items: [
      ['LSTM Networks', 'Time-series outcome prediction'],
      ['PhysioNet', '8,000-patient PhysioNet 2012 dataset'],
      ['SHAP', 'Model explainability and transparency'],
      ['NEWS2', 'Clinical risk scoring standard'],
    ],
  },
  {
    key: 'hardware',
    title: 'Hardware',
    items: [
      ['ESP32-MAX30105', 'Advanced pulse and SpO2 sensor'],
      ['WiFi and MQTT Protocol', 'Decentralized data collection'],
      ['Edge Computing', 'On-device inference ready'],
    ],
  },
]

const evaluationMetrics = [
  {
    term: 'Holdout AUC',
    value: '84.4%',
    note: '95 percent CI 0.836 to 0.852',
    primary: true,
  },
  {
    term: 'Holdout Accuracy',
    value: '74.7%',
    note: 'Unseen set-B evaluation',
  },
  {
    term: 'Holdout Precision',
    value: '34.5%',
    note: 'Imbalanced mortality outcome',
  },
  {
    term: 'Holdout Recall',
    value: '80.7%',
    note: 'Sensitivity to deterioration',
  },
]

const systemFunctions = [
  {
    title: 'Simulated monitoring',
    body: 'Synthetic patient vitals generated locally for demonstration, not live bedside data.',
  },
  {
    title: 'AI-powered predictions',
    body: 'LSTM ensemble trained on PhysioNet 2012 ICU data as a research prototype.',
  },
  {
    title: 'Clinical transparency',
    body: 'SHAP-based explainability showing which vitals drive each prediction.',
  },
  {
    title: 'Scalable pipeline',
    body: 'Microservices architecture supporting high-throughput multi-patient monitoring.',
  },
  {
    title: 'Research-prototype security',
    body: 'Local demo only. No auth, no encryption, and no audit logging. Not HIPAA-ready.',
  },
  {
    title: 'Edge computing ready',
    body: 'Sensor integration with ESP32 for decentralized patient monitoring.',
  },
]

const deploymentEnvironments = [
  {
    title: 'Development',
    body: 'Local development with hot reload and real-time debugging.',
    command: 'npm run dev + python app.py',
  },
  {
    title: 'Production ready',
    body: 'Docker containerization, CI and CD pipelines, and cloud deployment.',
    command: 'Docker + GitHub Actions',
  },
  {
    title: 'Cloud deployment',
    body: 'AWS, GCP, or Azure with Kubernetes orchestration.',
    command: 'K8s + Helm charts',
  },
]

export default function ArchitecturePage({ embedded = false }) {
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div id={embedded ? 'architecture' : undefined} className={`architecture-container ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <nav className="arch-nav" aria-label="Architecture">
          <Link to="/" className="arch-back">
            Back to Home
          </Link>
        </nav>
      )}

      <section className="arch-hero" aria-labelledby={embedded ? 'embedded-architecture-title' : 'architecture-title'}>
        {!embedded && <p className="arch-eyebrow">System architecture</p>}
        <h1 id={embedded ? 'embedded-architecture-title' : 'architecture-title'}>End-to-End ML Pipeline</h1>
        <p className="arch-subtitle">
          Research-prototype ICU monitoring demo with simulated vitals and offline-evaluated predictions.
        </p>
        <dl className="arch-stats">
          <div className="arch-stat">
            <dt>Holdout AUC</dt>
            <dd><strong>84.4 percent</strong><span>Research result</span></dd>
          </div>
          <div className="arch-stat">
            <dt>PhysioNet patients</dt>
            <dd><strong>8,000</strong><span>2012 challenge cohort</span></dd>
          </div>
          <div className="arch-stat">
            <dt>Inference target</dt>
            <dd><strong>CPU</strong><span>Real-time research scoring</span></dd>
          </div>
        </dl>
      </section>

      <section className="arch-section reveal" aria-labelledby={embedded ? 'embedded-flow-title' : 'flow-title'}>
        <div className="section-header">
          <h2 id={embedded ? 'embedded-flow-title' : 'flow-title'}>Data flow pipeline</h2>
          <p className="section-desc">Real-time ingestion, preprocessing, inference, and risk scoring.</p>
        </div>
        <ol className="arch-flow">
          {pipelineStages.map((stage) => (
            <li key={stage.title} className="arch-flow-stage">
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
              <p className="arch-flow-stack">{stage.stack}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="arch-section reveal" id="tech" aria-labelledby={embedded ? 'embedded-stack-title' : 'stack-title'}>
        <div className="section-header">
          <h2 id={embedded ? 'embedded-stack-title' : 'stack-title'}>Technology stack</h2>
          <p className="section-desc">Research-prototype stack for demonstration and evaluation.</p>
        </div>
        <div className="tech-group-list">
          {technologyGroups.map((group) => (
            <div key={group.key} className={`tech-group ${expandedSections[group.key] ? 'expanded' : ''}`}>
              <button
                type="button"
                className="tech-group-header"
                onClick={() => toggleSection(group.key)}
                aria-expanded={Boolean(expandedSections[group.key])}
                aria-controls={`architecture-${group.key}-details`}
              >
                <span className="tech-title">{group.title}</span>
                <span className="expand-icon" aria-hidden="true">{expandedSections[group.key] ? '-' : '+'}</span>
              </button>
              {expandedSections[group.key] && (
                <dl className="tech-group-body" id={`architecture-${group.key}-details`}>
                  {group.items.map(([name, role]) => (
                    <div key={name} className="tech-item">
                      <dt>{name}</dt>
                      <dd>{role}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="arch-section reveal" aria-labelledby={embedded ? 'embedded-metrics-title' : 'metrics-title'}>
        <div className="section-header">
          <h2 id={embedded ? 'embedded-metrics-title' : 'metrics-title'}>Model performance metrics</h2>
          <p className="section-desc">Evaluated on PhysioNet 2012: validation AUC 0.840 and holdout AUC 0.844.</p>
        </div>
        <div className="metrics-showcase">
          {evaluationMetrics.map((metric) => (
            <div key={metric.term} className={`metric-box ${metric.primary ? 'metric-primary' : ''}`}>
              <p className="metric-term">{metric.term}</p>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-name">{metric.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="arch-section reveal" aria-labelledby={embedded ? 'embedded-functions-title' : 'functions-title'}>
        <div className="section-header">
          <h2 id={embedded ? 'embedded-functions-title' : 'functions-title'}>Key functions</h2>
          <p className="section-desc">Monitoring, prediction, transparency, deployment, and research limits.</p>
        </div>
        <div className="arch-function-list">
          {systemFunctions.map((item) => (
            <article key={item.title} className="arch-function">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="arch-section reveal" aria-labelledby={embedded ? 'embedded-deployment-title' : 'deployment-title'}>
        <div className="section-header">
          <h2 id={embedded ? 'embedded-deployment-title' : 'deployment-title'}>Deployment and infrastructure</h2>
          <p className="section-desc">Development, staging, and production configurations.</p>
        </div>
        <div className="deployment-list">
          {deploymentEnvironments.map((environment) => (
            <article key={environment.title} className="deployment-row">
              <div>
                <h3>{environment.title}</h3>
                <p>{environment.body}</p>
              </div>
              <p className="deployment-code">{environment.command}</p>
            </article>
          ))}
        </div>
      </section>

      {!embedded && (
        <section className="arch-final" aria-labelledby="architecture-final-title">
          <div>
            <h2 id="architecture-final-title">Ready to explore</h2>
            <p>Launch the interactive dashboard to see the system in action.</p>
          </div>
          <Link to="/dashboard" className="cta-button">
            Launch dashboard
          </Link>
        </section>
      )}
    </div>
  )
}
