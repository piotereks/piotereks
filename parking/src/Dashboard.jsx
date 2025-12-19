import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';

const API_URLS = [
  'https://gd.zaparkuj.pl/api/freegroupcountervalue.json',
  'https://gd.zaparkuj.pl/api/freegroupcountervalue-green.json'
];
const CORS_PROXY = 'https://corsproxy.io/?';

const ParkingCard = ({ data, now }) => {
  const ts = new Date(data.Timestamp.replace(' ', 'T'));
  const age = Math.max(0, Math.floor((now - ts) / 1000 / 60));

  let ageClass = '';
  if (age >= 15) ageClass = 'age-old';
  else if (age > 5) ageClass = 'age-medium';

  let name = data.ParkingGroupName;
  if (name === 'Bank_1') name = 'Uni Wroc';

  return (
    <div className="parking-card">
      <div className="parking-name">{name}</div>
      <div className={`free-spots ${ageClass}`}>
        {data.CurrentFreeGroupCounterValue || 0}
      </div>
      <div className="age-indicator-small">{age} min ago</div>
      <div className="timestamp-small">@{ts.toLocaleTimeString('pl-PL')}</div>
    </div>
  );
};

const Dashboard = ({ setView }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(API_URLS.map(url =>
        fetch(`${CORS_PROXY}${encodeURIComponent(url + '?time=' + Date.now())}`)
          .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      ));
      setData(results);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setNow(new Date()), 1000);
    const refreshTimer = setInterval(fetchData, 5 * 60 * 1000); // Auto refresh 5m
    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, [fetchData]);

  const totalSpaces = data.reduce((sum, d) => sum + (d.CurrentFreeGroupCounterValue || 0), 0);
  const updateStatus = lastUpdate ? `Last update: ${lastUpdate.toLocaleTimeString('pl-PL')}` : 'Loading...';

  return (
    <>
      <Header
        title="Parking Monitor"
        icon="🅿️"
        onRefresh={fetchData}
        updateStatus={updateStatus}
        currentView="dashboard"
        setView={setView}
      />
      <main className="container">
        <div className="subtitle">Real-time parking availability • UBS Wrocław</div>

        {error && <div className="error"><strong>ERROR:</strong> {error}</div>}

        <div className="grid-container">
          {loading && data.length === 0 ? (
            <div className="loader">Loading parking data...</div>
          ) : (
            data.map((d, i) => <ParkingCard key={i} data={d} now={now} />)
          )}
        </div>

        <div className="status-panel">
          <div className="panel-section">
            <div className="status-label">Total Spaces</div>
            <div className="status-value big-value">{loading ? '---' : totalSpaces}</div>
          </div>
          <div className="panel-section">
            <div className="status-label">Data Status</div>
            <div className="status-value" style={{ color: error ? 'var(--warning)' : 'var(--success)' }}>
              {loading ? 'LOADING' : (error ? 'OFFLINE' : 'ONLINE')}
            </div>
          </div>
          <div className="panel-section">
            <div className="status-label">Last Update / Current Time</div>
            <div className="time-group">
              <span>{lastUpdate ? lastUpdate.toLocaleTimeString('pl-PL') : '--:--:--'}</span>
              <span className="status-current-inline">{now.toLocaleTimeString('pl-PL')}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
