// HudumaCare — App shell, navigation, routing
const { useState, useEffect } = React;
const I = window.I;

const SCREENS = [
  { id: 'landing',    label: 'Landing',           group: 'patient', icon: 'Home' },
  { id: 'services',   label: 'Service selection', group: 'patient', icon: 'Grid' },
  { id: 'location',   label: 'Location capture',  group: 'patient', icon: 'MapPin' },
  { id: 'results',    label: 'Search results',    group: 'patient', icon: 'Search' },
  { id: 'facility',   label: 'Facility detail',   group: 'patient', icon: 'Building' },
  { id: 'review',     label: 'Write review',      group: 'patient', icon: 'Edit', badge: 'New' },
  { id: 'booking',    label: 'Booking request',   group: 'patient', icon: 'Calendar', badge: 'New' },
  { id: 'emergency',  label: 'Emergency triage',  group: 'safety',  icon: 'Cross' },
  { id: 'offline',    label: 'Offline fallback',  group: 'safety',  icon: 'CloudOff', badge: 'New' },
  { id: 'admin',      label: 'Admin dashboard',   group: 'facility', icon: 'Cog' },
];

const GROUP_LABELS = {
  patient:  'Patient flow',
  safety:   'Safety net',
  facility: 'Facility admin',
};

function App() {
  // Read screen from URL hash; default to landing
  const [screen, setScreen] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return SCREENS.find(s => s.id === h) ? h : 'landing';
  });
  const [appState, setAppState] = useState({
    service: null,
    locationMethod: 'gps',
    county: 'Nairobi',
    facilityId: 'aga-khan',
  });

  const go = (id, patch) => {
    if (patch) setAppState(s => ({ ...s, ...patch }));
    setScreen(id);
    window.location.hash = id;
    document.querySelector('.stage')?.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      if (SCREENS.find(s => s.id === h)) setScreen(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const S1 = window.HC_SCREENS_1;
  const S2 = window.HC_SCREENS_2;
  const S3 = window.HC_SCREENS_3;

  const screenProps = { go, state: appState, setState: setAppState };
  let body;
  switch (screen) {
    case 'landing':   body = <S1.Landing {...screenProps}/>; break;
    case 'services':  body = <S1.ServiceSelect {...screenProps}/>; break;
    case 'location':  body = <S1.LocationCapture {...screenProps}/>; break;
    case 'results':   body = <S2.Results {...screenProps}/>; break;
    case 'facility':  body = <S2.FacilityDetail {...screenProps}/>; break;
    case 'review':    body = <S3.WriteReview {...screenProps}/>; break;
    case 'booking':   body = <S3.Booking {...screenProps}/>; break;
    case 'emergency': body = <S3.Emergency {...screenProps}/>; break;
    case 'admin':     body = <S3.AdminDashboard {...screenProps}/>; break;
    case 'offline':   body = <S3.Offline {...screenProps}/>; break;
    default:          body = <S1.Landing {...screenProps}/>;
  }

  // Group screens for nav
  const grouped = {};
  SCREENS.forEach(s => {
    grouped[s.group] = grouped[s.group] || [];
    grouped[s.group].push(s);
  });

  return (
    <div className="app">
      <aside className="nav">
        <div className="nav-brand">
          <div className="nav-brand-mark">H+</div>
          <div>
            <div className="nav-brand-name">HudumaCare</div>
            <div className="nav-brand-sub">Redesign · v2</div>
          </div>
        </div>

        {Object.entries(grouped).map(([gid, items]) => (
          <React.Fragment key={gid}>
            <div className="nav-group">{GROUP_LABELS[gid]}</div>
            {items.map(s => {
              const Icon = I[s.icon] || I.Circle;
              return (
                <button key={s.id}
                  className={`nav-item${screen === s.id ? ' active' : ''}`}
                  onClick={() => go(s.id)}
                  data-screen-label={`${SCREENS.findIndex(x=>x.id===s.id)+1} ${s.label}`}>
                  <span className="icon"><Icon size={16}/></span>
                  <span className="label">{s.label}</span>
                  {s.badge && <span className="badge">{s.badge}</span>}
                </button>
              );
            })}
          </React.Fragment>
        ))}

        <div className="nav-footer">
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: 'oklch(0.85 0.015 250)' }}>About this redesign</strong>
          </div>
          Hi-fi clickable prototype exploring the refactored UX. See <span className="mono" style={{ background: 'oklch(0.25 0.02 250)', padding: '1px 5px', borderRadius: 4 }}>docs/</span> for the K8s + Temporal + refactor plan.
        </div>
      </aside>

      <main className="stage" data-screen-label={SCREENS.find(s=>s.id===screen)?.label}>
        {body}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
