import { Fragment, useMemo, useState } from 'react'
import report from './data/quality-report.json'

const STATUS_META = {
  pass: { label: 'In place', symbol: '✓', cls: 'pass' },
  fail: { label: 'Missing', symbol: '✕', cls: 'fail' },
  na: { label: 'N/A', symbol: '–', cls: 'na' },
}

function StatusPill({ status, note }) {
  const meta = STATUS_META[status] || STATUS_META.na
  return (
    <span className={`pill pill-${meta.cls}`} title={note || meta.label}>
      <span className="pill-symbol">{meta.symbol}</span>
      {meta.label}
      {note ? <span className="pill-note">{note}</span> : null}
    </span>
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
    const counted = projects.filter((p) => p.unitTests.status !== 'na')
    const tally = (key) => counted.filter((p) => p[key].status === 'pass').length
    return {
      total: projects.length,
      tracked: counted.length,
      unit: tally('unitTests'),
      sonar: tally('sonarQube'),
      e2e: tally('e2e'),
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
          <StatCard label="Unit tests in place" value={stats.unit} total={stats.tracked} tone="good" />
          <StatCard label="SonarQube enabled" value={stats.sonar} total={stats.tracked} tone="warn" />
          <StatCard label="E2E testing in place" value={stats.e2e} total={stats.tracked} tone="warn" />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Coverage Matrix</h2>
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

          <div className="table-scroll">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="sticky-col">Project</th>
                  {dimensions.map((d) => (
                    <th key={d.key}>{d.label}</th>
                  ))}
                  <th>Coverage</th>
                  <th>PR Reviewers</th>
                  <th>PR Rules</th>
                  <th>Additional</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map(({ group, items }) => (
                  <Fragment key={group}>
                    <tr className="group-row">
                      <td className="sticky-col group-cell">{group}</td>
                      <td className="group-cell" colSpan={dimensions.length + 4}>
                        <span className="group-count">{items.length} {items.length === 1 ? 'project' : 'projects'}</span>
                      </td>
                    </tr>
                    {items.map((p) => (
                      <tr key={p.name}>
                        <td className="sticky-col">
                          <div className="proj-name">{p.name}</div>
                        </td>
                        {dimensions.map((d) => (
                          <td key={d.key}>
                            <StatusPill status={p[d.key].status} note={p[d.key].note} />
                          </td>
                        ))}
                        <td>{p.coverage || <span className="muted">—</span>}</td>
                        <td className="center">{p.prReviewers ?? <span className="muted">—</span>}</td>
                        <td>
                          {p.prRules.length ? (
                            <ul className="ruleset">
                              {p.prRules.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td>
                          {p.additional.length ? (
                            <ul className="ruleset subtle">
                              {p.additional.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                          ) : <span className="muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
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
