import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TrainingConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    physionet_path: '',
    outcomes_path: '',
    epochs: 5,
    batch_size: 32,
    learning_rate: 0.001,
    max_patients: 100,
    vital_features: ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP', 'SpO2',
                     'GCS', 'BUN', 'Creatinine', 'WBC', 'Platelets', 'Glucose']
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      vital_features: prev.vital_features.includes(feature)
        ? prev.vital_features.filter(f => f !== feature)
        : [...prev.vital_features, feature]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/training/start`, formData);
      const jobId = response.data.job_id;

      navigate(`/training/${jobId}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start training');
      setLoading(false);
    }
  };

  const availableFeatures = ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP', 'SpO2', 'EtCO2'];

  return (
    <div className="training-page">
      <div className="training-content training-narrow">
        <div className="training-panel">
          <h1>ML Model Training</h1>
          <p className="training-lede">Configure and start a new training job.</p>

          {error && (
            <div className="training-error" role="alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="training-form">
            <section className="training-section" aria-labelledby="training-data-title">
              <h2 id="training-data-title">Data configuration</h2>
              <div className="training-field">
                <label htmlFor="tc-physionet-path">PhysioNet data path</label>
                <input
                  id="tc-physionet-path"
                  type="text"
                  name="physionet_path"
                  value={formData.physionet_path}
                  onChange={handleInputChange}
                  placeholder="/path/to/physionet/data"
                  required
                />
                <p className="training-help">Path to PhysioNet 2012 ICU dataset directory.</p>
              </div>

              <div className="training-field">
                <label htmlFor="tc-outcomes-path">Outcomes file path</label>
                <input
                  id="tc-outcomes-path"
                  type="text"
                  name="outcomes_path"
                  value={formData.outcomes_path}
                  onChange={handleInputChange}
                  placeholder="/path/to/Outcomes-a.txt"
                  required
                />
                <p className="training-help">Path to Outcomes-a.txt file.</p>
              </div>
            </section>

            <section className="training-section" aria-labelledby="training-hyperparameters-title">
              <h2 id="training-hyperparameters-title">Training hyperparameters</h2>
              <div className="training-grid">
                <div className="training-field">
                  <label htmlFor="tc-epochs">Epochs</label>
                  <input
                    id="tc-epochs"
                    type="number"
                    name="epochs"
                    value={formData.epochs}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="training-field">
                  <label htmlFor="tc-batch-size">Batch size</label>
                  <input
                    id="tc-batch-size"
                    type="number"
                    name="batch_size"
                    value={formData.batch_size}
                    onChange={handleInputChange}
                    min="1"
                    max="256"
                  />
                </div>

                <div className="training-field">
                  <label htmlFor="tc-learning-rate">Learning rate</label>
                  <input
                    id="tc-learning-rate"
                    type="number"
                    name="learning_rate"
                    value={formData.learning_rate}
                    onChange={handleInputChange}
                    min="0.00001"
                    max="0.1"
                    step="0.0001"
                  />
                </div>

                <div className="training-field">
                  <label htmlFor="tc-max-patients">Max patients</label>
                  <input
                    id="tc-max-patients"
                    type="number"
                    name="max_patients"
                    value={formData.max_patients}
                    onChange={handleInputChange}
                    min="10"
                    max="10000"
                  />
                </div>
              </div>
            </section>

            <section className="training-section" aria-labelledby="training-features-title">
              <h2 id="training-features-title">Vital features</h2>
              <p className="training-help">Select vital signs to include in training.</p>
              <div className="training-check-grid">
                {availableFeatures.map(feature => (
                  <label key={feature} className="training-check">
                    <input
                      type="checkbox"
                      checked={formData.vital_features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                    />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="training-actions">
              <button type="submit" disabled={loading} className="button primary">
                {loading ? 'Starting training' : 'Start training'}
              </button>
              <button type="button" onClick={() => navigate('/')} className="button secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
