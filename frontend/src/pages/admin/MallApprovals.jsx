import React, { useState, useEffect } from 'react';
import { getAllMallsApi, approveMallApi, rejectMallApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { CheckCircle2, XCircle, Building2, MapPin } from 'lucide-react';

const MallApprovals = () => {
  const [malls, setMalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMalls();
  }, []);

  const fetchMalls = async () => {
    try {
      const res = await getAllMallsApi();
      if (res.data.success) {
        setMalls(res.data.data.malls);
      }
    } catch (err) {
      console.error('Failed to load malls', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    setSuccess('');
    setError('');
    try {
      const res = await approveMallApi(id);
      if (res.data.success) {
        setSuccess(`Mall '${name}' has been APPROVED successfully.`);
        fetchMalls();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve mall');
    }
  };

  const handleReject = async (id, name) => {
    setSuccess('');
    setError('');
    try {
      const res = await rejectMallApi(id);
      if (res.data.success) {
        setSuccess(`Mall '${name}' has been REJECTED.`);
        fetchMalls();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject mall');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Mall Approvals Queue</h1>
        <p className="page-subtitle">Only APPROVED malls are made visible to users for parking reservations</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading mall queue...</div>
      ) : malls.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <Building2 size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
          <h3>No Malls Found</h3>
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mall Name</th>
                  <th>Location</th>
                  <th>Owner</th>
                  <th>Slots</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {malls.map((m) => (
                  <tr key={m._id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.address}, {m.city}</td>
                    <td>{m.owner?.name} ({m.owner?.email})</td>
                    <td>{m.totalSlots}</td>
                    <td><StatusBadge status={m.status} /></td>
                    <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {m.status !== 'APPROVED' && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => handleApprove(m._id, m.name)}
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                        )}

                        {m.status !== 'REJECTED' && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => handleReject(m._id, m.name)}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MallApprovals;
