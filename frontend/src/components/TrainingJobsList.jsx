import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TrainingJobsList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${apiUrl}/training/jobs`);
        setJobs(response.data.jobs);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
        setLoading(false);
      }
    };

    fetchJobs();

    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="training-page" role="status" aria-live="polite">
        <div className="training-content">
          <div className="training-skeleton" aria-hidden="true">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-short" />
          </div>
          <p className="training-loading-text">Loading training jobs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="training-page">
      <div className="training-content">
        <div className="training-panel">
          <div className="training-header">
            <div>
              <h1>Training jobs</h1>
              <p className="training-lede">Manage and monitor ML training jobs.</p>
            </div>
            <button
              onClick={() => navigate('/training/new')}
              className="button primary"
            >
              New training job
            </button>
          </div>

          {error && (
            <div className="training-error" role="alert">
              <p>{error}</p>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="training-empty">
              <p>No training jobs yet.</p>
              <button
                onClick={() => navigate('/training/new')}
                className="button primary"
              >
                Create first training job
              </button>
            </div>
          ) : (
            <div className="training-job-list">
              {jobs.map(job => {
                const progress = job.total_epochs > 0
                  ? Math.round((job.current_epoch / job.total_epochs) * 100)
                  : 0;

                return (
                  <div
                    key={job.job_id}
                    onClick={() => navigate(`/training/${job.job_id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/training/${job.job_id}`)
                      if (event.key === ' ') {
                        event.preventDefault()
                        navigate(`/training/${job.job_id}`)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open training job ${job.job_id.slice(0, 8)}`}
                    className="training-job"
                  >
                    <div className="training-job-top">
                      <div>
                        <h3>Job {job.job_id.slice(0, 8)}</h3>
                        <p className="training-meta">
                          Started: {new Date(job.created_at).toLocaleString()}
                        </p>
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
                        <dt>Configuration</dt>
                        <dd>{job.config?.epochs} epochs, {job.config?.batch_size} batch size</dd>
                      </div>
                    </dl>

                    <div
                      className="training-progress"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`Training progress for job ${job.job_id.slice(0, 8)}`}
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>

                    {job.metrics && Object.keys(job.metrics).length > 0 && (
                      <dl className="training-metrics">
                        {job.metrics.train_loss != null && (
                          <div className="training-metric">
                            <dt>Loss</dt>
                            <dd>{job.metrics.train_loss.toFixed(4)}</dd>
                          </div>
                        )}
                        {job.metrics.val_accuracy != null && (
                          <div className="training-metric">
                            <dt>Validation accuracy</dt>
                            <dd>{(job.metrics.val_accuracy * 100).toFixed(1)}%</dd>
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
                            <dd>{(job.metrics.accuracy * 100).toFixed(1)}%</dd>
                          </div>
                        )}
                      </dl>
                    )}

                    {job.error_message && (
                      <div className="training-error">
                        <p>{job.error_message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
