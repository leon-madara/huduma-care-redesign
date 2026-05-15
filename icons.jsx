// SVG icons — single-source, no dependency
const I = {};

const _ico = (path, opts = {}) => ({ size = 18, stroke = 2, ...p } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    {...p}>{path}</svg>
);

I.Home = _ico(<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>);
I.Compass = _ico(<><circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6 6-2z"/></>);
I.Pin = _ico(<><path d="M12 22s-7-7.5-7-13a7 7 0 1114 0c0 5.5-7 13-7 13z"/><circle cx="12" cy="9" r="2.5"/></>);
I.List = _ico(<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>);
I.Map = _ico(<><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></>);
I.Building = _ico(<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01"/></>);
I.Star = _ico(<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>);
I.Cross = _ico(<><path d="M12 4v16M4 12h16"/></>);
I.Calendar = _ico(<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>);
I.Cog = _ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></>);
I.Wifi = _ico(<><path d="M5 12a10 10 0 0114 0M8.5 15a6 6 0 017 0M2 9a15 15 0 0120 0"/><circle cx="12" cy="18" r="0.5" fill="currentColor"/></>);
I.Phone = _ico(<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>);
I.WhatsApp = _ico(<><path d="M21 12a9 9 0 11-3.6-7.2l3.6-1.3-1.3 3.6A9 9 0 0121 12z"/><path d="M9 9c0 4 3 7 7 7"/></>);
I.Mail = _ico(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></>);
I.Shield = _ico(<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>);
I.Check = _ico(<path d="M4 12l5 5L20 6"/>);
I.Clock = _ico(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>);
I.Search = _ico(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>);
I.Filter = _ico(<path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>);
I.Chevron = _ico(<path d="M9 6l6 6-6 6"/>);
I.Heart = _ico(<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/>);
I.Share = _ico(<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></>);
I.User = _ico(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></>);
I.Bolt = _ico(<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>);
I.Lab = _ico(<><path d="M9 2v6L3 20a2 2 0 002 2h14a2 2 0 002-2L15 8V2"/><path d="M7 2h10"/></>);
I.Tooth = _ico(<path d="M12 2c-3 0-5 2-7 2C3 4 3 8 4 11s2 5 3 8c.5 1.5 1.5 2 2 2 1.5 0 1.5-3 3-3s1.5 3 3 3c.5 0 1.5-.5 2-2 1-3 2-5 3-8s1-7-1-7c-2 0-4-2-7-2z"/>);
I.Baby = _ico(<><circle cx="12" cy="8" r="4"/><path d="M5 22c0-4 3-7 7-7s7 3 7 7"/></>);
I.Pill = _ico(<><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="M12 5l6 10"/></>);
I.Stethoscope = _ico(<><path d="M5 3v6a4 4 0 008 0V3"/><path d="M9 13v3a5 5 0 0010 0v-2"/><circle cx="19" cy="11" r="2"/></>);
I.X = _ico(<><path d="M18 6L6 18M6 6l12 12"/></>);
I.ArrowRight = _ico(<><path d="M5 12h14M13 6l6 6-6 6"/></>);
I.ArrowLeft = _ico(<><path d="M19 12H5M11 6l-6 6 6 6"/></>);
I.Navigation = _ico(<path d="M3 11l18-8-8 18-2-8-8-2z"/>);
I.Edit = _ico(<><path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-11 11H7v-4L18 2z"/></>);
I.Plus = _ico(<><path d="M12 5v14M5 12h14"/></>);
I.Info = _ico(<><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></>);
I.Refresh = _ico(<><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 21v-5h5"/></>);
I.Cloud = _ico(<path d="M18 19H6a4 4 0 010-8 6 6 0 0111.4-2A4 4 0 0118 19z"/>);
I.CloudOff = _ico(<><path d="M3 3l18 18"/><path d="M18 19H6a4 4 0 01-1.4-7.8M10 5.5A6 6 0 0117.4 9 4 4 0 0120 16.4"/></>);

I.Grid = _ico(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>);
I.MapPin = I.Pin;
I.Circle = _ico(<circle cx="12" cy="12" r="9"/>);

window.I = I;
