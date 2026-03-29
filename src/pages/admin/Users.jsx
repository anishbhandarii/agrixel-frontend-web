import { useState, useEffect } from 'react'
import client from '../../api/client'

const LANG_FLAG = {
  english: '🇬🇧', hindi: '🇮🇳', nepali: '🇳🇵',
  french: '🇫🇷', german: '🇩🇪', korean: '🇰🇷', chinese: '🇨🇳',
}
const LANG_SHORT = {
  english: 'EN', hindi: 'HI', nepali: 'NE',
  french: 'FR', german: 'DE', korean: 'KO', chinese: 'ZH',
}

const formatDate = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const Users = () => {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [toggling, setToggling] = useState(null)
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    client.get('/admin/users')
      .then(r => setUsers(Array.isArray(r.data) ? r.data : r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  const handleToggle = async (user) => {
    setToggling(user.id)
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    try {
      await client.patch(`/admin/users/${user.id}/toggle`)
    } catch {
      // Revert on error
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } finally {
      setToggling(null)
    }
  }

  const thStyle = {
    fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase',
    letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif',
    padding: '12px 20px', textAlign: 'left', fontWeight: 500,
    whiteSpace: 'nowrap',
  }

  const tdStyle = {
    padding: '14px 20px', fontSize: '13px', color: 'var(--text)',
    fontFamily: 'Inter, sans-serif', verticalAlign: 'middle',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: '32px', height: '32px',
        border: '2px solid var(--primary)', borderTopColor: 'transparent',
        borderRadius: '999px', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
            User Management
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>
            {users.length} total user{users.length !== 1 ? 's' : ''}
          </div>
        </div>
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search by name or email..."
          style={{
            width: '240px', height: '40px', padding: '0 14px',
            background: 'var(--surface)',
            border: `1px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: '8px', color: 'var(--text)',
            fontSize: '13px', fontFamily: 'Inter, sans-serif',
            outline: 'none', transition: 'border-color 0.15s ease',
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Name', 'Email', 'Role', 'Language', 'Region', 'Status', 'Joined', 'Actions'].map(col => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: 'var(--muted-2)', padding: '40px' }}>
                    No users found.
                  </td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Name */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '999px',
                        background: '#166534', color: 'var(--primary)',
                        fontSize: '12px', fontWeight: 600, fontFamily: 'Syne, sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span style={{ whiteSpace: 'nowrap' }}>{u.full_name || '—'}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ ...tdStyle, color: 'var(--muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}
                  </td>

                  {/* Role */}
                  <td style={tdStyle}>
                    <span style={{
                      background: u.role === 'admin' ? 'rgba(96,165,250,0.12)' : 'rgba(74,222,128,0.12)',
                      color: u.role === 'admin' ? '#60a5fa' : 'var(--primary)',
                      borderRadius: '999px', padding: '3px 10px',
                      fontSize: '11px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                      textTransform: 'capitalize',
                    }}>
                      {u.role || 'farmer'}
                    </span>
                  </td>

                  {/* Language */}
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {LANG_FLAG[u.preferred_language] || '🌐'}{' '}
                    <span style={{ color: 'var(--muted)' }}>{LANG_SHORT[u.preferred_language] || (u.preferred_language || '—').toUpperCase()}</span>
                  </td>

                  {/* Region */}
                  <td style={{ ...tdStyle, color: 'var(--muted)' }}>
                    {u.region || '—'}
                  </td>

                  {/* Status */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '999px',
                        background: u.is_active !== false ? 'var(--primary)' : 'var(--danger)',
                        boxShadow: u.is_active !== false ? '0 0 5px rgba(74,222,128,0.5)' : 'none',
                        flexShrink: 0,
                      }} />
                      <span style={{ color: u.is_active !== false ? 'var(--primary)' : 'var(--danger)', fontSize: '13px' }}>
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>

                  {/* Joined */}
                  <td style={{ ...tdStyle, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(u.created_at)}
                  </td>

                  {/* Actions */}
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={toggling === u.id}
                      style={{
                        padding: '4px 10px', fontSize: '12px',
                        borderRadius: '6px', cursor: toggling === u.id ? 'not-allowed' : 'pointer',
                        fontFamily: 'Inter, sans-serif', fontWeight: 500,
                        opacity: toggling === u.id ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                        background: 'transparent',
                        border: u.is_active !== false ? '1px solid var(--danger)' : '1px solid var(--primary)',
                        color: u.is_active !== false ? 'var(--danger)' : 'var(--primary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Users
