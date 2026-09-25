import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TrainingMonitor() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`${apiUrl}/training/${jobId}`);
        setJob(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, apiUrl]);

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${apiUrl}/training/${jobId}`);
        setJob(response.data);

        if (response.data.metrics) {
          setProgressHistory(prev => [...prev, response.data.metrics].slice(-200));
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [job, jobId, apiUrl]);

  if (loading) {
    return (
      <div className="training-page" role="status" aria-live="polite">
        <div className="training-content training-narrow">
          <div className="training-skeleton" aria-hidden="true">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-short" />
          </div>
          <p className="training-loading-text">Loading training job.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-page">
        <div className="training-content training-narrow">
          <div className="training-panel">
            <div className="training-error" role="alert">
              <p>{error}</p>
            </div>
            <button
              onClick={() => navigate('/training')}
              className="button primary"
            >
              Back to training
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = job.total_epochs > 0
    ? Math.round((job.current_epoch / job.total_epochs) * 100)
    : 0;

  return (
    <div className="training-page">
      <div className="training-content training-wide">
        <div className="training-panel">
          <div className="training-header">
            <div>
              <h1>Training job {jobId.slice(0, 8)}</h1>
              <p className="training-lede">Monitor model training progress.</p>
            </div>
            <p className={`training-status status-${job.status}`} role="status">
              {job.status}
            </p>
          </div>

          <dl className="training-facts">
            <div>
              <dt>Epochs</dt>
              <dd>{job.current_epoch}/{job.total_epochs}</dd>
            </div>
            <div>
              <dt>Progress</dt>
              <dd>{progress}%</dd>
            </div>
            <div>
              <dt>Samples retained</dt>
              <dd>{progressHistory.length} updates</dd>
            </div>
          </dl>

          <div className="training-progress-block">
            <div className="training-progress-top">
              <p>Training progress</p>
              <p>{progress}%</p>
            </div>
            <div
              className="training-progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Training progress"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          {job.metrics && Object.keys(job.metrics).length > 0 && (
            <section className="training-section" aria-labelledby="training-current-metrics">
              <h2 id="training-current-metrics">Current metrics</h2>
              <dl className="training-metrics">
                {job.metrics.train_loss != null && (
                  <div className="training-metric">
                    <dt>Train loss</dt>
                    <dd>{job.metrics.train_loss.toFixed(4)}</dd>
                  </div>
                )}
                {job.metrics.val_accuracy != null && (
                  <div className="training-metric">
                    <dt>Validation accuracy</dt>
                    <dd>{(job.metrics.val_accuracy * 100).toFixed(2)}%</dd>
                  </div>
                )}
                {job.metrics.auc != null && (
                  <div className="training-metric">
                    <dt>AUC</dt>
                    <dd>{job.metrics.auc.toFixed(4)}</dd>
                  </div>
                )}
                {job.metrics.accuracy != null && (
                  <div className="training-metric">
                    <dt>Accuracy</dt>
                    <dd>{(job.metrics.accuracy * 100).toFixed(2)}%</dd>
                  </div>
                )}
                {job.metrics.precision != null && (
                  <div className="training-metric">
                    <dt>Precision</dt>
                    <dd>{(job.metrics.precision * 100).toFixed(2)}%</dd>
                  </div>
                )}
                {job.metrics.recall != null && (
                  <div className="training-metric">
                    <dt>Recall</dt>
                    <dd>{(job.metrics.recall * 100).toFixed(2)}%</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {job.error_message && (
            <div className="training-error">
              <p><strong>Error:</strong> {job.error_message}</p>
            </div>
          )}

          <section className="training-section" aria-labelledby="training-job-config">
            <h2 id="training-job-config">Configuration</h2>
            <dl className="training-config">
              {job.config && Object.entries(job.config).map(([key, value]) => (
                <div key={key} className="training-config-row">
                  <dt>{key}</dt>
                  <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="training-actions">
            <button
              onClick={() => navigate('/training')}
              className="button secondary"
            >
              Back to training
            </button>
            {(job.status === 'completed' || job.status === 'failed') && (
              <button
                onClick={() => navigate('/training/new')}
                className="button primary"
              >
                Create follow-up run
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
