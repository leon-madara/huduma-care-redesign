// HudumaCare — Review form, Emergency, Admin, Booking, Offline
const { FACILITIES, SERVICE_CATS, INSURERS, REVIEWS } = window.HC_DATA;
const { Stars, VerifyBadge, FacilityPhoto } = window.HC_SCREENS_1;
const I = window.I;

// ============================================================
// 6. WRITE REVIEW
// ============================================================
function WriteReview({ go, state }) {
  const f = FACILITIES.find(x => x.id === state.facilityId) || FACILITIES[0];
  const [rating, setRating] = React.useState(0);
  const [aspects, setAspects] = React.useState({ cleanliness: 0, staff: 0, wait: 0, value: 0 });
  const [insAcc, setInsAcc] = React.useState('');
  const [text, setText] = React.useState('');
  const [step, setStep] = React.useState(1);

  if (step === 'done') {
    return (
      <div className="page page-narrow">
        <div className="card" style={{ padding: 'var(--s-10)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center', margin: '0 auto var(--s-4)' }}>
            <I.Check size={28} stroke={3}/>
          </div>
          <h2 className="text-2xl" style={{ marginBottom: 'var(--s-2)' }}>Thanks — review submitted</h2>
          <p className="muted" style={{ marginBottom: 'var(--s-6)' }}>It will appear after moderation (usually within a few hours).</p>
          <button className="btn brand" onClick={() => go('facility')}>Back to facility</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Step {step} of 3 · {f.name}</div>
          <h1 className="page-title">Share your experience</h1>
          <p className="page-sub">Help other patients make confident decisions. Reviews are moderated for safety.</p>
        </div>
      </div>

      {step === 1 && (
        <div className="card" style={{ padding: 'var(--s-6)' }}>
          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-2)' }}>Overall rating</div>
          <div className="row gap-1" style={{ marginBottom: 'var(--s-6)' }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                style={{ border: 0, background: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill={n <= rating ? 'oklch(0.72 0.14 70)' : 'oklch(0.9 0.008 85)'}>
                  <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>
                </svg>
              </button>
            ))}
          </div>
          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-2)' }}>What service did you receive?</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 'var(--s-6)' }}>
            {f.services.map(s => (
              <span key={s} className="chip muted" style={{ cursor: 'pointer' }}>{s}</span>
            ))}
          </div>
          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-2)' }}>When did you visit?</div>
          <input type="date" defaultValue="2026-04-15"
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line-strong)', fontFamily: 'inherit', fontSize: 14, marginBottom: 'var(--s-6)' }}/>
          <button className="btn brand" disabled={!rating} onClick={() => setStep(2)} style={{ opacity: rating ? 1 : 0.5 }}>Continue <I.ArrowRight size={14}/></button>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ padding: 'var(--s-6)' }}>
          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-3)' }}>Rate specific aspects</div>
          <div className="col gap-4" style={{ marginBottom: 'var(--s-6)' }}>
            {[['cleanliness','Cleanliness'],['staff','Staff & friendliness'],['wait','Wait time'],['value','Value for money']].map(([k,l]) => (
              <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                <span className="text-sm">{l}</span>
                <div className="row gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setAspects({ ...aspects, [k]: n })}
                      style={{ border: 0, background: 'none', cursor: 'pointer', padding: 2 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={n <= aspects[k] ? 'oklch(0.72 0.14 70)' : 'oklch(0.9 0.008 85)'}>
                        <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-2)' }}>Was your insurance accepted?</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 'var(--s-6)' }}>
            {[['yes_fully','Yes — fully'],['yes_partially','Yes — partially'],['no','No'],['na','N/A — paid cash']].map(([v,l]) => (
              <button key={v} onClick={() => setInsAcc(v)} className="chip"
                style={{
                  background: insAcc === v ? 'var(--brand)' : 'var(--bg-soft)',
                  color: insAcc === v ? 'white' : 'var(--ink-2)',
                  border: '1px solid var(--line)', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 14px',
                }}>{l}</button>
            ))}
          </div>

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button className="btn ghost" onClick={() => setStep(1)}><I.ArrowLeft size={14}/> Back</button>
            <button className="btn brand" onClick={() => setStep(3)}>Continue <I.ArrowRight size={14}/></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ padding: 'var(--s-6)' }}>
          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-2)' }}>Tell others about your visit</div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
            placeholder="What was good? What could be better? Be specific and respectful — share details that help others decide."
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--line-strong)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', marginBottom: 'var(--s-3)' }}/>
          <div className="text-xs muted" style={{ marginBottom: 'var(--s-5)' }}>{text.length} / 1000 · Anonymous by default · No personal medical details please</div>

          <label className="row gap-2 text-sm" style={{ marginBottom: 'var(--s-5)' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }}/>
            Post anonymously
          </label>

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button className="btn ghost" onClick={() => setStep(2)}><I.ArrowLeft size={14}/> Back</button>
            <button className="btn brand" onClick={() => setStep('done')}>Submit review</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 7. EMERGENCY TRIAGE
// ============================================================
function Emergency({ go }) {
  return (
    <div className="page" style={{ paddingTop: 'var(--s-6)' }}>
      <div className="card" style={{
        padding: 'var(--s-6)', background: 'oklch(0.97 0.04 25)',
        borderColor: 'var(--urgent)', borderWidth: 2, marginBottom: 'var(--s-6)',
      }}>
        <div className="row gap-3" style={{ marginBottom: 'var(--s-3)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--urgent)', color: 'white', display: 'grid', placeItems: 'center' }}>
            <I.Cross size={24} stroke={3}/>
          </div>
          <div>
            <div className="font-bold text-2xl">Life-threatening emergency?</div>
            <div className="muted">Call now. Don't wait for the app.</div>
          </div>
        </div>
        <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
          <a href="tel:999" className="btn urgent lg" style={{ fontSize: 18 }}>
            <I.Phone size={18}/> Call 999 (Police / Ambulance)
          </a>
          <a href="tel:112" className="btn urgent lg" style={{ fontSize: 18 }}>
            <I.Phone size={18}/> Call 112 (Emergency)
          </a>
          <a href="tel:0800720021" className="btn ghost lg">
            <I.Phone size={18}/> Red Cross — 0800 720 021
          </a>
        </div>
        <div className="text-xs muted" style={{ marginTop: 'var(--s-4)' }}>
          Signs that need immediate help: chest pain, severe bleeding, difficulty breathing, stroke symptoms (face droop, arm weakness, slurred speech), seizures, loss of consciousness.
        </div>
      </div>

      <div>
        <div className="page-eyebrow">Not life-threatening but urgent?</div>
        <h2 className="text-2xl" style={{ marginBottom: 'var(--s-3)' }}>Nearest 24-hour emergency rooms</h2>
        <div className="col gap-3">
          {FACILITIES.filter(f => f.services.includes('Emergency 24/7') || f.services.includes('Emergency')).slice(0, 4).map(f => (
            <div key={f.id} className="card" style={{ padding: 'var(--s-4)', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--s-4)', alignItems: 'center' }}>
              <div>
                <div className="font-bold">{f.name}</div>
                <div className="text-sm muted">{f.address} · {f.distanceKm.toFixed(1)}km · ~{f.waitMins}min triage wait</div>
              </div>
              <a href={`tel:${f.phone}`} className="btn urgent"><I.Phone size={14}/> Call</a>
              <button className="btn ghost"><I.Navigation size={14}/> Directions</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 8. ADMIN / FACILITY DASHBOARD
// ============================================================
function AdminDashboard({ go }) {
  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Facility admin · Aga Khan University Hospital</div>
          <h1 className="page-title">Your listing dashboard</h1>
          <p className="page-sub">Verified 2 days ago. Information you update here is live within 5 minutes.</p>
        </div>
        <div className="row gap-2">
          <span className="chip ok"><I.Shield size={11}/> Regulator-verified</span>
          <button className="btn ghost"><I.Cog size={14}/> Settings</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--s-4)', marginBottom: 'var(--s-6)' }}>
        <KpiCard label="Profile views" value="2,184" delta="+18% this week"/>
        <KpiCard label="Direct calls" value="312" delta="+12% this week"/>
        <KpiCard label="WhatsApp inquiries" value="148" delta="+24% this week"/>
        <KpiCard label="Avg. rating" value="4.6 ★" delta="3 new reviews"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 'var(--s-5)' }}>
        <div className="col gap-4">
          <div className="card" style={{ padding: 'var(--s-5)' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--s-4)' }}>
              <h3 className="text-lg">Pending actions</h3>
              <span className="chip warn">3 items</span>
            </div>
            <div className="col gap-2">
              {[
                { t: '3 community corrections waiting', d: 'Patients suggested phone, hours, insurance changes', a: 'Review' },
                { t: 'License expires in 28 days', d: 'Renew your KMHFR license before May 30', a: 'Renew' },
                { t: '2 unanswered reviews', d: 'Reply privately or publicly to build trust', a: 'Reply' },
              ].map((x, i) => (
                <div key={i} className="row" style={{ justifyContent: 'space-between', padding: 'var(--s-3)', background: 'var(--bg-soft)', borderRadius: 'var(--r-md)' }}>
                  <div>
                    <div className="font-semibold text-sm">{x.t}</div>
                    <div className="text-xs muted">{x.d}</div>
                  </div>
                  <button className="btn sm ghost">{x.a}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--s-5)' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--s-4)' }}>
              <h3 className="text-lg">Listing freshness</h3>
              <span className="text-xs muted">Auto-verified weekly by our system</span>
            </div>
            <div className="col gap-3">
              {[
                ['Contact info', 100, 'Verified 2 days ago'],
                ['Operating hours', 95, 'Verified 5 days ago'],
                ['Insurance acceptance', 78, 'Last verified 3 weeks ago — refresh recommended'],
                ['Services & prices', 60, 'Pricing data is incomplete'],
                ['Photos', 40, 'Add 3+ photos to improve discoverability'],
              ].map(([label, pct, hint]) => (
                <div key={label}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-xs muted">{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--line)', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--ok)' : pct > 50 ? 'var(--warn)' : 'var(--urgent)' }}/>
                  </div>
                  <div className="text-xs muted">{hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--s-5)' }}>
            <h3 className="text-lg" style={{ marginBottom: 'var(--s-3)' }}>Recent activity</h3>
            <div className="col gap-2 text-sm">
              {[
                ['just now', 'Wanjiru K. left a 5-star review (Maternity)'],
                ['2h ago', 'Sync from KMHFR — no changes detected'],
                ['Today 09:14', 'Hours auto-confirmed via SMS callback'],
                ['Yesterday', 'New WhatsApp inquiry from +254 7… 4421'],
                ['2 days ago', 'James M. left a 4-star review'],
              ].map(([t, d], i) => (
                <div key={i} className="row" style={{ gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <span className="text-xs muted mono" style={{ width: 90 }}>{t}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col gap-4">
          <div className="card" style={{ padding: 'var(--s-5)' }}>
            <h3 className="text-lg" style={{ marginBottom: 'var(--s-3)' }}>Quick edits</h3>
            <div className="col gap-2">
              <button className="btn ghost block" style={{ justifyContent: 'flex-start' }}><I.Edit size={14}/> Update hours</button>
              <button className="btn ghost block" style={{ justifyContent: 'flex-start' }}><I.Edit size={14}/> Manage insurance acceptance</button>
              <button className="btn ghost block" style={{ justifyContent: 'flex-start' }}><I.Edit size={14}/> Services & prices</button>
              <button className="btn ghost block" style={{ justifyContent: 'flex-start' }}><I.Edit size={14}/> Photos</button>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--s-5)' }}>
            <h3 className="text-lg" style={{ marginBottom: 'var(--s-2)' }}>Booking requests</h3>
            <div className="text-xs muted" style={{ marginBottom: 'var(--s-3)' }}>4 awaiting your confirmation</div>
            <div className="col gap-2">
              {[
                ['Mary A.', 'Tomorrow 10:00 · Antenatal'],
                ['Peter K.', 'Thu 14:30 · GP consult'],
                ['Anonymous', 'Fri 09:00 · Lab — FBC'],
              ].map(([n, d], i) => (
                <div key={i} className="row" style={{ justifyContent: 'space-between', padding: 'var(--s-3)', background: 'var(--bg-soft)', borderRadius: 'var(--r-md)' }}>
                  <div>
                    <div className="font-semibold text-sm">{n}</div>
                    <div className="text-xs muted">{d}</div>
                  </div>
                  <div className="row gap-1">
                    <button className="btn sm brand">Accept</button>
                    <button className="btn sm ghost"><I.X size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta }) {
  return (
    <div className="card" style={{ padding: 'var(--s-4)' }}>
      <div className="text-xs muted" style={{ letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs" style={{ color: 'var(--ok)', marginTop: 4 }}>{delta}</div>
    </div>
  );
}

// ============================================================
// 9. BOOKING — appointment request
// ============================================================
function Booking({ go, state }) {
  const f = FACILITIES.find(x => x.id === state.facilityId) || FACILITIES[0];
  const [date, setDate] = React.useState(null);
  const [slot, setSlot] = React.useState(null);
  const [submitted, setSubmitted] = React.useState(false);
  const dates = ['Mon 5', 'Tue 6', 'Wed 7', 'Thu 8', 'Fri 9', 'Sat 10'];
  const slots = ['08:30', '09:15', '10:00', '11:30', '14:00', '15:45', '16:30'];

  if (submitted) {
    return (
      <div className="page page-narrow">
        <div className="card" style={{ padding: 'var(--s-10)', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'grid', placeItems: 'center', margin: '0 auto var(--s-4)' }}>
            <I.Calendar size={28}/>
          </div>
          <h2 className="text-2xl" style={{ marginBottom: 'var(--s-2)' }}>Request sent</h2>
          <p className="muted" style={{ marginBottom: 'var(--s-3)', maxWidth: '40ch', margin: '0 auto var(--s-6)' }}>
            We've forwarded your request to <strong>{f.name}</strong>. You'll receive an SMS confirmation within ~30 minutes. If we don't hear back, we'll call them on your behalf.
          </p>
          <div className="card" style={{ padding: 'var(--s-4)', background: 'var(--bg-soft)', textAlign: 'left', maxWidth: 400, margin: '0 auto var(--s-6)' }}>
            <div className="text-xs muted">Reference</div>
            <div className="mono font-bold">HC-2026-04839</div>
            <div className="divider" style={{ margin: '8px 0' }}/>
            <div className="text-sm">{date} at {slot} · {f.name}</div>
          </div>
          <button className="btn brand" onClick={() => go('facility')}>Back to facility</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Appointment request · {f.name}</div>
          <h1 className="page-title">When works for you?</h1>
          <p className="page-sub">We coordinate with the facility — you don't need to call them yourself. Free service.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--s-5)', marginBottom: 'var(--s-4)' }}>
        <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-3)' }}>Pick a day</div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {dates.map(d => (
            <button key={d} onClick={() => setDate(d)} className="chip"
              style={{
                background: date === d ? 'var(--ink)' : 'var(--bg-soft)',
                color: date === d ? 'white' : 'var(--ink-2)',
                border: '1px solid var(--line)', padding: '10px 16px', cursor: 'pointer', fontFamily: 'inherit',
              }}>{d}</button>
          ))}
        </div>
      </div>

      {date && (
        <div className="card" style={{ padding: 'var(--s-5)', marginBottom: 'var(--s-4)' }}>
          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-3)' }}>Available slots — {date}</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {slots.map(s => (
              <button key={s} onClick={() => setSlot(s)} className="chip mono"
                style={{
                  background: slot === s ? 'var(--brand)' : 'var(--bg-soft)',
                  color: slot === s ? 'white' : 'var(--ink-2)',
                  border: '1px solid var(--line)', padding: '10px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {slot && (
        <div className="card" style={{ padding: 'var(--s-5)', marginBottom: 'var(--s-4)' }}>
          <div className="text-sm font-semibold" style={{ marginBottom: 'var(--s-3)' }}>Your details</div>
          <div className="col gap-3">
            <input placeholder="Your name" defaultValue="Naomi W." style={{ padding: 12, borderRadius: 8, border: '1px solid var(--line-strong)', fontFamily: 'inherit' }}/>
            <input placeholder="Phone (we'll SMS confirmation)" defaultValue="+254 712 345 678" style={{ padding: 12, borderRadius: 8, border: '1px solid var(--line-strong)', fontFamily: 'inherit' }}/>
            <select style={{ padding: 12, borderRadius: 8, border: '1px solid var(--line-strong)', fontFamily: 'inherit', background: 'white' }}>
              <option>Service: General consultation</option>
              {f.services.map(s => <option key={s}>{`Service: ${s}`}</option>)}
            </select>
            <textarea placeholder="Brief reason for visit (optional)" rows={3}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--line-strong)', fontFamily: 'inherit', resize: 'vertical' }}/>
          </div>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button className="btn ghost" onClick={() => go('facility')}><I.ArrowLeft size={14}/> Cancel</button>
        <button className="btn brand" disabled={!slot} onClick={() => setSubmitted(true)} style={{ opacity: slot ? 1 : 0.4 }}>
          Send request
        </button>
      </div>

      <div className="card" style={{ padding: 'var(--s-3) var(--s-4)', marginTop: 'var(--s-4)', background: 'var(--bg-soft)', boxShadow: 'none' }}>
        <div className="text-xs muted row gap-2"><I.Info size={12}/> Powered by Temporal workflows — if the facility doesn't respond in 30 min, we retry, then escalate to our coordination team.</div>
      </div>
    </div>
  );
}

// ============================================================
// 10. OFFLINE FALLBACK
// ============================================================
function Offline({ go }) {
  return (
    <div className="page page-narrow">
      <div className="card" style={{ padding: 'var(--s-8)', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--warn-soft)', color: 'oklch(0.4 0.13 60)', display: 'grid', placeItems: 'center', margin: '0 auto var(--s-4)' }}>
          <I.CloudOff size={32}/>
        </div>
        <h2 className="text-2xl" style={{ marginBottom: 'var(--s-2)' }}>You're offline</h2>
        <p className="muted" style={{ marginBottom: 'var(--s-6)' }}>Don't worry — these features still work without internet:</p>

        <div className="col gap-2" style={{ textAlign: 'left', marginBottom: 'var(--s-6)' }}>
          {[
            ['Facilities you visited in the last 30 days', 24],
            ['Saved facilities', 5],
            ['Cached emergency contacts', 'Always'],
            ['Service categories & insurance info', 'Always'],
          ].map(([label, count]) => (
            <div key={label} className="card" style={{ padding: 'var(--s-3) var(--s-4)', background: 'var(--bg-soft)', boxShadow: 'none' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="row gap-2 text-sm font-semibold"><I.Check size={14} stroke={3} style={{ color: 'var(--ok)' }}/> {label}</span>
                <span className="text-xs muted">{count}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="row" style={{ gap: 'var(--s-2)', justifyContent: 'center' }}>
          <button className="btn brand" onClick={() => go('results')}>Browse cached facilities</button>
          <button className="btn ghost" onClick={() => go('emergency')}><I.Cross size={14}/> Emergency contacts</button>
        </div>

        <div className="divider" style={{ margin: 'var(--s-6) 0' }}/>
        <div className="text-xs muted" style={{ marginBottom: 8 }}>Need to reach a facility?</div>
        <div className="text-sm">SMS <strong className="mono">FIND</strong> + service + county to <strong className="mono">22829</strong></div>
        <div className="text-xs muted" style={{ marginTop: 4 }}>Example: FIND maternity Nakuru — works on any phone, no data needed.</div>
      </div>
    </div>
  );
}

window.HC_SCREENS_3 = { WriteReview, Emergency, AdminDashboard, Booking, Offline };
