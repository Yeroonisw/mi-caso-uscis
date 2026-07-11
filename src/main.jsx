
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Bell, CalendarDays, Check, Clock3, FileText, LockKeyhole, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import './styles.css';

const EXAMPLE = [];

const STEPS = ['Recibido', 'En revisiÃ³n', 'DecisiÃ³n', 'Completado'];
const cleanReceipt = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 13);

function App() {
  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem('uscis-cases');
    const sampleReceipts = new Set(['IOE0912345678', 'IOE0987654321']);
    return saved ? JSON.parse(saved).filter((item) => !sampleReceipts.has(item.receipt)) : EXAMPLE;
  });
  const [receipt, setReceipt] = useState('');
  const [active, setActive] = useState(cases[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => localStorage.setItem('uscis-cases', JSON.stringify(cases)), [cases]);
  const selected = useMemo(() => cases.find((item) => item.id === active) ?? cases[0], [cases, active]);

  function addCase(event) {
    event.preventDefault();
    const normalized = cleanReceipt(receipt);
    if (!/^[A-Z]{3}[0-9]{10}$/.test(normalized)) return;
    const item = { id: Date.now(), receipt: normalized, type: 'Caso USCIS', label: 'Expediente personal', status: 'Pendiente de consultar', updated: 'Sin consultar', step: 1, note: 'Consulta el caso en USCIS y guarda aquÃ­ la Ãºltima notificaciÃ³n.' };
    setCases((current) => [item, ...current]);
    setActive(item.id); setReceipt(''); setAdding(false);
  }

  function removeCase(id) {
    setCases((current) => current.filter((item) => item.id !== id));
    if (active === id) setActive(null);
  }

  function saveNotice() {
    if (!selected || !notice.trim()) return;
    const today = new Intl.DateTimeFormat('es-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
    setCases((current) => current.map((item) => item.id === selected.id ? { ...item, status: notice.trim(), note: notice.trim(), updated: today, step: Math.max(item.step, 2) } : item));
    setNotice('');
  }

  const officialUrl = selected ? `https://egov.uscis.gov/casestatus/landing.do` : 'https://egov.uscis.gov/';

  return <div className="app-shell">
    <header>
      <a className="brand" href="#top" aria-label="Mi Caso USCIS, inicio"><span className="brand-mark"><FileText size={19}/><Check size={13}/></span><span>Mi Caso <b>USCIS</b></span></a>
      <nav><a href="#casos">Mis casos</a><a href="#ayuda">CÃ³mo funciona</a></nav>
      <button className="icon-button" aria-label="Notificaciones"><Bell size={20}/><i/></button>
    </header>

    <main id="top">
      <section className="hero">
        <div className="eyebrow"><ShieldCheck size={15}/> Seguimiento privado y organizado</div>
        <h1>Tu proceso migratorio,<br/><em>mÃ¡s claro.</em></h1>
        <p>Guarda tus nÃºmeros de recibo, organiza fechas importantes y consulta el estado oficial de tus casos en USCIS.</p>
        <div className="hero-actions"><button className="primary" onClick={() => setAdding(true)}><Plus size={18}/> Agregar un caso</button><a className="text-link" href={officialUrl} target="_blank" rel="noreferrer">Consultar en USCIS <ArrowUpRight size={17}/></a></div>
        <div className="trust"><LockKeyhole size={15}/> Tus casos se guardan solamente en este dispositivo.</div>
      </section>

      <section className="dashboard" id="casos">
        <aside className="case-list">
          <div className="section-heading"><div><span>EXPEDIENTES</span><h2>Mis casos</h2></div><button className="add-small" onClick={() => setAdding(true)} aria-label="Agregar caso"><Plus size={19}/></button></div>
          <label className="search"><Search size={17}/><input placeholder="Buscar por recibo o trÃ¡mite" aria-label="Buscar casos"/></label>
          <div className="cards">
            {cases.map((item) => <button key={item.id} className={`case-card ${selected?.id === item.id ? 'active' : ''}`} onClick={() => setActive(item.id)}>
              <span className="case-icon"><FileText size={19}/></span><span className="case-copy"><b>{item.type}</b><small>{item.label}</small><code>{item.receipt}</code></span><span className={`dot step-${item.step}`}/>
            </button>)}
            {!cases.length && <div className="empty">AÃºn no tienes casos guardados.</div>}
          </div>
        </aside>

        <article className="case-detail">
          {selected ? <>
            <div className="detail-top"><div><span className="status-pill">EN PROGRESO</span><h2>{selected.status}</h2><p>{selected.note}</p></div><button className="delete" onClick={() => removeCase(selected.id)} aria-label="Eliminar caso"><Trash2 size={18}/></button></div>
            <div className="timeline" aria-label="Progreso del caso">{STEPS.map((step, index) => <div key={step} className={index < selected.step ? 'done' : ''}><span>{index < selected.step ? <Check size={14}/> : index + 1}</span><b>{step}</b></div>)}</div>
            <div className="info-grid"><div><CalendarDays size={19}/><span><small>Ãšltima actualizaciÃ³n</small><b>{selected.updated}</b></span></div><div><Clock3 size={19}/><span><small>NÃºmero de recibo</small><b>{selected.receipt}</b></span></div></div>
            <div className="official-box"><div><ShieldCheck size={22}/><span><b>1. Consulta el estado oficial</b><small>Escribe allÃ­ el nÃºmero {selected.receipt} y revisa la notificaciÃ³n mÃ¡s reciente.</small></span></div><a href={officialUrl} target="_blank" rel="noreferrer">Consultar en USCIS <ArrowUpRight size={16}/></a></div>
            <div className="notice-editor"><label htmlFor="latest-notice">2. Guarda la Ãºltima notificaciÃ³n</label><textarea id="latest-notice" value={notice} onChange={(event) => setNotice(event.target.value)} placeholder="Ejemplo: El caso estÃ¡ siendo revisado activamente por USCISâ€¦"/><button className="primary" onClick={saveNotice} disabled={!notice.trim()}><Check size={17}/> Guardar actualizaciÃ³n</button></div>
          </> : <div className="empty-detail"><FileText size={34}/><h2>Agrega tu primer caso</h2><p>Solo necesitas el nÃºmero de recibo de 13 caracteres.</p><button className="primary" onClick={() => setAdding(true)}><Plus size={18}/> Agregar caso</button></div>}
        </article>
      </section>

      <section className="how" id="ayuda"><span>UN PROCESO SIMPLE</span><h2>Todo lo importante, en un solo lugar.</h2><div><article><b>01</b><h3>Agrega tu recibo</h3><p>Registra el nÃºmero que aparece en las notificaciones de USCIS.</p></article><article><b>02</b><h3>Organiza el progreso</h3><p>Visualiza cada trÃ¡mite y conserva tus referencias importantes.</p></article><article><b>03</b><h3>Confirma oficialmente</h3><p>Abre el portal de USCIS directamente cuando quieras comprobar novedades.</p></article></div></section>
    </main>

    <footer><span>Mi Caso USCIS</span><p>Herramienta independiente. No estÃ¡ afiliada ni respaldada por USCIS o el gobierno de EE. UU.</p><a href="https://www.uscis.gov/" target="_blank" rel="noreferrer">USCIS.gov <ArrowUpRight size={14}/></a></footer>

    {adding && <div className="modal-backdrop" onMouseDown={() => setAdding(false)}><form className="modal" onSubmit={addCase} onMouseDown={(e) => e.stopPropagation()}><button type="button" className="close" onClick={() => setAdding(false)} aria-label="Cerrar">Ã—</button><span className="modal-icon"><FileText size={25}/></span><h2>Agregar un caso</h2><p>Escribe el nÃºmero de recibo de 13 caracteres. Por ejemplo: IOE0912345678.</p><label>NÃºmero de recibo<input autoFocus value={receipt} onChange={(e) => setReceipt(cleanReceipt(e.target.value))} placeholder="IOE0912345678"/></label><small className="hint">3 letras seguidas de 10 nÃºmeros</small><button className="primary wide" disabled={!/^[A-Z]{3}[0-9]{10}$/.test(receipt)}>Guardar caso</button></form></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
