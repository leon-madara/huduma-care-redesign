// HudumaCare — Results (list + map) and Facility detail
const { FACILITIES, SERVICE_CATS, INSURERS, REVIEWS } = window.HC_DATA;
const { Stars, VerifyBadge, FacilityPhoto } = window.HC_SCREENS_1;
const I = window.I;

// ============================================================
// 4. SEARCH RESULTS — list + map split
// ============================================================
function Results({ go, state, setState }) {
  const [view, setView] = React.useState('split'); // list | map | split
  const [hover, setHover] = React.useState(null);
  const [sort, setSort] = React.useState('distance');
  const [filters, setFilters] = React.useState({
    openNow: false,
    insurance: ['NHIF'],
    minRating: 0,
    maxDistance: 10,
    verified: false,
  });

  let facilities = FACILITIES.slice();
  if (state.service) facilities = facilities.filter(f => f.category === state.service || state.service === 'general');
  if (facilities.length === 0) facilities = FACILITIES.slice();
  if (filters.openNow) facilities = facilities.filter(f => f.open);
  if (filters.verified) facilities = facilities.filter(f => f.verified !== 'unverified');
  if (filters.minRating > 0) facilities = facilities.filter(f => f.rating >= filters.minRating);
  facilities = facilities.filter(f => f.distanceKm <= filters.maxDistance);
  if (filters.insurance.length) {
    facilities = facilities.filter(f => filters.insurance.some(ins => f.insurance.includes(ins.split(' ')[0].toUpperCase().replace('/', ''))));
  }
  if (sort === 'distance') facilities.sort((a,b) => a.distanceKm - b.distanceKm);
  if (sort === 'rating') facilities.sort((a,b) => b.rating - a.rating);
  if (sort === 'wait') facilities.sort((a,b) => a.waitMins - b.waitMins);

  const toggleIns = (ins) => {
    setFilters(f => ({ ...f, insurance: f.insurance.includes(ins) ? f.insurance.filter(x => x !== ins) : [...f.insurance, ins] }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: view === 'split' ? '320px 1fr 1fr' : view === 'list' ? '320px 1fr' : '320px 1fr', height: '100%', overflow: 'hidden' }}>
      {/* Filters */}
      <aside style={{ borderRight: '1px solid var(--line)', overflowY: 'auto', padding: 'var(--s-5)', background: 'var(--bg-soft)' }}>
        <div className="row" style={{ marginBottom: 'var(--s-5)' }}>
          <I.Filter size={16}/>
          <span className="font-bold">Filters</span>
        </div>
        <FilterGroup label="Open now">
          <Toggle on={filters.openNow} onChange={v => setFilters({ ...filters, openNow: v })} />
        </FilterGroup>
        <FilterGroup label="Regulator-verified only">
          <Toggle on={filters.verified} onChange={v => setFilters({ ...filters, verified: v })} />
        </FilterGroup>
        <FilterGroup label={`Max distance: ${filters.maxDistance} km`}>
          <input type="range" min="1" max="20" value={filters.maxDistance}
            onChange={e => setFilters({ ...filters, maxDistance: +e.target.value })}
            style={{ width: '100%', accentColor: 'var(--brand)' }}/>
        </FilterGroup>
        <FilterGroup label="Minimum rating">
          <div className="row" style={{ gap: 4 }}>
            {[0,3,4,4.5].map(r => (
              <button key={r}
                onClick={() => setFilters({ ...filters, minRating: r })}
                className="chip" style={{
                  background: filters.minRating === r ? 'var(--brand)' : 'var(--bg-card)',
                  color: filters.minRating === r ? 'white' : 'var(--ink-2)',
                  border: '1px solid var(--line)', fontFamily: 'inherit', cursor: 'pointer',
                }}>{r === 0 ? 'Any' : `${r}+ ★`}</button>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup label="Insurance accepted">
          <div className="col" style={{ gap: 6 }}>
            {INSURERS.slice(0, 6).map(ins => (
              <label key={ins} className="row gap-2" style={{ cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={filters.insurance.includes(ins)} onChange={() => toggleIns(ins)} style={{ accentColor: 'var(--brand)' }}/>
                {ins}
              </label>
            ))}
            <button className="text-xs" style={{ background: 'none', border: 0, color: 'var(--brand-deep)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Show all {INSURERS.length} insurers</button>
          </div>
        </FilterGroup>
      </aside>

      {/* Results list */}
      <div style={{ overflowY: 'auto', padding: 'var(--s-5) var(--s-6)' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--s-4)', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
          <div>
            <div className="text-xs muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Results near you</div>
            <div className="font-bold text-2xl">{facilities.length} facilities</div>
          </div>
          <div className="row gap-2">
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--bg-card)', fontFamily: 'inherit', fontSize: 13 }}>
              <option value="distance">Sort: Nearest</option>
              <option value="rating">Sort: Highest rated</option>
              <option value="wait">Sort: Shortest wait</option>
            </select>
            <div className="card" style={{ padding: 2, display: 'flex', gap: 0 }}>
              {[['list', I.List], ['split', I.Map], ['map', I.Pin]].map(([id, Icon]) => (
                <button key={id} onClick={() => setView(id)}
                  style={{ border: 0, background: view === id ? 'var(--ink)' : 'transparent', color: view === id ? 'white' : 'var(--ink-2)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  <Icon size={14}/>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col gap-4">
          {facilities.map(f => (
            <FacilityCard key={f.id} f={f}
              hovered={hover === f.id}
              onHover={() => setHover(f.id)}
              onLeave={() => setHover(null)}
              onClick={() => { setState({ ...state, facilityId: f.id }); go('facility'); }} />
          ))}
        </div>
      </div>

      {/* Map */}
      {view !== 'list' && (
        <div className="map-stub" style={{ position: 'relative', overflow: 'hidden' }}>
          {facilities.map((f, i) => {
            const left = 15 + (i * 13) % 70;
            const top = 20 + (i * 21) % 60;
            return (
              <div key={f.id} className={`map-pin ${hover === f.id ? 'active' : ''}`} style={{ left: `${left}%`, top: `${top}%` }}
                onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)}
                onClick={() => { setState({ ...state, facilityId: f.id }); go('facility'); }}>
                <div className="pin-bubble">{f.rating} ★ · {f.distanceKm.toFixed(1)}km</div>
                <div className="pin-stem"/>
                <div className="pin-dot"/>
              </div>
            );
          })}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
            <span className="chip" style={{ background: 'white', boxShadow: 'var(--shadow-1)' }}>
              <I.Pin size={12}/> Westlands, Nairobi
            </span>
            <span className="chip muted" style={{ background: 'white', boxShadow: 'var(--shadow-1)' }}>OpenStreetMap · ★ pin = rating</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 'var(--s-5)' }}>
      <div className="text-xs font-semibold" style={{ marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 40, height: 22, borderRadius: 999, position: 'relative',
      background: on ? 'var(--brand)' : 'var(--line-strong)', border: 0, cursor: 'pointer', transition: 'background 0.15s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 18, height: 18, background: 'white', borderRadius: '50%',
        boxShadow: 'var(--shadow-1)', transition: 'left 0.15s',
      }}/>
    </button>
  );
}

function FacilityCard({ f, hovered, onHover, onLeave, onClick }) {
  return (
    <div className="card" onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}
      style={{
        padding: 'var(--s-4)', display: 'grid',
        gridTemplateColumns: '120px 1fr auto', gap: 'var(--s-4)',
        cursor: 'pointer', transition: 'all 0.15s',
        borderColor: hovered ? 'var(--brand)' : 'var(--line)',
        boxShadow: hovered ? 'var(--shadow-2)' : 'var(--shadow-1)',
      }}>
      <FacilityPhoto kind={f.photo} height={120}/>
      <div className="col gap-2">
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <VerifyBadge status={f.verified}/>
          {f.open ? <span className="chip ok"><I.Clock size={11}/> {f.openLabel}</span> : <span className="chip warn"><I.Clock size={11}/> {f.openLabel}</span>}
          <span className="chip muted"><I.Clock size={11}/> ~{f.waitMins}min wait</span>
        </div>
        <div>
          <div className="font-bold text-lg" style={{ marginBottom: 2 }}>{f.name}</div>
          <div className="text-sm muted">{f.type} · {f.address}</div>
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {f.insurance.slice(0, 5).map(ins => <span key={ins} className="chip muted" style={{ fontSize: 11 }}>{ins}</span>)}
          {f.insurance.length > 5 && <span className="text-xs muted">+{f.insurance.length - 5} more</span>}
        </div>
      </div>
      <div className="col" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'right' }}>
          <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
            <Stars rating={f.rating}/>
            <span className="font-bold">{f.rating}</span>
          </div>
          <div className="text-xs muted">{f.reviewCount} reviews · {f.distanceKm.toFixed(1)}km</div>
        </div>
        <div className="row gap-2">
          <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); window.open(`tel:${f.phone}`); }}><I.Phone size={12}/></button>
          <button className="btn ghost sm" onClick={(e) => e.stopPropagation()}><I.WhatsApp size={12}/></button>
          <button className="btn brand sm">View <I.ArrowRight size={12}/></button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 5. FACILITY DETAIL
// ============================================================
function FacilityDetail({ go, state }) {
  const f = FACILITIES.find(x => x.id === state.facilityId) || FACILITIES[0];
  const [tab, setTab] = React.useState('overview');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', height: '100%', overflow: 'hidden' }}>
      <div style={{ overflowY: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 5, borderBottom: '1px solid var(--line)', padding: 'var(--s-4) var(--s-6)' }}>
          <button className="btn ghost sm" onClick={() => go('results')}><I.ArrowLeft size={12}/> Back to results</button>
        </div>

        <div style={{ padding: 'var(--s-6)' }}>
          <FacilityPhoto kind={f.photo} height={240}/>
          <div className="row gap-2" style={{ marginTop: 'var(--s-5)', flexWrap: 'wrap' }}>
            <VerifyBadge status={f.verified}/>
            {f.open && <span className="chip ok"><I.Clock size={11}/> {f.openLabel}</span>}
            <span className="chip muted">{f.type}</span>
            <span className="chip muted">{f.ownership.replace('_', ' ')}</span>
          </div>
          <h1 className="text-3xl" style={{ marginTop: 'var(--s-3)', marginBottom: 'var(--s-2)' }}>{f.name}</h1>
          <div className="row gap-4 muted text-sm" style={{ flexWrap: 'wrap' }}>
            <span className="row gap-2"><I.Pin size={14}/> {f.address}</span>
            <span className="row gap-2"><I.Navigation size={14}/> {f.distanceKm.toFixed(1)}km away</span>
            <span className="row gap-2"><Stars rating={f.rating}/> {f.rating} ({f.reviewCount})</span>
          </div>

          {/* Tab bar */}
          <div className="row" style={{ marginTop: 'var(--s-6)', borderBottom: '1px solid var(--line)', gap: 0 }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'services', label: `Services (${f.services.length})` },
              { id: 'insurance', label: 'Insurance' },
              { id: 'reviews', label: `Reviews (${f.reviewCount})` },
              { id: 'hours', label: 'Hours & location' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  border: 0, background: 'transparent', padding: '12px 18px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
                  borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
                  marginBottom: -1,
                }}>{t.label}</button>
            ))}
          </div>

          <div style={{ paddingTop: 'var(--s-5)' }}>
            {tab === 'overview' && (
              <div className="col gap-6">
                <div>
                  <h3 className="text-lg" style={{ marginBottom: 8 }}>About</h3>
                  <p style={{ color: 'var(--ink-2)' }}>{f.name} is a {f.type.toLowerCase()} located in {f.subcounty}, {f.county}. {f.open ? `Currently open — ${f.openLabel.toLowerCase()}.` : `Currently closed — ${f.openLabel.toLowerCase()}.`} Typical wait time is around {f.waitMins} minutes.</p>
                </div>
                <div className="card" style={{ padding: 'var(--s-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--s-4)' }}>
                  <Stat label="Average wait" value={`${f.waitMins} min`}/>
                  <Stat label="Patient rating" value={`${f.rating} / 5`}/>
                  <Stat label="Insurers accepted" value={f.insurance.length}/>
                  <Stat label="Last verified" value="2 days ago"/>
                </div>
              </div>
            )}
            {tab === 'services' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--s-3)' }}>
                {f.services.map(s => (
                  <div key={s} className="card" style={{ padding: 'var(--s-4)' }}>
                    <div className="font-semibold">{s}</div>
                    <div className="text-xs muted" style={{ marginTop: 6 }}>From KSh {Math.floor(Math.random() * 4000 + 1000)}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'insurance' && (
              <div className="col gap-3">
                <div className="card" style={{ padding: 'var(--s-4)', background: 'var(--warn-soft)', borderColor: 'oklch(0.85 0.06 70)' }}>
                  <div className="row gap-2 font-semibold" style={{ marginBottom: 4 }}><I.Info size={14}/> Always confirm before your visit</div>
                  <div className="text-sm">Insurance acceptance can change. Call the facility to confirm coverage for your specific scheme and service.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                  {INSURERS.map(ins => {
                    const accepted = f.insurance.includes(ins.split(' ')[0].toUpperCase().replace('/', ''));
                    return (
                      <div key={ins} className="card" style={{ padding: 'var(--s-3)', opacity: accepted ? 1 : 0.5 }}>
                        <div className="row gap-2 text-sm">
                          {accepted ? <I.Check size={14} stroke={3} style={{ color: 'var(--ok)' }}/> : <I.X size={14} stroke={3} style={{ color: 'var(--ink-3)' }}/>}
                          <span style={{ fontWeight: accepted ? 600 : 400 }}>{ins}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {tab === 'reviews' && <ReviewsTab f={f} go={go}/>}
            {tab === 'hours' && (
              <div className="card" style={{ padding: 'var(--s-5)' }}>
                <h3 className="text-lg" style={{ marginBottom: 'var(--s-3)' }}>Operating hours</h3>
                <div className="col gap-2">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                    <div key={d} className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                      <span className="font-semibold">{d}</span>
                      <span className="mono text-sm">{i === 6 ? '09:00 – 14:00' : '08:00 – 20:00'}</span>
                    </div>
                  ))}
                </div>
                <div className="map-stub" style={{ height: 200, marginTop: 'var(--s-5)', borderRadius: 12 }}>
                  <div className="map-pin active" style={{ left: '50%', top: '50%' }}>
                    <div className="pin-bubble">{f.name.split(' ')[0]}</div>
                    <div className="pin-stem"/><div className="pin-dot"/>
                  </div>
                </div>
                <button className="btn brand" style={{ marginTop: 'var(--s-4)' }}>
                  <I.Navigation size={14}/> Get directions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar — sticky contact */}
      <aside style={{ borderLeft: '1px solid var(--line)', background: 'var(--bg-soft)', overflowY: 'auto', padding: 'var(--s-5)' }}>
        <div className="card" style={{ padding: 'var(--s-5)', position: 'sticky', top: 0 }}>
          <div className="text-xs muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--s-3)' }}>Contact this facility</div>
          <div className="col gap-2">
            <button className="btn brand block"><I.Phone size={14}/> Call {f.phone}</button>
            <button className="btn ghost block" style={{ background: 'oklch(0.94 0.05 150)', borderColor: 'oklch(0.85 0.08 150)', color: 'oklch(0.35 0.12 150)' }}>
              <I.WhatsApp size={14}/> WhatsApp
            </button>
            <button className="btn ghost block"><I.Mail size={14}/> Email</button>
            <button className="btn ghost block"><I.Navigation size={14}/> Directions</button>
          </div>
          <div className="divider" style={{ margin: 'var(--s-4) 0' }}/>
          <button className="btn block" onClick={() => go('booking')}>
            <I.Calendar size={14}/> Request appointment
          </button>
          <div className="text-xs muted" style={{ marginTop: 8, textAlign: 'center' }}>We'll coordinate the callback for you</div>

          <div className="divider" style={{ margin: 'var(--s-4) 0' }}/>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn ghost sm" style={{ flex: 1 }}><I.Heart size={12}/> Save</button>
            <button className="btn ghost sm" style={{ flex: 1 }}><I.Share size={12}/> Share</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs muted" style={{ letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div className="font-bold text-lg">{value}</div>
    </div>
  );
}

function ReviewsTab({ f, go }) {
  return (
    <div className="col gap-5">
      <div className="card" style={{ padding: 'var(--s-5)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--s-6)', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="text-4xl font-bold">{f.rating}</div>
          <Stars rating={f.rating} size={16}/>
          <div className="text-xs muted" style={{ marginTop: 4 }}>{f.reviewCount} reviews</div>
        </div>
        <div className="col gap-2">
          {[5,4,3,2,1].map(r => {
            const pct = r === Math.floor(f.rating) ? 60 : r === Math.floor(f.rating)+1 ? 25 : r === Math.floor(f.rating)-1 ? 10 : 3;
            return (
              <div key={r} className="row gap-2 text-sm">
                <span style={{ width: 12 }}>{r}</span>
                <I.Star size={11}/>
                <div style={{ flex: 1, height: 6, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'oklch(0.72 0.14 70)' }}/>
                </div>
                <span className="text-xs muted" style={{ width: 28, textAlign: 'right' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <button className="btn brand" onClick={() => go('review')} style={{ alignSelf: 'flex-start' }}>
        <I.Plus size={14}/> Write a review
      </button>

      {REVIEWS.map(r => (
        <div key={r.id} className="card" style={{ padding: 'var(--s-5)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--s-3)' }}>
            <div className="row gap-3">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{r.author[0]}</div>
              <div>
                <div className="font-semibold">{r.author}</div>
                <div className="text-xs muted">{r.date} · {r.service}</div>
              </div>
            </div>
            <Stars rating={r.rating}/>
          </div>
          <p style={{ color: 'var(--ink-2)', marginBottom: 'var(--s-3)' }}>{r.text}</p>
          <div className="row gap-2 text-xs" style={{ flexWrap: 'wrap' }}>
            {r.insurance === 'yes_fully' && <span className="chip ok">{r.provider} accepted fully</span>}
            {r.insurance === 'yes_partially' && <span className="chip warn">{r.provider} accepted partially</span>}
            {r.insurance === 'no' && <span className="chip muted">Paid cash</span>}
            <span className="chip muted">Cleanliness {r.aspects.cleanliness}/5</span>
            <span className="chip muted">Staff {r.aspects.staff}/5</span>
            <span className="chip muted">Wait {r.aspects.wait}/5</span>
          </div>
          <div className="row gap-3 text-xs muted" style={{ marginTop: 'var(--s-3)' }}>
            <button style={{ border: 0, background: 'none', color: 'var(--ink-2)', cursor: 'pointer', padding: 0 }}>👍 Helpful ({r.helpful})</button>
            <button style={{ border: 0, background: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 0 }}>Report</button>
          </div>
        </div>
      ))}
    </div>
  );
}

window.HC_SCREENS_2 = { Results, FacilityDetail };
