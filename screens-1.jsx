// HudumaCare — Screen components (uses window.HC_DATA, window.I)
const { FACILITIES, SERVICE_CATS, INSURERS, REVIEWS } = window.HC_DATA;
const I = window.I;

// ---------- Shared bits ----------
function Stars({ rating, size = 14 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="row" style={{ gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= full || (n === full + 1 && half) ? 'oklch(0.72 0.14 70)' : 'oklch(0.9 0.008 85)'}>
          <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>
        </svg>
      ))}
    </div>
  );
}

function VerifyBadge({ status }) {
  const map = {
    regulator_verified: { label: 'Regulator-verified', cls: 'ok' },
    facility_claimed: { label: 'Facility-claimed', cls: 'chip' },
    community_verified: { label: 'Community-verified', cls: 'muted' },
    unverified: { label: 'Unverified', cls: 'warn' },
  };
  const m = map[status] || map.unverified;
  return <span className={`chip ${m.cls === 'chip' ? '' : m.cls}`} style={{ gap: 4 }}><I.Shield size={11}/> {m.label}</span>;
}

function FacilityPhoto({ kind, height = 120 }) {
  const label = { hospital: 'Hospital photo', lab: 'Lab photo', clinic: 'Clinic photo', pharmacy: 'Pharmacy photo' }[kind] || 'Facility photo';
  return <div className="ph-img" style={{ height, borderRadius: 'var(--r-md)' }}>{label}</div>;
}

// ============================================================
// 1. LANDING
// ============================================================
function Landing({ go }) {
  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 'var(--s-12)', alignItems: 'center', minHeight: '70vh' }}>
        <div>
          <div className="chip ok" style={{ marginBottom: 'var(--s-5)' }}><I.Check size={12}/> 500+ verified facilities across Kenya</div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.02, marginBottom: 'var(--s-5)' }}>
            Find a clinic you can <span style={{ color: 'var(--brand)' }}>trust</span> — before you need it.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: '52ch', marginBottom: 'var(--s-8)' }}>
            Compare hospitals, labs, and specialists by services, insurance acceptance, and real patient reviews. Free to use, updated daily.
          </p>
          <div className="row" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
            <button className="btn brand lg" onClick={() => go('select')}>
              Start your search <I.ArrowRight size={16}/>
            </button>
            <button className="btn ghost lg" onClick={() => go('emergency')}>
              <I.Cross size={16}/> Emergency triage
            </button>
          </div>
          <div className="row" style={{ gap: 'var(--s-6)', marginTop: 'var(--s-8)', flexWrap: 'wrap', color: 'var(--ink-2)', fontSize: 13 }}>
            <span className="row gap-2"><I.Shield size={14}/> Cross-checked with KMHFR</span>
            <span className="row gap-2"><I.Refresh size={14}/> Hours verified weekly</span>
            <span className="row gap-2"><I.Wifi size={14}/> Works offline</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--s-6)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
          <div className="text-xs muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quick search</div>
          <div className="card" style={{ padding: 'var(--s-3) var(--s-4)', display: 'flex', alignItems: 'center', gap: 'var(--s-3)', boxShadow: 'none', borderColor: 'var(--line-strong)' }}>
            <I.Search size={18}/>
            <input placeholder="Maternity, dental, MRI…" style={{ border: 0, outline: 0, background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'inherit' }} />
          </div>
          <div className="card" style={{ padding: 'var(--s-3) var(--s-4)', display: 'flex', alignItems: 'center', gap: 'var(--s-3)', boxShadow: 'none', borderColor: 'var(--line-strong)' }}>
            <I.Pin size={18}/>
            <span style={{ flex: 1, fontSize: 14 }}>Westlands, Nairobi</span>
            <button className="btn sm ghost" style={{ padding: '4px 10px' }}><I.Navigation size={12}/> Use GPS</button>
          </div>
          <div>
            <div className="text-xs muted" style={{ marginBottom: 8 }}>Popular right now</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Lab tests', 'Maternity', 'Dental', 'NHIF accepted', 'Open now'].map(t => (
                <span key={t} className="chip muted" style={{ cursor: 'pointer' }}>{t}</span>
              ))}
            </div>
          </div>
          <button className="btn brand block" onClick={() => go('select')}>Find facilities</button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 'var(--s-16)' }}>
        <div className="page-eyebrow">How it works</div>
        <h2 className="text-3xl" style={{ marginBottom: 'var(--s-6)' }}>Three steps. No phone tag.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--s-5)' }}>
          {[
            { n: '01', t: 'Tell us what you need', d: 'Pick a service — labs, maternity, dental, specialist. Add your location or use GPS.' },
            { n: '02', t: 'Compare on what matters', d: 'See verified hours, insurance acceptance, distance, and patient reviews side-by-side.' },
            { n: '03', t: 'Contact directly', d: 'Call, WhatsApp, email, or get directions. Or request a callback and we handle the rest.' },
          ].map(s => (
            <div key={s.n} className="card" style={{ padding: 'var(--s-6)' }}>
              <div className="mono text-xs" style={{ color: 'var(--brand)', marginBottom: 'var(--s-3)' }}>{s.n}</div>
              <h3 className="text-lg" style={{ marginBottom: 6 }}>{s.t}</h3>
              <p className="muted text-sm" style={{ margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 2. SERVICE SELECTION
// ============================================================
function ServiceSelect({ go, state, setState }) {
  const picked = state.service;
  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Step 1 of 3</div>
          <h1 className="page-title">What kind of care do you need?</h1>
          <p className="page-sub">Pick one to start. You can add filters and other services later.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--s-4)' }}>
        {SERVICE_CATS.map(s => {
          const Icon = I[s.icon] || I.Stethoscope;
          const active = picked === s.id;
          return (
            <button key={s.id} className="card"
              onClick={() => setState({ ...state, service: s.id })}
              style={{
                padding: 'var(--s-5)', textAlign: 'left', cursor: 'pointer',
                border: active ? '2px solid var(--brand)' : '1px solid var(--line)',
                background: active ? 'var(--brand-soft)' : 'var(--bg-card)',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: active ? 'var(--brand)' : 'var(--bg-soft)', color: active ? 'white' : 'var(--ink)', display: 'grid', placeItems: 'center', marginBottom: 'var(--s-3)' }}>
                <Icon size={20}/>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
              <div className="text-xs muted">{s.sub}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'var(--s-8)' }}>
        <div className="text-sm muted" style={{ marginBottom: 'var(--s-3)' }}>Or search by symptom or test</div>
        <div className="card" style={{ padding: 'var(--s-3) var(--s-4)', display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
          <I.Search size={18}/>
          <input placeholder="chest pain, ultrasound, full blood count…"
            style={{ border: 0, outline: 0, background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'inherit' }} />
        </div>
      </div>

      <div className="row" style={{ marginTop: 'var(--s-10)', justifyContent: 'space-between' }}>
        <button className="btn ghost" onClick={() => go('landing')}><I.ArrowLeft size={14}/> Back</button>
        <button className="btn brand" disabled={!picked} onClick={() => go('location')}
          style={{ opacity: picked ? 1 : 0.5 }}>
          Continue <I.ArrowRight size={14}/>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 3. LOCATION CAPTURE
// ============================================================
function LocationCapture({ go, state, setState }) {
  const [tab, setTab] = React.useState(state.locationMethod || 'gps');
  const [county, setCounty] = React.useState(state.county || 'Nairobi');
  const [permState, setPermState] = React.useState('idle'); // idle | granted

  const finish = () => {
    setState({ ...state, locationMethod: tab, county, located: true });
    go('results');
  };

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Step 2 of 3</div>
          <h1 className="page-title">Where should we look?</h1>
          <p className="page-sub">We'll only use this to rank facilities by distance. Your location is never stored.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--s-2)', marginBottom: 'var(--s-5)', display: 'inline-flex', gap: 4 }}>
        {[
          { id: 'gps', label: 'Use my GPS', icon: 'Navigation' },
          { id: 'manual', label: 'Type address', icon: 'Edit' },
          { id: 'county', label: 'Pick county', icon: 'Map' },
        ].map(t => {
          const Icon = I[t.icon];
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                border: 0, background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'white' : 'var(--ink-2)',
                padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
              }}>
              <Icon size={14}/> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'gps' && (
        <div className="card" style={{ padding: 'var(--s-6)' }}>
          {permState === 'idle' ? (
            <div className="col gap-4">
              <div className="row gap-4">
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'grid', placeItems: 'center' }}>
                  <I.Navigation size={24}/>
                </div>
                <div>
                  <div className="font-bold text-lg">Find facilities near me</div>
                  <div className="muted text-sm">We'll ask your browser for one-time location access. We do not save it.</div>
                </div>
              </div>
              <button className="btn brand" onClick={() => setPermState('granted')}>
                Share my location once
              </button>
              <div className="text-xs muted">Tip: works offline once a county has been cached.</div>
            </div>
          ) : (
            <div className="col gap-3">
              <div className="chip ok"><I.Check size={12}/> Location detected</div>
              <div className="font-bold text-lg">Westlands, Nairobi</div>
              <div className="muted text-sm">±25 m accuracy · GPS</div>
              <div className="row gap-2">
                <button className="btn brand" onClick={finish}>Continue with this location</button>
                <button className="btn ghost" onClick={() => setPermState('idle')}>Pick a different place</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'manual' && (
        <div className="card" style={{ padding: 'var(--s-6)' }}>
          <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: 6 }}>Address or neighborhood</label>
          <div className="card" style={{ padding: '10px 14px', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--s-3)' }}>
            <I.Pin size={16}/>
            <input defaultValue="Sarit Centre, Westlands" placeholder="e.g. Yaya Centre, Kilimani"
              style={{ border: 0, outline: 0, background: 'transparent', flex: 1, fontSize: 15, fontFamily: 'inherit' }}/>
          </div>
          <div className="text-xs muted" style={{ marginBottom: 'var(--s-4)' }}>We'll geocode this on the server.</div>
          <button className="btn brand" onClick={finish}>Search from here</button>
        </div>
      )}

      {tab === 'county' && (
        <div className="card" style={{ padding: 'var(--s-6)' }}>
          <div className="text-sm font-semibold" style={{ marginBottom: 8 }}>County</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 'var(--s-5)' }}>
            {['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Kiambu','Machakos','Kajiado','Kilifi','Kakamega'].map(c => (
              <button key={c} onClick={() => setCounty(c)}
                className="chip"
                style={{
                  background: county === c ? 'var(--brand)' : 'var(--bg-soft)',
                  color: county === c ? 'white' : 'var(--ink-2)',
                  border: '1px solid var(--line)',
                  padding: '8px 12px', justifyContent: 'center', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>{c}</button>
            ))}
          </div>
          <button className="btn brand" onClick={finish}>Browse {county}</button>
        </div>
      )}

      <div className="row" style={{ marginTop: 'var(--s-8)', justifyContent: 'space-between' }}>
        <button className="btn ghost" onClick={() => go('select')}><I.ArrowLeft size={14}/> Back</button>
      </div>
    </div>
  );
}

window.HC_SCREENS_1 = { Landing, ServiceSelect, LocationCapture, Stars, VerifyBadge, FacilityPhoto };
