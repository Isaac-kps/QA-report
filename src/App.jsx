import { useMemo, useState } from 'react'
import report from './data/quality-report.json'

const STATUS_META = {
  pass: { label: 'In place', symbol: '✓', cls: 'pass' },
  fail: { label: 'Missing', symbol: '✕', cls: 'fail' },
  na: { label: 'Not applicable', symbol: '–', cls: 'na' },
}

// Friendly labels for known test keys; unknown keys are auto-humanized.
const LABELS = {
  unitTests: 'Unit Tests',
  sonarQube: 'SonarQube Cloud',
  e2e: 'E2E Testing',
  evalUnitTests: 'Eval Unit Tests',
  evalE2ETest: 'Eval E2E Test',
  sqlTests: 'SQL Tests',
  androidE2E: 'Android E2E',
}

function humanize(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bE2 E\b/, 'E2E')
    .replace(/\bSql\b/, 'SQL')
    .replace(/\bUi\b/, 'UI')
}

const labelFor = (key) => LABELS[key] || humanize(key)

function CheckBadge({ status, label, note, coverage }) {
  const meta = STATUS_META[status] || STATUS_META.na
  const hasCoverage = coverage !== undefined
  const title = `${label}: ${meta.label}` +
    (hasCoverage ? ` — code coverage: ${coverage || '-'}` : '') +
    (note ? ` — ${note}` : '')
  return (
    <div className={`check check-${meta.cls}`} title={title}>
      <span className="check-ic">{meta.symbol}</span>
      <span className="check-meta">
        <span className="check-label">{label}</span>
        {note ? <span className="check-note">{note}</span> : null}
        {hasCoverage ? (
          <span className="check-cov">Code coverage: <strong>{coverage || '-'}</strong></span>
        ) : null}
      </span>
    </div>
  )
}

function StatCard({ label, value, total, tone }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-value">
        {value}
        {total != null && <span className="stat-total">/ {total}</span>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function App() {
  const { meta, projects, sonarQube, plan } = report
  // Injected at build time from the repo's latest commit (see vite.config.js);
  // falls back to the JSON value when unavailable (e.g. no git context).
  const lastModified = __LAST_MODIFIED__
    ? new Date(__LAST_MODIFIED__).toISOString().slice(0, 10)
    : meta.lastModified
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')

  const groups = useMemo(
    () => ['All', ...Array.from(new Set(projects.map((p) => p.group)))],
    [projects],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      const matchesGroup = groupFilter === 'All' || p.group === groupFilter
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
      return matchesGroup && matchesQuery
    })
  }, [projects, query, groupFilter])

  const grouped = useMemo(() => {
    const order = []
    const byGroup = new Map()
    filtered.forEach((p) => {
      if (!byGroup.has(p.group)) {
        byGroup.set(p.group, [])
        order.push(p.group)
      }
      byGroup.get(p.group).push(p)
    })
    return order.map((group) => ({ group, items: byGroup.get(group) }))
  }, [filtered])

  const stats = useMemo(() => {
    let passing = 0
    let applicable = 0
    let fullyGreen = 0
    projects.forEach((p) => {
      const checks = Object.values(p.tests).filter((c) => c.status !== 'na')
      const passed = checks.filter((c) => c.status === 'pass')
      passing += passed.length
      applicable += checks.length
      if (checks.length > 0 && passed.length === checks.length) fullyGreen += 1
    })
    return { total: projects.length, passing, applicable, fullyGreen }
  }, [projects])

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-inner">
          <div className="eyebrow">{meta.space}</div>
          <h1>{meta.title}</h1>
          <p className="subtitle">{meta.subtitle}</p>
          <div className="hero-meta">
            <span>Author: {meta.author}</span>
            <span>Last modified: {lastModified}</span>
            <a href={meta.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="stats">
          <StatCard label="Projects tracked" value={stats.total} tone="neutral" />
          <StatCard label="Checks passing" value={stats.passing} total={stats.applicable} tone="good" />
        </section>

        <section className="board">
          <div className="board-head">
            <h2>Coverage by Group</h2>
            <div className="controls">
              <input
                className="search"
                type="search"
                placeholder="Search project…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                {groups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="groups">
            {grouped.map(({ group, items }) => (
              <div className="group" key={group}>
                <div className="group-head">
                  <span className="group-bar" />
                  <h3>{group}</h3>
                  <span className="group-count">{items.length} {items.length === 1 ? 'project' : 'projects'}</span>
                </div>
                <div className="group-projects">
                  {items.map((p) => (
                    <div className="pcard" key={p.name}>
                      <div className="pcard-head">
                        <span className="pcard-name">{p.name}</span>
                      </div>
                      <div className="pchecks">
                        {Object.entries(p.tests).map(([key, c]) => (
                          <CheckBadge
                            key={key}
                            status={c.status}
                            label={labelFor(key)}
                            note={c.note}
                            coverage={c.coverage}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p className="empty">No projects match your filter.</p>}
        </section>

        {/* Temporarily hidden — SonarQube Quality Gate, Recommended Ratings, and Proposed Plan
        <section className="two-col">
          <div className="panel">
            <div className="panel-head"><h2>SonarQube Quality Gate</h2></div>
            <table className="kv">
              <tbody>
                {sonarQube.qualityGate.map((row) => (
                  <tr key={row.area}>
                    <td className="kv-key">{row.area}</td>
                    <td>{row.setting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Recommended Ratings</h2></div>
            <table className="kv">
              <tbody>
                {sonarQube.recommendedRatings.map((row) => (
                  <tr key={row.metric}>
                    <td className="kv-key">{row.metric}</td>
                    <td>
                      {row.value
                        ? <span className={`rating rating-${row.value.toLowerCase()}`}>{row.value}</span>
                        : <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cadence">{sonarQube.cadence}</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Proposed Plan</h2></div>
          <div className="phases">
            {plan.map((phase, i) => (
              <div className="phase" key={phase.phase}>
                <div className="phase-badge">{i + 1}</div>
                <div className="phase-body">
                  <h3>{phase.phase}</h3>
                  <ul>
                    {phase.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                  {phase.openQuestion && (
                    <div className="open-q">❓ {phase.openQuestion}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        */}

      </main>
    </div>
  )
}
