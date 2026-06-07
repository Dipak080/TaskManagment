import { useState, useEffect } from 'react';
import { ReportsApi } from '../api/tasks';
import { localDateStr } from '../utils/format';

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const today = localDateStr();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await ReportsApi.eod({ start_date: startDate, end_date: endDate });
      setData(result);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!data.length) return;
    const headers = ['Department', 'Person', 'Created Count', 'Closed Count', 'Pending Count'];
    const rows = data.map(r => [
      `"${r.department}"`,
      `"${r.person}"`,
      r.created_count,
      r.closed_count,
      r.pending_count
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EOD_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">End-of-Day Reports</div>
          <div className="page-sub">Task volume and completion metrics</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }} onClick={exportCSV} disabled={!data.length}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      <div className="filters-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>Date Range:</label>
          <input 
            type="date" 
            className="filter-select" 
            style={{ width: 'auto', paddingRight: '12px', backgroundImage: 'none' }}
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
          />
          <span style={{ color: 'var(--text2)', fontSize: 12 }}>to</span>
          <input 
            type="date" 
            className="filter-select" 
            style={{ width: 'auto', paddingRight: '12px', backgroundImage: 'none' }}
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="table-card" style={{ margin: '0 20px' }}>
        {loading ? (
          <div className="loading-state" style={{ padding: 40 }}>Loading report data…</div>
        ) : !data.length ? (
          <div className="empty-state" style={{ padding: 40 }}>No data found for this date range.</div>
        ) : (
          <table className="master-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Person</th>
                <th style={{ textAlign: 'right' }}>Created in Range</th>
                <th style={{ textAlign: 'right' }}>Closed in Range</th>
                <th style={{ textAlign: 'right' }}>Still Pending</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.department}</td>
                  <td>{row.person}</td>
                  <td style={{ textAlign: 'right' }}>{row.created_count}</td>
                  <td style={{ textAlign: 'right' }}>{row.closed_count}</td>
                  <td style={{ textAlign: 'right' }}>{row.pending_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
