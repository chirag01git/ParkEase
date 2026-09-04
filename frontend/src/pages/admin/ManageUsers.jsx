import React, { useState, useEffect } from 'react';
import { getUsersApi } from '../../api/services';
import StatusBadge from '../../components/StatusBadge';
import { Users, Mail, Phone, Calendar } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsersApi();
      if (res.data.success) {
        setUsers(res.data.data.users);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Registered System Users</h1>
        <p className="page-subtitle">Inspect registered accounts across all system roles</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading users list...</div>
      ) : (
        <div className="glass-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td><code>#{u._id.slice(-6)}</code></td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
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

export default ManageUsers;
