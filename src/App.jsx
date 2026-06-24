import { useMemo, useState } from 'react'
import report from './data/quality-report.json'

const STATUS_META = {
  pass: { label: 'In place', symbol: '✓', cls: 'pass' },
  fail: { label: 'Missing', symbol: '✕', cls: 'fail' },
  na: { label: 'Not applicable', symbol: '–', cls: 'na' },
}

function CheckBadge({ status, label, note }) {
  const meta = STATUS_META[status] || STATUS_META.na
  return (
    <div className={`check check-${meta.cls}`} title={`${label}: ${meta.label}${note ? ` — ${note}` : ''}`}>
      <span className="check-ic">{meta.symbol}</span>
      <span className="check-meta">
        <span className="check-label">{label}</span>
        {note ? <span className="check-note">{note}</span> : null}
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
  const { meta, dimensions, projects, sonarQube, plan, openQuestions } = report
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
    const applicable = (key) => projects.filter((p) => p[key].status !== 'na')
    const dim = (key) => {
      const tracked = applicable(key)
      return {
        pass: tracked.filter((p) => p[key].status === 'pass').length,
        tracked: tracked.length,
      }
    }
    return {
      total: projects.length,
      unit: dim('unitTests'),
      sonar: dim('sonarQube'),
      e2e: dim('e2e'),
    }
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
            <span>Last modified: {meta.lastModified}</span>
            <a href={meta.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="stats">
          <StatCard label="Projects tracked" value={stats.total} tone="neutral" />
          <StatCard label="Unit tests in place" value={stats.unit.pass} total={stats.unit.tracked} tone="good" />
          <StatCard label="SonarQube enabled" value={stats.sonar.pass} total={stats.sonar.tracked} tone="warn" />
          <StatCard label="E2E testing in place" value={stats.e2e.pass} total={stats.e2e.tracked} tone="warn" />
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
                        {p.coverage ? <span className="cov">Coverage {p.coverage}</span> : null}
                      </div>
                      <div className="pchecks">
                        {dimensions.map((d) => (
                          <CheckBadge
                            key={d.key}
                            status={p[d.key].status}
                            label={d.label}
                            note={p[d.key].note}
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

        <section className="panel">
          <div className="panel-head"><h2>Open Questions</h2></div>
          <ul className="questions">
            {openQuestions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </section>
      </main>

      <footer className="footer">
        <span>Generated from “{meta.source}”. Edit <code>src/data/quality-report.json</code> to update.</span>
      </footer>
    </div>
  )
}
