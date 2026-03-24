function Line({ className = "", style = {} }) {
  return <div className={`skeleton skeleton-line ${className}`} style={style} aria-hidden />;
}

export function AgendaTimelineSkeleton() {
  return (
    <div className="agenda-timeline-wrap">
      <div
        className="agenda-timeline agenda-timeline--premium skeleton-timeline"
        aria-busy="true"
        aria-label="Cargando horarios del día"
      >
        <div className="agenda-timeline-head skeleton-timeline-head">
          <span className="agenda-timeline-head-time">
            <Line className="skeleton-line--xs" style={{ width: 28, height: 8, marginLeft: "auto" }} />
          </span>
          <span className="agenda-timeline-head-main">
            <Line className="skeleton-line--xs" style={{ width: 120, height: 8 }} />
          </span>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton-agenda-row">
            <div className="skeleton-agenda-time">
              <Line className="skeleton-line--xs" style={{ width: 38, height: 12, marginLeft: "auto" }} />
            </div>
            <div className="skeleton-agenda-cell">
              <Line className="skeleton-line--sm" style={{ width: "100%", height: 34 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="shell-skeleton dashboard-skeleton-wrap" aria-busy="true" aria-label="Cargando panel">
      <div className="dashboard-metrics">
        {[1, 2, 3, 4].map((i) => (
          <article key={i} className={`dashboard-metric-card ${i === 1 ? "dashboard-metric-card--lead" : ""}`}>
            <Line className="skeleton-line--xs" style={{ width: i === 1 ? "52%" : "48%" }} />
            <Line className="skeleton-line--xl" style={{ width: i === 1 ? "42%" : "38%", marginTop: 14 }} />
            <Line className="skeleton-line--xs" style={{ width: "72%", marginTop: 10 }} />
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        {[1, 2].map((k) => (
          <section key={k} className="card dashboard-panel">
            <Line className="skeleton-line--xs" style={{ width: "36%", marginBottom: 18 }} />
            <Line className="skeleton-line--sm" style={{ width: "100%", marginBottom: 12 }} />
            <Line className="skeleton-line--sm" style={{ width: "96%", marginBottom: 12 }} />
            <Line className="skeleton-line--sm" style={{ width: "88%", marginBottom: 12 }} />
            <Line className="skeleton-line--sm" style={{ width: "92%" }} />
          </section>
        ))}
      </div>
    </div>
  );
}

export function AgendaBoardSkeleton() {
  return (
    <div className="agenda-star-board agenda-board-skeleton" aria-busy="true" aria-label="Cargando agenda">
      <div className="card-inner agenda-toolbar-skeleton">
        <div className="agenda-toolbar-skeleton-row">
          <Line className="skeleton-line--sm" style={{ width: 140, height: 40 }} />
          <Line className="skeleton-line--sm" style={{ flex: 1, minWidth: 160, height: 40 }} />
          <Line className="skeleton-line--sm" style={{ width: 220, height: 36 }} />
        </div>
        <Line className="skeleton-line--xs" style={{ width: "55%", marginTop: 14 }} />
      </div>
      <AgendaTimelineSkeleton />
    </div>
  );
}

export function TableListSkeleton({ rows = 7, columns = 6 }) {
  return (
    <div className="table-skeleton-wrap table-wrap" aria-busy="true" aria-label="Cargando lista">
      <div className="table-skeleton-head">
        {Array.from({ length: columns }).map((_, i) => (
          <Line key={i} className="skeleton-line--xs" style={{ flex: 1, height: 10 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="table-skeleton-row">
          {Array.from({ length: columns }).map((_, c) => (
            <Line key={c} className="skeleton-line--sm" style={{ flex: 1, height: 12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
