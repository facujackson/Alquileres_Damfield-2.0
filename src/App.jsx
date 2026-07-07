import React, { useState, useMemo, useEffect } from "react";

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
async function dbGet(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function dbSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); } catch {}
}

// ─── USUARIOS POR DEFECTO ────────────────────────────────────────────────────
const DEFAULT_USERS = [
  { id: "u1", name: "Administrador", username: "admin",    password: "admin123",   role: "admin",     email: "" },
  { id: "u2", name: "Vendedor",      username: "vendedor", password: "venta123",   role: "vendedor",  email: "" },
  { id: "u3", name: "Solo Lectura",  username: "lectura",  password: "lectura123", role: "readonly",  email: "" },
];

// ─── ESPACIOS ────────────────────────────────────────────────────────────────
const SPACES = {
  futbol_11:      { id:"futbol_11",      label:"Fútbol 11",      short:"F11", color:"#22c55e", group:"futbol",    price:121000 },
  futbol_8a:      { id:"futbol_8a",      label:"Fútbol 8 — A",   short:"F8A", color:"#4ade80", group:"futbol",    price:88000  },
  futbol_8b:      { id:"futbol_8b",      label:"Fútbol 8 — B",   short:"F8B", color:"#86efac", group:"futbol",    price:88000  },
  futbol_8c:      { id:"futbol_8c",      label:"Fútbol 8 — C",   short:"F8C", color:"#bbf7d0", group:"futbol",    price:88000  },
  hockey_11:      { id:"hockey_11",      label:"Hockey 11",       short:"H11", color:"#3b82f6", group:"hockey",    price:121000 },
  hockey_7a:      { id:"hockey_7a",      label:"Hockey 7 — A",    short:"H7A", color:"#60a5fa", group:"hockey",    price:77000  },
  hockey_7b:      { id:"hockey_7b",      label:"Hockey 7 — B",    short:"H7B", color:"#93c5fd", group:"hockey",    price:77000  },
  pausa:          { id:"pausa",          label:"Sector Pausa",    short:"PAU", color:"#f59e0b", group:"otros",     price:null   },
  coworking_total:{ id:"coworking_total",label:"Cowork completo", short:"CWC", color:"#8b5cf6", group:"coworking", price:null   },
  sala_10:        { id:"sala_10",        label:"Sala 10p",        short:"S10", color:"#a78bfa", group:"coworking", price:null   },
  sala_4a:        { id:"sala_4a",        label:"Sala 4-5p A",     short:"S4A", color:"#c4b5fd", group:"coworking", price:null   },
  sala_4b:        { id:"sala_4b",        label:"Sala 4-5p B",     short:"S4B", color:"#ddd6fe", group:"coworking", price:null   },
  escritorio:     { id:"escritorio",     label:"Escritorio",      short:"ESC", color:"#c084fc", group:"coworking", price:null   },
};

const SPACE_GROUPS = [
  { label:"⚽ Fútbol",    g:"futbol",    ids:["futbol_11","futbol_8a","futbol_8b","futbol_8c"] },
  { label:"🏑 Hockey",    g:"hockey",    ids:["hockey_11","hockey_7a","hockey_7b"] },
  { label:"☕ Pausa",     g:"otros",     ids:["pausa"] },
  { label:"💼 Coworking", g:"coworking", ids:["coworking_total","sala_10","sala_4a","sala_4b","escritorio"] },
];

const CONFLICT_GROUPS = [
  ["futbol_11","futbol_8a","futbol_8b","futbol_8c"],
  ["hockey_11","hockey_7a","hockey_7b"],
  ["coworking_total","escritorio"],
];
const ESCRITORIO_MAX = 28;

const ALL_HOURS    = Array.from({length:18},(_,i)=>i+6);
const ALL_SLOTS    = Array.from({length:36},(_,i)=>6+i*0.5);  // 6:00 a 23:30
const DEFAULT_HOURS= [18,19,20,21,22];
const DAYS         = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const APP_VERSION  = "2.14";

// ─── DETECCIÓN MOBILE ────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// ─── LOGO SVG ────────────────────────────────────────────────────────────────
function DamfieldLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 89.63 100.09" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
      <path fill="#eef1f5" d="M43.94,84.63c-1.53.45-3.11.58-4.63.41-.38-.06-.76-.07-1.14-.16l-1.12-.27c-.37-.08-.73-.26-1.09-.38-.36-.14-.72-.24-1.06-.44-.7-.35-1.4-.64-2.05-1.09l-.99-.61c-.35-.22-.76-.5-1.15-.73-1.59-.95-3.3-1.88-5.23-2.48-.96-.28-1.99-.48-2.99-.51-.96-.04-1.94.03-2.91.19-1.94.34-3.88,1.09-5.48,2.25-1.6,1.15-2.85,2.66-3.61,4.39l.37.41c1.79-.53,3.35-1.02,4.86-1.26,1.5-.27,2.92-.33,4.37-.31l2.2.06c.7.02,1.37.03,2.07.11,1.41.1,2.9.44,4.33,1.05.37.16.69.31,1.1.49l1.28.56c.83.4,1.75.65,2.64.93.44.15.92.21,1.38.3.47.07.92.19,1.39.22l1.41.09c.47.02.95-.04,1.42-.05,3.77-.32,7.27-2.19,9.36-5.08l-.42-.35c-1.26,1.06-2.77,1.82-4.3,2.27h0Z"/>
      <path fill="#eef1f5" d="M86.66,32.43c-2.07-6.17-4.99-11.64-8.76-16.44-3.77-4.79-8.49-8.66-14.17-11.59C58.05,1.47,51.91,0,45.3,0H0v.28l10.26,4.61v35.82c.1-.06.21-.11.31-.16h13.69c.15.08.3.16.45.25v-.25h.08l-.08-.1V2.32h13.12c6.98,0,13.35,2.36,19.12,7.08,5.77,4.72,10.2,10.83,13.3,18.32,3.09,7.49,4.59,15.38,4.5,23.66-.09,8.52-1.72,16.31-4.89,23.38-3.16,7.07-7.56,12.68-13.19,16.82s-11.91,6.21-18.85,6.21h-5.8l-21.58-.45v2.75h34.85c8.65,0,16.37-2.23,23.14-6.7,6.77-4.47,11.96-10.38,15.57-17.73,3.61-7.35,5.48-15.45,5.62-24.29.09-6.47-.9-12.78-2.97-18.95h.01Z"/>
      <path fill="#eef1f5" d="M10.65,71.9c1.94-.67,3.68-1.26,5.4-1.58,1.7-.35,3.35-.47,5.01-.47.84,0,1.67.01,2.52.04.82.02,1.59.04,2.4.13,1.62.13,3.29.54,4.86,1.26l.59.28.62.31,1.41.67c.91.48,1.94.77,2.92,1.12,2.03.54,4.14.91,6.26.7,2.1-.18,4.14-.79,5.92-1.79.9-.48,1.71-1.09,2.48-1.73.75-.68,1.43-1.38,2.02-2.2l-.42-.35c-1.39,1.23-3.07,2.14-4.78,2.71-1.72.57-3.5.77-5.23.61-1.74-.09-3.41-.69-4.99-1.39-.78-.41-1.58-.73-2.31-1.25l-1.11-.71c-.17-.1-.41-.27-.62-.41l-.66-.43c-1.79-1.11-3.74-2.11-5.88-2.73-.54-.15-1.08-.27-1.64-.37-.55-.08-1.14-.15-1.67-.16-1.06-.05-2.15.04-3.22.21-2.15.37-4.28,1.16-6.08,2.4-1.8,1.23-3.25,2.85-4.17,4.72l.37.41h0Z"/>
      <path fill="#eef1f5" d="M21.98,56.11c1.88,0,3.6.04,5.42.24,1.81.18,3.66.63,5.38,1.42.44.2.83.4,1.31.64.51.25.99.52,1.51.75.52.23,1.02.47,1.56.66l.79.3.81.26c1.09.33,2.21.56,3.34.7,1.13.15,2.28.17,3.42.1,2.27-.17,4.49-.82,6.43-1.9,1.93-1.08,3.62-2.49,4.91-4.24l-.42-.35c-3.06,2.7-7.13,4.1-10.93,3.74-.95-.07-1.89-.23-2.81-.49-.92-.25-1.81-.58-2.68-.99l-.65-.29-.64-.33c-.43-.21-.84-.47-1.25-.72-.42-.24-.81-.53-1.22-.79-.42-.28-.93-.63-1.41-.91-1.96-1.18-4.07-2.21-6.35-2.87-1.14-.31-2.32-.53-3.52-.59-1.21-.06-2.37.02-3.53.21-2.32.39-4.62,1.22-6.57,2.52-1.95,1.31-3.55,3.01-4.6,5l.37.41c2.07-.78,3.96-1.46,5.82-1.87,1.86-.42,3.67-.57,5.51-.6h0Z"/>
    </svg>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const dateKey = d => d.toISOString().split("T")[0];
const pad     = n => String(Math.floor(n)).padStart(2,"0");
const fmtHour = h => h%1===0 ? pad(h)+":00" : pad(h)+":30";
const fmtMoney= n => (n==null||n=="") ? "—" : `$${Number(n).toLocaleString("es-AR")}`;
const fmtMonthYear = d => d.toLocaleDateString("es-AR",{month:"long",year:"numeric"});
const fmtDateTime  = s => s ? new Date(s).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "—";
const groupColor   = g => ({futbol:"#22c55e",hockey:"#3b82f6",otros:"#f59e0b",coworking:"#8b5cf6"}[g]||"#fff");

function getMonthGrid(base) {
  const year = base.getFullYear(), month = base.getMonth();
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); // 0=Dom
  if (startDow === 0) startDow = 7;
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - (startDow - 1));
  const grid = [];
  const cur = new Date(startDate);
  const lastDay = new Date(year, month + 1, 0);
  while (cur <= lastDay || grid.length % 7 !== 0) {
    grid.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
    if (grid.length >= 42) break;
  }
  return grid;
}

function getWeekDates(base) {
  const d=new Date(base), diff=d.getDay()===0?-6:1-d.getDay();
  const mon=new Date(d); mon.setDate(d.getDate()+diff);
  return Array.from({length:7},(_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return x;});
}
function expandRecurrence(b) {
  if (!b.recurrence||b.recurrence==="none") return [b];
  const results=[], start=new Date(b.date+"T12:00:00");
  const until = b.recurrence==="until"&&b.recurrenceUntil ? new Date(b.recurrenceUntil+"T12:00:00") : null;
  const count = b.recurrence==="count" ? (b.recurrenceCount||1) : 52;
  let cur=new Date(start), i=0;
  while(i<count){
    const dk=dateKey(cur);
    if(until&&cur>until) break;
    results.push({...b,date:dk,seriesId:b.id,instanceDate:dk,id:b.id+"_"+dk});
    cur.setDate(cur.getDate()+7); i++;
  }
  return results;
}
function expandAll(bookings){ return bookings.flatMap(b=>expandRecurrence(b)); }

function isBlockedBy(spaceId,expanded,date,hour){
  for(const g of CONFLICT_GROUPS){
    if(!g.includes(spaceId)) continue;
    const isFull=g.indexOf(spaceId)===0;
    const others=isFull?g.slice(1):[g[0]];
    return expanded.some(b=>b.date===date&&others.includes(b.space)&&b.startHour<=hour&&b.endHour>hour);
  }
  return false;
}
function hasConflict(expanded,date,sh,eh,spaceId,excludeSeries){
  const dk=typeof date==="string"?date:dateKey(date);
  const overlaps=b=>!(eh<=b.startHour||sh>=b.endHour);
  const notExcluded=b=>!(b.seriesId&&b.seriesId===excludeSeries)&&b.id!==excludeSeries&&b.date===dk;
  // Escritorio: allow up to ESCRITORIO_MAX simultaneous; only conflict with coworking_total
  if(spaceId==="escritorio"){
    const existing=expanded.filter(b=>notExcluded(b)&&overlaps(b)&&b.space==="escritorio").length;
    if(existing>=ESCRITORIO_MAX) return true;
    return expanded.some(b=>notExcluded(b)&&overlaps(b)&&b.space==="coworking_total");
  }
  // Cowork completo: blocked if any escritorio already booked
  if(spaceId==="coworking_total"){
    return expanded.some(b=>{
      if(!notExcluded(b)||!overlaps(b)) return false;
      if(b.space==="coworking_total") return true;
      if(b.space==="escritorio") return true;
      return false;
    });
  }
  return expanded.some(b=>{
    if(!notExcluded(b)||!overlaps(b)) return false;
    if(b.space===spaceId) return true;
    for(const g of CONFLICT_GROUPS){
      if(!g.includes(spaceId)||!g.includes(b.space)) continue;
      if(g.indexOf(spaceId)===0||g.indexOf(b.space)===0) return true;
    }
    return false;
  });
}
function isPast(bk){
  if(!bk.date||bk.endHour==null) return false;
  return new Date(bk.date+"T"+fmtHour(bk.endHour)+":00") < new Date();
}
function getTotalPagado(bk){
  if(bk.sinCargo||bk.isBloqueo) return 0;
  if(bk.pagos&&bk.pagos.length>0) return bk.pagos.reduce((s,p)=>s+(Number(p.monto)||0),0);
  // backward compat
  if(!bk.paymentType||bk.paymentType==="total"||bk.paymentType==="momento") return Number(bk.totalAmount)||0;
  if(bk.paymentType==="seña_saldo") return bk.saldoPaid?Number(bk.totalAmount)||0:Number(bk.señaAmount)||0;
  return 0;
}
function getNetAmount(bk){
  if(bk.sinCargo||bk.isBloqueo) return 0;
  const base=Number(bk.totalAmount)||0;
  if(!bk.descuentoTipo||bk.descuentoTipo==="none") return base;
  if(bk.descuentoTipo==="pct") return Math.max(0,base-base*(Number(bk.descuentoValor)||0)/100);
  if(bk.descuentoTipo==="monto") return Math.max(0,base-(Number(bk.descuentoValor)||0));
  return base;
}
function payLabel(bk){
  if(bk.isBloqueo) return "🚫 Bloqueado";
  if(bk.sinCargo) return "Sin cargo";
  const total=getNetAmount(bk);
  const pagado=getTotalPagado(bk);
  const resta=total-pagado;
  if(total===0) return "—";
  if(resta<=0) return "✓ Pagado";
  if(pagado>0) return `Resta ${fmtMoney(resta)}`;
  return "⚠ Sin pago";
}
function payColors(bk){
  if(bk.isBloqueo) return {bg:"#7f1d1d22",fg:"#c96b5f"};
  const total=getNetAmount(bk);
  const pagado=getTotalPagado(bk);
  const resta=total-pagado;
  if(resta<=0&&total>0) return {bg:"#22c55e22",fg:"#22c55e"};
  if(pagado>0) return {bg:"#f59e0b22",fg:"#f59e0b"};
  return {bg:"#c96b5f22",fg:"#c96b5f"};
}

const EMPTY_FORM={
  space:"futbol_11",date:"",startHour:18,endHour:19,
  clientId:"",clientName:"",clientPhone:"",clientEmail:"",clientOrg:"",
  totalAmount:"",señaAmount:"",
  descuentoTipo:"none",descuentoValor:"",descuentoMotivo:"",   // "none"|"pct"|"monto"
  pagos:[],           // [{id,monto,fecha,nota,forma}]
  asistio:null,       // null | true | false
  sinCargo:false,
  isBloqueo:false,bloqueoMotivo:"",         // bloqueo de espacio
  notes:"",
  recurrence:"none",recurrenceCount:4,recurrenceUntil:"",
  // backward compat
  paymentType:"seña_saldo",saldoPaid:false,
  // transient UI state
  newPagoMonto:"",newPagoFecha:"",newPagoForma:"",
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({users, onLogin}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  function attempt() {
    setLoading(true); setError("");
    setTimeout(()=>{
      const user = users.find(u=>u.username===username.trim()&&u.password===password);
      if(user) onLogin(user);
      else { setError("Usuario o contraseña incorrectos"); setLoading(false); }
    },400);
  }

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 15%,#1c2026 0%,#101317 55%,#0a0c0f 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:380}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#262b32 0%,#15181d 100%)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",padding:8,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}><DamfieldLogo size={40}/></div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>Damfield</div>
          <div style={{fontSize:12,color:"#7f8792",textTransform:"uppercase",letterSpacing:1.5,marginTop:2}}>Sistema de Alquileres</div>
        </div>

        <div style={{background:"linear-gradient(160deg,#1a1e24 0%,#15181d 100%)",border:"1px solid #333a42",borderRadius:16,padding:28,boxShadow:"0 24px 64px rgba(0,0,0,0.6)"}}>
          <div style={{marginBottom:18}}>
            <label style={lblSt}>Usuario</label>
            <input value={username} onChange={e=>{setUsername(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&attempt()}
              placeholder="tu usuario" style={inpSt} autoFocus/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={lblSt}>Contraseña</label>
            <div style={{position:"relative"}}>
              <input type={showPwd?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                onKeyDown={e=>e.key==="Enter"&&attempt()}
                placeholder="••••••••" style={{...inpSt,paddingRight:40}}/>
              <button type="button" onClick={()=>setShowPwd(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#7f8792",fontSize:16,padding:2}}>
                {showPwd?"🙈":"👁"}
              </button>
            </div>
          </div>
          {error&&<div style={{background:"#c96b5f15",border:"1px solid #c96b5f44",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#c96b5f",marginBottom:14}}>{error}</div>}
          <button onClick={attempt} disabled={loading||!username||!password} style={{
            width:"100%",padding:"11px",borderRadius:10,border:"none",cursor:"pointer",
            fontSize:14,fontWeight:700,
            background:(!username||!password)?"#333a42":"#c9ad7f",
            color:(!username||!password)?"#7f8792":"#15181d",
          }}>{loading?"Ingresando…":"Ingresar"}</button>
          <button type="button" onClick={async()=>{
            await dbSet("users", DEFAULT_USERS);
            window.location.reload();
          }} style={{width:"100%",marginTop:10,padding:"8px",borderRadius:8,border:"1px solid #333a42",background:"transparent",color:"#7f8792",cursor:"pointer",fontSize:11}}>
            ¿Problemas para ingresar? Restaurar accesos
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM SHEET MOBILE
// ═══════════════════════════════════════════════════════════════════════════════
function BookingBottomSheet({ form, setForm, editing, onSave, onClose, onDelete,
  clients, conflict, canEdit, isAdmin, SPACES, ALL_HOURS,
  clientPicker, setClientPicker, fmtMoney, getNetAmount, getTotalPagado, dateKey,
  pad, isPast }) {

  const [step, setStep] = useState(editing?.clientId ? 2 : 0);
  const steps = form.isBloqueo
    ? [{ label: '🚫 Bloqueo' }]
    : [{ label: '📅 Reserva' }, { label: '👤 Cliente' }, { label: '💰 Cobro' }];

  const inpMob = { width:'100%', background:'#15181d', border:'1px solid #333a42', borderRadius:10, padding:'12px 14px', color:'#eef1f5', fontSize:14, boxSizing:'border-box' };
  const lblMob = { fontSize:10, color:'#7f8792', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 };

  return (
    <>
      <div className="dm-overlay" style={{position:'fixed',inset:0,background:'#000000a0',zIndex:100}} onClick={onClose}/>
      <div className="dm-sheet" style={{position:'fixed',bottom:0,left:0,right:0,zIndex:101,background:'#15181d',borderRadius:'20px 20px 0 0',border:'1px solid #333a42',borderBottom:'none',maxHeight:'92vh',overflowY:'auto',padding:'0 16px 32px'}}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 8px'}}>
          <div style={{width:36,height:4,background:'#333a42',borderRadius:2}}/>
        </div>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800}}>{editing?'Editar alquiler':'Nuevo alquiler'}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#7f8792',fontSize:22,cursor:'pointer'}}>×</button>
        </div>
        {/* Progress bar */}
        {!form.isBloqueo&&(
          <div style={{display:'flex',gap:4,marginBottom:20}}>
            {steps.map((s,i)=>(
              <div key={i} onClick={()=>setStep(i)} style={{flex:1,height:4,borderRadius:2,cursor:'pointer',background:i<=step?'#c9ad7f':'#333a42',transition:'background 0.2s'}}/>
            ))}
          </div>
        )}
        {/* Tipo toggle */}
        <div style={{display:'flex',gap:6,marginBottom:16}}>
          {[{v:false,l:'📅 Alquiler'},{v:true,l:'🚫 Bloquear'}].map(({v,l})=>(
            <button key={String(v)} onClick={()=>{setForm(f=>({...f,isBloqueo:v}));setStep(0);}} style={{flex:1,padding:12,borderRadius:10,border:`2px solid ${form.isBloqueo===v?(v?'#c96b5f':'#c9ad7f'):'#333a42'}`,background:form.isBloqueo===v?(v?'#c96b5f18':'#c9ad7f18'):'transparent',color:form.isBloqueo===v?(v?'#c96b5f':'#c9ad7f'):'#7f8792',cursor:'pointer',fontWeight:700,fontSize:13}}>{l}</button>
          ))}
        </div>

        {/* ── STEP 0 / BLOQUEO ── */}
        {(step===0||form.isBloqueo)&&(
          <div>
            {form.isBloqueo&&(
              <div style={{marginBottom:12}}>
                <label style={lblMob}>Motivo *</label>
                <input value={form.bloqueoMotivo||''} onChange={e=>setForm(f=>({...f,bloqueoMotivo:e.target.value}))} placeholder="Academia, Torneo…" style={inpMob}/>
              </div>
            )}
            <div style={{marginBottom:12}}>
              <label style={lblMob}>Espacio</label>
              <select value={form.space} onChange={e=>{const sp=SPACES[e.target.value];setForm(f=>({...f,space:e.target.value,totalAmount:sp.price!=null?sp.price:f.totalAmount}));}} style={inpMob}>
                {Object.values(SPACES).map(s=><option key={s.id} value={s.id}>{s.label}{s.price?` — ${fmtMoney(s.price)}`:' — a convenir'}</option>)}
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <label style={lblMob}>Fecha</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inpMob}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              {[{label:'Desde',key:'startHour'},{label:'Hasta',key:'endHour'}].map(({label,key})=>(
                <div key={key}>
                  <label style={lblMob}>{label}</label>
                  <select value={form[key]} onChange={e=>{const val=+e.target.value;setForm(f=>key==='startHour'?{...f,startHour:val,endHour:Math.max(val+0.5,f.endHour)}:{...f,endHour:val});}} style={{...inpMob,fontSize:15,fontWeight:700}}>
                    {ALL_SLOTS.filter(h=>key==='endHour'?h>form.startHour:h<23.5).map(h=><option key={h} value={h}>{fmtHour(h)}</option>)}
                    {key==='endHour'&&<option value={23.5}>23:30</option>}
                  </select>
                </div>
              ))}
            </div>
            {conflict&&<div style={{background:'#c96b5f15',border:'1px solid #c96b5f',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#c96b5f',marginBottom:12}}>⚠️ Conflicto de horario con otra reserva o cancha relacionada.</div>}
            <div style={{background:'#1e2228',borderRadius:10,padding:14,marginBottom:16,border:'1px solid #333a42'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#b3bac4',marginBottom:10}}>🔁 Repetición semanal</div>
              <div style={{display:'flex',gap:6}}>
                {[['none','No repetir'],['count','N semanas'],['until','Hasta fecha']].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,recurrence:v}))} style={{flex:1,padding:'8px 4px',borderRadius:8,border:'1px solid',fontSize:11,cursor:'pointer',borderColor:form.recurrence===v?'#c9ad7f':'#333a42',background:form.recurrence===v?'#c9ad7f22':'transparent',color:form.recurrence===v?'#c9ad7f':'#7f8792'}}>{l}</button>
                ))}
              </div>
              {form.recurrence==='count'&&<div style={{marginTop:10,display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:12,color:'#7f8792'}}>Semanas:</span><input type="number" min={1} max={52} value={form.recurrenceCount} onChange={e=>setForm(f=>({...f,recurrenceCount:+e.target.value}))} style={{width:60,background:'#15181d',border:'1px solid #333a42',borderRadius:8,padding:'8px',color:'#eef1f5',fontSize:14}}/></div>}
              {form.recurrence==='until'&&<input type="date" value={form.recurrenceUntil} onChange={e=>setForm(f=>({...f,recurrenceUntil:e.target.value}))} style={{marginTop:10,width:'100%',background:'#15181d',border:'1px solid #333a42',borderRadius:8,padding:'10px',color:'#eef1f5',fontSize:14,boxSizing:'border-box'}}/>}
            </div>
            <button onClick={form.isBloqueo?onSave:()=>setStep(1)} disabled={form.isBloqueo&&!(form.bloqueoMotivo||'').trim()} style={{width:'100%',padding:14,borderRadius:12,border:'none',fontSize:15,fontWeight:700,cursor:'pointer',background:'#c9ad7f',color:'#15181d'}}>
              {form.isBloqueo?'Bloquear espacio':'Siguiente →'}
            </button>
          </div>
        )}

        {/* ── STEP 1: Cliente ── */}
        {!form.isBloqueo&&step===1&&(
          <div>
            {form.clientName?(
              <div style={{display:'flex',alignItems:'center',gap:8,background:'#1e2228',borderRadius:10,padding:'12px 14px',border:'1px solid #333a42',marginBottom:14}}>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{form.clientName}</div>{form.clientOrg&&<div style={{fontSize:12,color:'#7f8792'}}>{form.clientOrg}</div>}</div>
                <button onClick={()=>setForm(f=>({...f,clientId:'',clientName:'',clientPhone:'',clientEmail:'',clientOrg:''}))} style={{background:'none',border:'none',color:'#7f8792',cursor:'pointer',fontSize:20}}>×</button>
              </div>
            ):(
              <button onClick={()=>setClientPicker(true)} style={{width:'100%',padding:'14px',borderRadius:10,border:'2px dashed #333a42',background:'transparent',color:'#7f8792',cursor:'pointer',fontSize:14,marginBottom:14}}>👥 Elegir cliente existente…</button>
            )}
            {!form.clientId&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                {[{key:'clientName',label:'Nombre *',ph:'Juan García'},{key:'clientPhone',label:'WhatsApp',ph:'+54 9 341…'},{key:'clientEmail',label:'Email',ph:'email@…'},{key:'clientOrg',label:'Empresa / Club',ph:'Org…'}].map(({key,label,ph})=>(
                  <div key={key}><label style={lblMob}>{label}</label><input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} style={{...inpMob,fontSize:13,padding:'11px 12px'}}/></div>
                ))}
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setStep(0)} style={{flex:1,padding:14,borderRadius:12,border:'1px solid #333a42',background:'transparent',color:'#b3bac4',cursor:'pointer',fontSize:14,fontWeight:700}}>← Atrás</button>
              <button onClick={()=>setStep(2)} disabled={!form.clientName} style={{flex:2,padding:14,borderRadius:12,border:'none',fontSize:15,fontWeight:700,cursor:'pointer',background:!form.clientName?'#333a42':'#c9ad7f',color:!form.clientName?'#7f8792':'#15181d'}}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Cobro ── */}
        {!form.isBloqueo&&step===2&&(
          <div>
            <div style={{marginBottom:12}}>
              <label style={lblMob}>Total ($)</label>
              <input type="number" value={form.totalAmount} onChange={e=>setForm(f=>({...f,totalAmount:e.target.value}))} placeholder="121000" style={{...inpMob,fontSize:16,fontWeight:700}}/>
            </div>
            {/* Descuento */}
            <div style={{background:'#1a1e24',borderRadius:10,padding:'10px 12px',marginBottom:12,border:'1px solid #333a42'}}>
              <div style={{fontSize:10,color:'#7f8792',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>🏷 Descuento</div>
              <div style={{display:'flex',gap:6,marginBottom:8}}>
                {[["none","Sin desc."],["pct","% Porc."],["monto","$ Fijo"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,descuentoTipo:v,descuentoValor:"",descuentoMotivo:""}))} style={{flex:1,padding:'6px 4px',borderRadius:8,border:'1px solid',fontSize:11,cursor:'pointer',fontWeight:600,borderColor:form.descuentoTipo===v?'#f59e0b':'#333a42',background:form.descuentoTipo===v?'#f59e0b22':'transparent',color:form.descuentoTipo===v?'#f59e0b':'#7f8792'}}>{l}</button>
                ))}
                <button onClick={()=>setForm(f=>({...f,descuentoTipo:"pct",descuentoValor:"100"}))} style={{flex:1,padding:'6px 4px',borderRadius:8,border:`1px solid ${form.descuentoTipo==="pct"&&form.descuentoValor==="100"?'#c9ad7f44':'#333a42'}`,background:form.descuentoTipo==="pct"&&form.descuentoValor==="100"?'#c9ad7f15':'transparent',color:form.descuentoTipo==="pct"&&form.descuentoValor==="100"?'#c9ad7f':'#7f8792',fontSize:11,cursor:'pointer',fontWeight:600}}>🎁 S/C</button>
              </div>
              {form.descuentoTipo!=="none"&&(
                <>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <input type="number" value={form.descuentoValor} onChange={e=>setForm(f=>({...f,descuentoValor:e.target.value}))} placeholder={form.descuentoTipo==="pct"?"10":"5000"} style={{...inpMob,width:80,padding:'10px 12px'}}/>
                    <span style={{fontSize:12,color:'#7f8792'}}>{form.descuentoTipo==="pct"?"%":"ARS"}</span>
                    {Number(form.totalAmount)>0&&Number(form.descuentoValor)>0&&(
                      <span style={{fontSize:13,fontWeight:800,color:'#22c55e'}}>→ {fmtMoney(getNetAmount(form))}</span>
                    )}
                  </div>
                  <input value={form.descuentoMotivo||''} onChange={e=>setForm(f=>({...f,descuentoMotivo:e.target.value}))} placeholder="Motivo del descuento *" style={{...inpMob,borderColor:!(form.descuentoMotivo||'').trim()?'#c96b5f66':'#333a42'}}/>
                  {!(form.descuentoMotivo||'').trim()&&<div style={{fontSize:10,color:'#c96b5f',marginTop:3}}>Requerido para guardar</div>}
                  {(()=>{const es100=form.descuentoTipo==="pct"&&Number(form.descuentoValor)>=100;const esCero=form.descuentoTipo==="monto"&&Number(form.totalAmount)>0&&Number(form.descuentoValor)>=Number(form.totalAmount);return(es100||esCero)&&(<div style={{marginTop:8,background:'#c9ad7f15',border:'1px solid #c9ad7f44',borderRadius:8,padding:'7px 10px',display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:13}}>🎁</span><span style={{fontSize:11,color:'#c9ad7f',fontWeight:700}}>Cortesía — se registra a $0</span></div>);})()}
                </>
              )}
            </div>
            <div style={{marginBottom:14}}>
              <label style={lblMob}>Forma de pago</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[['efectivo','💵 Efectivo'],['transferencia','🏦 Transferencia'],['debito','💳 Débito'],['credito','💳 Crédito'],['cuentacorriente','📒 Cta. Cte.']].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,newPagoForma:v}))} style={{padding:'12px 8px',borderRadius:10,border:'1px solid',fontSize:13,cursor:'pointer',fontWeight:600,borderColor:(form.newPagoForma||'efectivo')===v?'#c9ad7f':'#333a42',background:(form.newPagoForma||'efectivo')===v?'#c9ad7f22':'#1e2228',color:(form.newPagoForma||'efectivo')===v?'#c9ad7f':'#7f8792'}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lblMob}>Monto a cobrar ahora</label>
              <input type="number" value={form.newPagoMonto} onChange={e=>setForm(f=>({...f,newPagoMonto:e.target.value}))} placeholder={form.totalAmount||'0'} style={{...inpMob,fontSize:16,fontWeight:700}}/>
            </div>
            {(form.pagos||[]).length>0&&(
              <div style={{background:'#1e2228',borderRadius:10,padding:12,marginBottom:14}}>
                <div style={{fontSize:10,color:'#7f8792',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Pagos registrados</div>
                {(form.pagos||[]).map(p=>(
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:700,color:'#22c55e',flex:1}}>{fmtMoney(p.monto)}</span>
                    <span style={{fontSize:11,color:'#7f8792'}}>{{efectivo:'💵',transferencia:'🏦',debito:'💳',credito:'💳',cuentacorriente:'📒'}[p.forma]||''} {p.forma}</span>
                  </div>
                ))}
                <div style={{borderTop:'1px solid #333a42',marginTop:6,paddingTop:6,display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:11,color:'#7f8792'}}>Restante</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#f59e0b'}}>{fmtMoney(Math.max(0,getNetAmount(form)-getTotalPagado(form)))}</span>
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:14,borderRadius:12,border:'1px solid #333a42',background:'transparent',color:'#b3bac4',cursor:'pointer',fontSize:14,fontWeight:700}}>← Atrás</button>
              <button onClick={onSave} disabled={!form.date||(!form.isBloqueo&&!form.clientName)||(form.descuentoTipo!=="none"&&!(form.descuentoMotivo||'').trim())} style={{flex:2,padding:14,borderRadius:12,border:'none',fontSize:15,fontWeight:700,cursor:'pointer',background:'#c9ad7f',color:'#15181d'}}>
                {editing?'✓ Guardar cambios':'✓ Confirmar reserva'}
              </button>
            </div>
            {editing&&canEdit&&(
              <button onClick={onDelete} style={{width:'100%',marginTop:10,padding:'12px',borderRadius:12,border:'1px solid #c96b5f44',background:'#c96b5f10',color:'#c96b5f',cursor:'pointer',fontSize:13,fontWeight:700}}>Eliminar reserva</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState(null);
  const [users,    setUsers]    = useState(DEFAULT_USERS);
  const [bookings, setBookings] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loaded,   setLoaded]   = useState(false);

  const [currentDate,    setCurrentDate]    = useState(new Date());
  const [visibleGroups,  setVisibleGroups]  = useState(["futbol","hockey","otros","coworking"]);
  const [view,           setView]           = useState("reservas");
  const [reservaView,    setReservaView]    = useState("semana"); // "dia"|"semana"|"mes"|"lista"
  const [modal,          setModal]          = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [finPeriod,      setFinPeriod]      = useState("mes");
  const [finDate,        setFinDate]        = useState(new Date());
  const [listFilter,     setListFilter]     = useState("all");
  const [clientModal,    setClientModal]    = useState(false);
  const [dupModal,       setDupModal]       = useState(false);
  const [dupGroups,      setDupGroups]      = useState([]);   // [{clients:[...], keepId}]
  const [dupKeep,        setDupKeep]        = useState({});   // {groupIdx: clientId}
  const [clientPicker,   setClientPicker]   = useState(false);
  const [editingClient,  setEditingClient]  = useState(null);
  const [clientForm,     setClientForm]     = useState({name:"",phone:"",email:"",org:""});
  const [clientSearch,   setClientSearch]   = useState("");
  const [userMgmt,       setUserMgmt]       = useState(false);
  const [userForm,       setUserForm]       = useState({name:"",username:"",password:"",role:"vendedor",email:""});
  const [editingUser,    setEditingUser]    = useState(null);
  const [auditModal,     setAuditModal]     = useState(null); // booking to show audit
  const [showUserPwd,    setShowUserPwd]    = useState(false);
  // Lista filters
  const [listTimeRange,  setListTimeRange]  = useState("proximos"); // "todos"|"proximos"|"pasados"|"semana"|"mes"|"año"
  const [listTimeDate,   setListTimeDate]   = useState(new Date());
  const [listShowBloqueos,setListShowBloqueos]=useState(false);
  const [listClientSearch,setListClientSearch]=useState('');
  // Multi-booking cell picker (non-modal)
  const [cellPicker,setCellPicker]=useState(null); // {bks,x,y,spaceId,date,hour}
  // Clientes filters
  const [clientListSearch,setClientListSearch]=useState("");
  const [clientFilter,   setClientFilter]   = useState("all"); // "all"|"incompletos"
  const [clientSort,     setClientSort]     = useState("count_desc");
  const [clientSpaceFilter,setClientSpaceFilter]=useState("all");
  const [toast,          setToast]          = useState(null); // { msg, type } donde type = 'success' | 'error'
  const [confirmModal,   setConfirmModal]   = useState(null); // { title, body, onConfirm, danger }
  const [modalTab,       setModalTab]       = useState('reserva'); // 'reserva' | 'cliente' | 'cobro'
  const [activityLog,    setActivityLog]    = useState([]);
  const [profileModal,   setProfileModal]   = useState(false);
  const [profileForm,    setProfileForm]    = useState({email:"",currentPwd:"",newPwd:"",confirmPwd:""});
  const [showProfilePwd, setShowProfilePwd] = useState({cur:false,nw:false,cf:false});
  const [profileError,   setProfileError]   = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [usuariosTab,    setUsuariosTab]    = useState("usuarios"); // "usuarios"|"historial"

  const isAdmin    = currentUser?.role==="admin";
  const isReadonly = currentUser?.role==="readonly";
  const canEdit    = currentUser?.role==="admin"||currentUser?.role==="vendedor";
  const canFinance = currentUser?.role==="admin"||currentUser?.role==="vendedor";

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  }

  function logActivity(action, detail) {
    const entry = {
      id: "l_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),
      user: currentUser?.name || "Sistema",
      userId: currentUser?.id || "",
      action,
      detail,
      ts: new Date().toISOString(),
    };
    setActivityLog(p => [entry, ...(p||[])].slice(0, 500)); // keep last 500
  }

  // ── Load from storage ──
  useEffect(()=>{
    async function load(){
      const [bk,cl,us,log] = await Promise.all([dbGet("bookings"),dbGet("clients"),dbGet("users"),dbGet("activityLog")]);
      if(bk) setBookings(bk);
      if(cl) setClients(cl);
      if(log) setActivityLog(log);
      let resolvedUsers=DEFAULT_USERS;
      if(us && Array.isArray(us) && us.length > 0) {
        // Usar versión de Firebase para usuarios existentes (preserva contraseñas y emails cambiados)
        const base = DEFAULT_USERS.map(d => us.find(u => u.id === d.id) || d);
        const extras = us.filter(u => !DEFAULT_USERS.find(d => d.id === u.id));
        resolvedUsers = [...base, ...extras];
      }
      setUsers(resolvedUsers);
      // Auto-login desde sesión guardada
      try {
        const saved=localStorage.getItem("damfield_session");
        if(saved){ const {id}=JSON.parse(saved); const u=resolvedUsers.find(x=>x.id===id); if(u) setCurrentUser(u); }
      } catch {}
      setLoaded(true);
    }
    load();
  },[]);

  // ── Persist ──
  useEffect(()=>{ if(loaded) dbSet("bookings",bookings);         },[bookings,loaded]);
  useEffect(()=>{ if(loaded) dbSet("clients",clients);           },[clients,loaded]);
  useEffect(()=>{ if(loaded) dbSet("users",users);               },[users,loaded]);
  useEffect(()=>{ if(loaded) dbSet("activityLog",activityLog);   },[activityLog,loaded]);

  const weekDates = getWeekDates(currentDate);
  const expanded  = useMemo(()=>expandAll(bookings),[bookings]);

  const extraHours = useMemo(()=>{
    const extra=new Set();
    expanded.forEach(b=>{
      if(weekDates.some(d=>dateKey(d)===b.date)){
        for(let h=Math.ceil(b.startHour);h<b.endHour;h++) if(!DEFAULT_HOURS.includes(h)) extra.add(h);
        if(b.startHour%1!==0) extra.add(b.startHour);
      }
    });
    return [...extra].sort((a,b)=>a-b);
  },[expanded,weekDates]);

  const visibleHours    = useMemo(()=>[...new Set([...DEFAULT_HOURS,...extraHours])].sort((a,b)=>a-b),[extraHours]);
  const visibleSpaceIds = SPACE_GROUPS.flatMap(g=>visibleGroups.includes(g.g)?g.ids:[]);

  function toggleGroup(g){ setVisibleGroups(p=>p.includes(g)?p.filter(x=>x!==g):[...p,g]); }

  function audit(existing){
    const now=new Date().toISOString();
    const who=currentUser?.name||"?";
    if(!existing) return {createdBy:who,createdAt:now,updatedBy:who,updatedAt:now,history:[{action:"Creado",by:who,at:now}]};
    const h=[...(existing.history||[]),{action:"Modificado",by:who,at:now}];
    // Solo devuelve campos de auditoría, sin pisar los datos nuevos del formulario
    return {createdBy:existing.createdBy||who,createdAt:existing.createdAt||now,updatedBy:who,updatedAt:now,history:h};
  }

  // ── Booking ops ──
  function openNew(date,hour,spaceId){
    if(!canEdit) return;
    setEditing(null);
    const price=SPACES[spaceId]?.price;
    setForm({...EMPTY_FORM,space:spaceId,date:typeof date==="string"?date:dateKey(date),startHour:hour,endHour:Math.min(hour+1,23),totalAmount:price??""});
    setModalTab('reserva');
    setModal(true);
  }
  function openEdit(bk){
    const master=bookings.find(b=>b.id===bk.seriesId||b.id===bk.id);
    if(!master) return;
    setEditing(master);
    const pagos=master.pagos||[];
    const pagado=pagos.reduce((s,p)=>s+(Number(p.monto)||0),0)||getTotalPagado({...master,pagos:[]});
    const restanteInit=Math.max(0,(Number(master.totalAmount)||0)-pagado);
    setForm({...master, pagos, asistio:master.asistio??null,
      descuentoTipo:master.descuentoTipo||"none", descuentoValor:master.descuentoValor||"", descuentoMotivo:master.descuentoMotivo||"",
      isBloqueo:master.isBloqueo||false, bloqueoMotivo:master.bloqueoMotivo||"",
      sinCargo:master.sinCargo||false,
      notes:master.notes||"",
      newPagoMonto:restanteInit>0?String(restanteInit):"", newPagoFecha:"", newPagoForma:""});
    setModalTab(master.clientId ? 'cobro' : 'reserva');
    setModal(true);
  }
  function save(){
    if(!form.date) return;
    if(form.isBloqueo&&!(form.bloqueoMotivo||"").trim()) return;
    if(!form.isBloqueo&&!form.clientName) return;
    if(!form.isBloqueo&&form.descuentoTipo!=="none"&&!(form.descuentoMotivo||"").trim()) return;
    let entry={...form};
    // Derivar sinCargo automáticamente del descuento 100%
    if(!entry.isBloqueo){
      const es100pct=entry.descuentoTipo==="pct"&&Number(entry.descuentoValor)>=100;
      const esMonto100=entry.descuentoTipo==="monto"&&Number(entry.totalAmount)>0&&Number(entry.descuentoValor)>=Number(entry.totalAmount);
      entry.sinCargo=es100pct||esMonto100;
    }
    if(!form.isBloqueo&&form.clientName){
      let cid=form.clientId;
      if(!cid){
        cid="c_"+Date.now();
        setClients(p=>[...p,{id:cid,name:form.clientName,phone:form.clientPhone,email:form.clientEmail,org:form.clientOrg}]);
      } else {
        setClients(p=>p.map(c=>c.id===cid?{...c,name:form.clientName,phone:form.clientPhone,email:form.clientEmail,org:form.clientOrg}:c));
      }
      entry.clientId=cid;
    }
    if(editing){
      const existing=bookings.find(b=>b.id===editing.id);
      entry={...entry,id:editing.id,...audit(existing)};
      setBookings(p=>p.map(b=>b.id===editing.id?entry:b));
    } else {
      entry={...entry,id:"b_"+Date.now(),...audit(null)};
      setBookings(p=>[...p,entry]);
    }
    setModal(false);
    const spLabel=SPACES[entry.space]?.label||entry.space;
    const who=entry.isBloqueo?`Bloqueo: ${entry.bloqueoMotivo||"sin motivo"}`:entry.clientName||"?";
    logActivity(editing?"Reserva editada":"Reserva creada", `${who} · ${spLabel} · ${entry.date} ${fmtHour(entry.startHour)}–${fmtHour(entry.endHour)}`);
    showToast(editing ? '✓ Reserva actualizada' : '✓ Reserva creada');
  }
  function del(id){
    if(!canEdit){ alert("No tenés permiso para eliminar."); return; }
    const bk=bookings.find(b=>b.id===id);
    const label=bk?.isBloqueo
      ? `Bloqueo: ${bk.bloqueoMotivo||'sin motivo'}`
      : `${bk?.clientName||'Reserva sin nombre'} · ${bk?.date} ${fmtHour(bk?.startHour||0)}–${fmtHour(bk?.endHour||0)}`;
    setConfirmModal({
      title:'¿Eliminar reserva?',
      body: label,
      danger:true,
      onConfirm:()=>{
        setBookings(p=>p.filter(b=>b.id!==id));
        setModal(false);
        setConfirmModal(null);
        logActivity("Reserva eliminada", label);
        showToast('Reserva eliminada','error');
      },
    });
  }

  // ── Client ops ──
  function openClientModal(c=null){
    setEditingClient(c);
    setClientForm(c?{name:c.name,phone:c.phone,email:c.email,org:c.org}:{name:"",phone:"",email:"",org:""});
    setClientModal(true);
  }
  function saveClient(){
    if(!clientForm.name) return;
    if(editingClient) setClients(p=>p.map(c=>c.id===editingClient.id?{...c,...clientForm}:c));
    else setClients(p=>[...p,{id:"c_"+Date.now(),...clientForm}]);
    setClientModal(false);
    showToast(editingClient ? '✓ Cliente actualizado' : '✓ Cliente creado');
  }
  function pickClient(c){
    setForm(f=>({...f,clientId:c.id,clientName:c.name,clientPhone:c.phone,clientEmail:c.email,clientOrg:c.org}));
    setClientPicker(false);
  }
  function clientHistory(cid){ return expanded.filter(b=>b.clientId===cid).sort((a,b)=>a.date.localeCompare(b.date)); }

  function normName(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g,"").trim().split(/\s+/).sort().join(" "); }
  function nameSimilar(a,b){ const na=normName(a),nb=normName(b); if(!na||!nb) return false; if(na===nb) return true; const wa=new Set(na.split(" ")),wb=new Set(nb.split(" ")); const inter=[...wa].filter(x=>wb.has(x)&&x.length>2); return inter.length>=2||(inter.length>=1&&(wa.size===1||wb.size===1)); }
  function findDuplicates(){
    const groups=[];
    const used=new Set();
    // Phone duplicates (exact, non-empty)
    const byPhone={};
    clients.forEach(c=>{ const p=(c.phone||"").replace(/\s/g,""); if(p){ if(!byPhone[p]) byPhone[p]=[]; byPhone[p].push(c); }});
    Object.values(byPhone).forEach(grp=>{ if(grp.length>1){ grp.forEach(c=>used.add(c.id)); groups.push({reason:"phone",clients:grp}); }});
    // Name duplicates
    const remaining=clients.filter(c=>!used.has(c.id));
    for(let i=0;i<remaining.length;i++){
      if(used.has(remaining[i].id)) continue;
      const grp=[remaining[i]];
      for(let j=i+1;j<remaining.length;j++){
        if(used.has(remaining[j].id)) continue;
        if(nameSimilar(remaining[i].name,remaining[j].name)){ grp.push(remaining[j]); used.add(remaining[j].id); }
      }
      if(grp.length>1){ used.add(remaining[i].id); groups.push({reason:"name",clients:grp}); }
    }
    return groups;
  }
  function mergeClients(keepId, removeIds){
    const keep=clients.find(c=>c.id===keepId);
    if(!keep) return;
    // Merge phone/email/empresa from removed into keep if keep is missing them
    let merged={...keep};
    removeIds.forEach(rid=>{
      const rem=clients.find(c=>c.id===rid);
      if(!rem) return;
      if(!merged.phone&&rem.phone) merged.phone=rem.phone;
      if(!merged.email&&rem.email) merged.email=rem.email;
      if(!merged.empresa&&rem.empresa) merged.empresa=rem.empresa;
    });
    setClients(p=>p.filter(c=>c.id===keepId?false:!removeIds.includes(c.id)?true:false).map(c=>c.id===keepId?merged:c));
    // Reassign bookings
    setBookings(p=>p.map(b=>removeIds.includes(b.clientId)?{...b,clientId:keepId,clientName:merged.name}:b));
    logActivity("Clientes fusionados",`Conservado: ${merged.name} · Eliminados: ${removeIds.length}`);
    showToast(`✓ ${removeIds.length} duplicado${removeIds.length>1?"s":""} fusionado${removeIds.length>1?"s":""}`);
  }

  // ── User ops ──
  function saveUser(){
    if(!userForm.name||!userForm.username||!userForm.password) return;
    if(editingUser) setUsers(p=>p.map(u=>u.id===editingUser.id?{...u,...userForm}:u));
    else setUsers(p=>[...p,{id:"u_"+Date.now(),...userForm}]);
    setEditingUser(null); setUserForm({name:"",username:"",password:"",role:"vendedor",email:""});
  }
  function delUser(id){
    if(id===currentUser?.id){alert("No podés eliminar tu propio usuario.");return;}
    const u=users.find(x=>x.id===id);
    setConfirmModal({
      title:'¿Eliminar usuario?',
      body:`${u?.name} (@${u?.username})`,
      danger:true,
      onConfirm:()=>{
        setUsers(p=>p.filter(x=>x.id!==id));
        setConfirmModal(null);
        showToast('Usuario eliminado','error');
      },
    });
  }

  // ── Finanzas ──
  const finData = useMemo(()=>{
    let filtered=expanded.filter(b=>!b.sinCargo&&!b.isBloqueo&&getNetAmount(b)>0);
    if(finPeriod==="semana"){
      const wk=getWeekDates(finDate).map(d=>dateKey(d));
      filtered=filtered.filter(b=>wk.includes(b.date));
    } else if(finPeriod==="mes"){
      const prefix=`${finDate.getFullYear()}-${pad(finDate.getMonth()+1)}`;
      filtered=filtered.filter(b=>b.date.startsWith(prefix));
    } else if(finPeriod==="año"){
      filtered=filtered.filter(b=>b.date.startsWith(String(finDate.getFullYear())));
    }
    const total   =filtered.reduce((s,b)=>s+getNetAmount(b),0);
    const cobrado=filtered.reduce((s,b)=>s+getTotalPagado(b),0);
    const bySpace={};
    filtered.forEach(b=>{
      if(!bySpace[b.space]) bySpace[b.space]={total:0,cobrado:0,count:0};
      bySpace[b.space].count++;
      bySpace[b.space].total+=getNetAmount(b);
      bySpace[b.space].cobrado+=getTotalPagado(b);
    });
    const pending=filtered.filter(b=>getNetAmount(b)-getTotalPagado(b)>0);
    const FORMAS=[["efectivo","💵 Efectivo"],["transferencia","🏦 Transferencia"],["debito","💳 Débito"],["credito","💳 Crédito"],["cuentacorriente","📒 Cta. Cte."]];
    const byForma={efectivo:0,transferencia:0,debito:0,credito:0,cuentacorriente:0};
    filtered.forEach(b=>{
      if(b.pagos&&b.pagos.length>0){
        b.pagos.forEach(p=>{ const f=p.forma||"efectivo"; if(byForma[f]!==undefined) byForma[f]+=(Number(p.monto)||0); });
      }
    });
    return {total,cobrado,pendiente:total-cobrado,bySpace,count:filtered.length,pending,filtered,byForma,FORMAS};
  },[expanded,finPeriod,finDate]);

  const conflict = form.date ? hasConflict(expanded,form.date,form.startHour,form.endHour,form.space,editing?.id) : false;

  if(!loaded) return <div style={{minHeight:"100vh",background:"#15181d",display:"flex",alignItems:"center",justifyContent:"center",color:"#7f8792",fontSize:14}}>Cargando…</div>;
  if(!currentUser) return <LoginScreen users={users} onLogin={u=>{
    localStorage.setItem("damfield_session",JSON.stringify({id:u.id}));
    setCurrentUser(u);
    // Log login — use functional update so we don't depend on currentUser
    const entry={id:"l_"+Date.now(),user:u.name,userId:u.id,action:"Login",detail:`Ingresó al sistema`,ts:new Date().toISOString()};
    setActivityLog(p=>[entry,...(p||[])].slice(0,500));
  }}/>;

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'Manrope',system-ui,-apple-system,sans-serif",background:"linear-gradient(160deg,#16191e 0%,#101317 55%,#0c0e11 100%)",minHeight:"100vh",color:"#eef1f5",fontSize:14}}>

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(180deg,#1c2026 0%,#15181d 100%)",borderBottom:"1px solid #333a42",padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#262b32 0%,#1e2228 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:4,boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}><DamfieldLogo size={24}/></div>
          <div>
            <div style={{fontSize:14,fontWeight:800}}>Damfield</div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{fontSize:9,color:"#7f8792",textTransform:"uppercase",letterSpacing:1}}>Alquileres</div>
              <span style={{fontSize:8,color:"#c9ad7f",fontWeight:700,background:"#c9ad7f20",borderRadius:4,padding:"1px 5px",letterSpacing:0.3}}>v{APP_VERSION}</span>
            </div>
          </div>
        </div>

        <div style={{flex:1}}/>

        {/* Nav */}
        <div style={{display:"flex",background:"#1e2228",borderRadius:8,padding:3,border:"1px solid #333a42",gap:2}}>
          {[
            ["reservas","📅 Reservas"],
            ["clientes","👥 Clientes"],
            ...(canFinance?[["finanzas","💰 Finanzas"]]:[] ),
            ...(isAdmin?[["usuarios","⚙️ Usuarios"]]:[] ),
          ].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:700,
              background:view===v?"linear-gradient(135deg,#e3c99d,#c9ad7f)":"transparent",
              color:view===v?"#15181d":"#7f8792",
            }}>{l}</button>
          ))}
        </div>

        {/* User badge + perfil + logout */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>{setProfileForm({email:currentUser.email||"",currentPwd:"",newPwd:"",confirmPwd:""});setProfileError("");setProfileSuccess("");setShowProfilePwd({cur:false,nw:false,cf:false});setProfileModal(true);}} style={{display:"flex",alignItems:"center",gap:7,background:"#1e2228",border:"1px solid #333a42",borderRadius:8,padding:"5px 10px",cursor:"pointer"}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#e3c99d,#c9ad7f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#15181d",flexShrink:0}}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#eef1f5"}}>{currentUser.name}</div>
              <div style={{fontSize:8,color:currentUser.role==="admin"?"#f59e0b":currentUser.role==="vendedor"?"#c9ad7f":"#7f8792",textTransform:"uppercase",letterSpacing:0.8}}>
                {currentUser.role==="admin"?"Admin":currentUser.role==="vendedor"?"Vendedor":"Solo lectura"}
              </div>
            </div>
          </button>
          <button onClick={()=>{localStorage.removeItem("damfield_session");setCurrentUser(null);}} style={{background:"#1e2228",border:"1px solid #333a42",color:"#7f8792",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:11}}>Salir</button>
        </div>

        {canEdit&&(
          <button onClick={()=>openNew(new Date(),18,"futbol_11")} style={{
            background:"linear-gradient(135deg,#e3c99d 0%,#c9ad7f 60%,#a98d63 100%)",color:"#15181d",border:"none",
            borderRadius:8,padding:"7px 14px",cursor:"pointer",fontWeight:700,fontSize:12,
          }}>+ Nuevo alquiler</button>
        )}
      </div>

      {/* ── CALENDAR ── */}
      {view==="reservas"&&reservaView==="semana"&&(
        <div style={{overflowX:"auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid #333a42",background:"#15181d",position:"sticky",top:0,zIndex:10,flexWrap:"wrap"}}>
            {/* Sub-view selector */}
            <div style={{display:"flex",background:"#1e2228",borderRadius:6,padding:2,border:"1px solid #333a42",gap:1,marginRight:4}}>
              {[["dia","Día"],["semana","Semana"],["mes","Mes"],["lista","Lista"]].map(([v,l])=>(
                <button key={v} onClick={()=>setReservaView(v)} style={{padding:"3px 9px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:reservaView===v?"linear-gradient(135deg,#e3c99d,#c9ad7f)":"transparent",color:reservaView===v?"#15181d":"#7f8792"}}>{l}</button>
              ))}
            </div>
            <div style={{width:1,height:20,background:"#333a42"}}/>
            <button onClick={()=>{const d=new Date(currentDate);d.setDate(d.getDate()-7);setCurrentDate(d);}} style={navBtn}>‹</button>
            <button onClick={()=>setCurrentDate(new Date())} style={{...navBtn,fontSize:11,padding:"3px 10px"}}>Hoy</button>
            <button onClick={()=>{const d=new Date(currentDate);d.setDate(d.getDate()+7);setCurrentDate(d);}} style={navBtn}>›</button>
            <span style={{fontSize:12,fontWeight:600,color:"#b3bac4",textTransform:"capitalize"}}>{fmtMonthYear(weekDates[0])}</span>
            <div style={{width:1,height:20,background:"#333a42",margin:"0 4px"}}/>
            {SPACE_GROUPS.map(({label,g})=>(
              <button key={g} onClick={()=>toggleGroup(g)} style={{
                padding:"3px 10px",borderRadius:20,border:"1px solid",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s",
                borderColor:visibleGroups.includes(g)?groupColor(g):"#333a42",
                background:visibleGroups.includes(g)?`${groupColor(g)}1a`:"transparent",
                color:visibleGroups.includes(g)?groupColor(g):"#7f8792",
              }}>{label}</button>
            ))}
          </div>
          {visibleSpaceIds.length===0?(
            <div style={{textAlign:"center",padding:60,color:"#7f8792"}}>Seleccioná al menos un grupo.</div>
          ):(
            <div style={{minWidth:700}}>
              <div style={{display:"grid",gridTemplateColumns:"80px repeat(7,1fr)",borderBottom:"1px solid #333a42",background:"#15181d",position:"sticky",top:37,zIndex:9}}>
                <div/>
                {weekDates.map((date,i)=>{
                  const today=dateKey(date)===dateKey(new Date());
                  return(
                    <div key={i} style={{padding:"6px 4px",textAlign:"center",borderLeft:"1px solid #333a42"}}>
                      <div style={{fontSize:9,color:"#7f8792",textTransform:"uppercase"}}>{DAYS[i]}</div>
                      <div style={{fontSize:16,fontWeight:700,color:today?"#15181d":"#eef1f5",background:today?"linear-gradient(135deg,#e3c99d,#c9ad7f)":"transparent",borderRadius:6,padding:today?"2px 6px":"0"}}>{date.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              {visibleSpaceIds.map(spaceId=>{
                const sp=SPACES[spaceId];
                return(
                  <div key={spaceId}>
                    <div style={{display:"grid",gridTemplateColumns:"80px repeat(7,1fr)",background:`${sp.color}18`,borderTop:`2px solid ${sp.color}55`}}>
                      <div style={{padding:"5px 8px",display:"flex",flexDirection:"column",alignItems:"flex-start",justifyContent:"center",gap:2,borderRight:"1px solid #333a42",borderLeft:`4px solid ${sp.color}`}}>
                        <span style={{fontSize:11,fontWeight:900,color:"#0a0d14",background:sp.color,borderRadius:4,padding:"1px 6px",letterSpacing:"0.06em",lineHeight:"1.4"}}>{sp.short}</span>
                        {sp.price&&<span style={{fontSize:8,color:sp.color,opacity:0.7}}>{fmtMoney(sp.price)}</span>}
                      </div>
                      {weekDates.map((_,di)=><div key={di} style={{borderLeft:"1px solid #333a42"}}/>)}
                    </div>
                    {visibleHours.map(hour=>{
                      const isExtra=!DEFAULT_HOURS.includes(hour);
                      return(
                        <div key={hour} style={{display:"grid",gridTemplateColumns:"80px repeat(7,1fr)",borderBottom:"1px solid #0f1219",minHeight:44,background:isExtra?"#191d22":"transparent"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:isExtra?"#f59e0b":"#b3bac4",background:"#1c2026",borderRight:"1px solid #333a42",gap:2}}>
                            {isExtra&&<span style={{fontSize:8,color:"#f59e0b"}}>●</span>}{fmtHour(hour)}
                          </div>
                          {weekDates.map((date,di)=>{
                            const dk=dateKey(date);
                            const cellBks=expanded.filter(b=>b.date===dk&&b.space===spaceId&&b.startHour<hour+1&&b.endHour>hour);
                            const isEscritorio=spaceId==="escritorio";
                            const isOcc=isEscritorio?cellBks.length>=ESCRITORIO_MAX:cellBks.length>0;
                            const isBlocked=!isOcc&&isBlockedBy(spaceId,expanded,dk,hour);
                            const today=dk===dateKey(new Date());
                            return(
                              <div key={di}
                                onClick={()=>(!isOcc&&!isBlocked||isEscritorio&&cellBks.length<ESCRITORIO_MAX&&!isBlocked)&&openNew(date,hour,spaceId)}
                                style={{borderLeft:"1px solid #0f1219",background:isBlocked?"#1a1e24":today?"#ffffff05":"transparent",cursor:isBlocked?'not-allowed':(isOcc&&!(isEscritorio&&cellBks.length<ESCRITORIO_MAX))||!canEdit?'default':'pointer',position:"relative",minHeight:44,transition:"background 0.1s"}}
                                onMouseEnter={e=>{if(!isOcc&&!isBlocked&&canEdit)e.currentTarget.style.background=`${sp.color}28`;}}
                                onMouseLeave={e=>{e.currentTarget.style.background=isBlocked?"#1a1e24":today?"#ffffff05":"transparent";}}
                              >
                                {isBlocked&&!isOcc&&<div style={{position:"absolute",inset:2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"#4b525b",letterSpacing:0.3}}>bloqueado</span></div>}
                                {isEscritorio&&cellBks.length>0&&<div style={{position:"absolute",top:2,right:4,fontSize:9,fontWeight:700,color:cellBks.length>=ESCRITORIO_MAX?"#c96b5f":cellBks.length>=ESCRITORIO_MAX*0.75?"#f59e0b":sp.color,background:"#0d1018cc",borderRadius:4,padding:"1px 4px",zIndex:2}}>{cellBks.length}/{ESCRITORIO_MAX}</div>}
                                {cellBks.length>1?(
                                  <div onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setCellPicker({bks:cellBks,x:r.left,y:r.bottom,sp});}}
                                    style={{position:"absolute",inset:2,background:`${sp.color}22`,border:`1px solid ${sp.color}55`,borderRadius:5,padding:"3px 7px",cursor:"pointer",display:"flex",flexDirection:"column",justifyContent:"center",gap:1}}>
                                    <div style={{fontSize:11,fontWeight:700,color:sp.color}}>{cellBks.length} reservas</div>
                                    <div style={{fontSize:8,color:sp.color,opacity:0.7}}>{cellBks.map(b=>b.clientName||"—").join(", ").substring(0,40)}{cellBks.map(b=>b.clientName||"—").join(", ").length>40?"…":""}</div>
                                  </div>
                                ):cellBks.map(bk=>{
                                  const isBlq=bk.isBloqueo;
                                  const bg=isBlq?"#3a1c18":bk.sinCargo?"#333a42":`${sp.color}22`;
                                  const bdr=isBlq?"1px solid #7f1d1d":bk.sinCargo?"1px solid #333a42":`1px solid ${sp.color}55`;
                                  const clr=isBlq?"#c96b5f":bk.sinCargo?"#7f8792":sp.color;
                                  return(
                                  <div key={bk.id} className="dm-bk-cell" onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setCellPicker({bks:[bk],x:r.left,y:r.bottom,sp,selected:bk});}}
                                    style={{position:"absolute",inset:2,background:bg,border:bdr,borderRadius:5,padding:"3px 7px",cursor:"pointer",overflow:"hidden"}}>
                                    <div style={{fontSize:11,fontWeight:700,color:clr,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                      {isBlq?`🚫 ${bk.bloqueoMotivo||"Bloqueado"}`:bk.sinCargo?`🎁 ${bk.sinCargoMotivo||"Sin cargo"}`:bk.clientName}
                                      {!isBlq&&bk.recurrence&&bk.recurrence!="none"&&<span style={{marginLeft:3,fontSize:8,opacity:0.6}}>🔁</span>}
                                    </div>
                                    {!isBlq&&(()=>{
                                      if(bk.sinCargo||getNetAmount(bk)===0) return <div style={{fontSize:8,color:"#c9ad7f",fontWeight:700}}>🎁 Sin cargo</div>;
                                      const net=getNetAmount(bk);
                                      const resta=net-getTotalPagado(bk);
                                      if(resta>0&&net>0) return <div style={{fontSize:8,color:"#f59e0b",fontWeight:700}}>⚠ {fmtMoney(resta)} restante</div>;
                                      if(net>0) return <div style={{fontSize:8,color:"#22c55e",fontWeight:700}}>✓ Pagado</div>;
                                      return null;
                                    })()}
                                    {!isBlq&&!bk.sinCargo&&isPast(bk)&&bk.asistio!==null&&(
                                      <div style={{fontSize:8,fontWeight:700,color:bk.asistio?"#22c55e":"#c96b5f"}}>{bk.asistio?"✓ asistió":"✗ no asistió"}</div>
                                    )}
                                    <div style={{fontSize:8,color:"#334155",marginTop:1}}>{bk.createdBy||""}</div>
                                  </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DÍA ── */}
      {view==="reservas"&&reservaView==="dia"&&(()=>{
        const dk=dateKey(currentDate);
        const dayBookings=expanded.filter(b=>b.date===dk);
        // Compute visible hours for this day
        const dayExtraHours=new Set();
        dayBookings.forEach(b=>{for(let h=b.startHour;h<b.endHour;h++) if(!DEFAULT_HOURS.includes(h)) dayExtraHours.add(h);});
        const dayHours=[...new Set([...DEFAULT_HOURS,...dayExtraHours])].sort((a,b)=>a-b);
        // Space columns grouped
        const COL_GROUPS=[
          {label:"⚽ Fútbol",  color:"#22c55e", spaces:["futbol_11","futbol_8a","futbol_8b","futbol_8c"]},
          {label:"🏑 Hockey",  color:"#3b82f6", spaces:["hockey_11","hockey_7a","hockey_7b"]},
          {label:"☕ Pausa",   color:"#f59e0b", spaces:["pausa"]},
          {label:"💼 Cowork",  color:"#8b5cf6", spaces:["coworking_total","sala_10","sala_4a","sala_4b","escritorio"]},
        ];
        const allCols=COL_GROUPS.flatMap(g=>g.spaces.map(sid=>({sid,group:g})));
        const N=dayHours.length;
        const todayStr=dk===dateKey(new Date());
        const dow=currentDate.toLocaleDateString("es-AR",{weekday:"long"});
        return(
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 110px)",overflow:"hidden"}}>
            {/* Sticky nav bar */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid #333a42",background:"#15181d",flexShrink:0,flexWrap:"wrap"}}>
              <div style={{display:"flex",background:"#1e2228",borderRadius:6,padding:2,border:"1px solid #333a42",gap:1,marginRight:4}}>
                {[["dia","Día"],["semana","Semana"],["mes","Mes"],["lista","Lista"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setReservaView(v)} style={{padding:"3px 9px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:reservaView===v?"linear-gradient(135deg,#e3c99d,#c9ad7f)":"transparent",color:reservaView===v?"#15181d":"#7f8792"}}>{l}</button>
                ))}
              </div>
              <div style={{width:1,height:20,background:"#333a42"}}/>
              <button onClick={()=>{const d=new Date(currentDate);d.setDate(d.getDate()-1);setCurrentDate(d);}} style={navBtn}>‹</button>
              <button onClick={()=>setCurrentDate(new Date())} style={{...navBtn,fontSize:11,padding:"3px 10px"}}>Hoy</button>
              <button onClick={()=>{const d=new Date(currentDate);d.setDate(d.getDate()+1);setCurrentDate(d);}} style={navBtn}>›</button>
              <span style={{fontSize:13,fontWeight:700,color:todayStr?"#c9ad7f":"#b3bac4",textTransform:"capitalize"}}>
                {dow}, {currentDate.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}
              </span>
              {todayStr&&<span style={{fontSize:10,color:"#c9ad7f",fontWeight:700,background:"#c9ad7f20",borderRadius:4,padding:"2px 6px"}}>Hoy</span>}
            </div>
            {/* Grid */}
            <div style={{flex:1,overflowX:"auto",overflowY:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:`48px repeat(${allCols.length},1fr)`,gridTemplateRows:`28px repeat(${N},1fr)`,height:"100%",minWidth:600}}>
                {/* Corner */}
                <div style={{background:"#15181d",borderRight:"1px solid #333a42",borderBottom:"1px solid #333a42"}}/>
                {/* Column headers */}
                {allCols.map(({sid,group},ci)=>{
                  const sp=SPACES[sid];
                  return(
                    <div key={sid} style={{background:"#15181d",borderBottom:"1px solid #333a42",borderRight:ci<allCols.length-1?"1px solid #333a42":"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2px 2px",gap:1}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:sp.color,flexShrink:0}}/>
                      <span style={{fontSize:9,fontWeight:700,color:"#b3bac4",textTransform:"uppercase",letterSpacing:0.3,lineHeight:1.1,textAlign:"center"}}>{sp.short}</span>
                    </div>
                  );
                })}
                {/* Hour rows — render EVERY cell (no null returns, no spanning) */}
                {dayHours.map((hour,hi)=>{
                  const isExtra=!DEFAULT_HOURS.includes(hour);
                  return(
                    <React.Fragment key={hour}>
                      {/* Hour label */}
                      <div style={{background:"#15181d",borderRight:"1px solid #333a42",borderBottom:hi<N-1?"1px solid #1b1f25":"none",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>
                        <span style={{fontSize:10,fontWeight:700,color:isExtra?"#f59e0b":"#b3bac4"}}>{fmtHour(hour)}</span>
                      </div>
                      {/* Cells per space — always rendered */}
                      {allCols.map(({sid},ci)=>{
                        const bk=dayBookings.find(b=>b.space===sid&&b.startHour<=hour&&b.endHour>hour&&b.startHour<hour+1);
                        const isBlocked=bk?.isBloqueo;
                        const isStart=bk&&bk.startHour===hour;
                        const isCont=bk&&!isStart;
                        const sp=SPACES[sid];
                        return(
                          <div
                            key={sid}
                            onClick={()=>{
                              if(bk){setSelected(bk);setModalTab("reserva");}
                              else if(canEdit){setForm({...EMPTY_FORM,space:sid,date:dk,startHour:hour,endHour:hour+0.5});setSelected(null);setModalTab("reserva");}
                            }}
                            style={{
                              borderBottom:hi<N-1?"1px solid #141519":"none",
                              borderRight:ci<allCols.length-1?"1px solid #141519":"none",
                              background:bk?(isBlocked?"#2a1d1b":`${sp.color}18`):"transparent",
                              cursor:bk||canEdit?"pointer":"default",
                              overflow:"hidden",
                              position:"relative",
                            }}
                            onMouseEnter={e=>{if(!bk&&canEdit)e.currentTarget.style.background="#c9ad7f15";}}
                            onMouseLeave={e=>{if(!bk)e.currentTarget.style.background="transparent";}}
                          >
                            {/* Left accent bar for entire booking duration */}
                            {bk&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:isBlocked?"#c96b5f":sp.color}}/>}
                            {/* Content only on start row */}
                            {isStart&&(
                              <div style={{paddingLeft:6,paddingRight:2,height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",overflow:"hidden"}}>
                                {isBlocked?(
                                  <span style={{fontSize:9,fontWeight:700,color:"#c96b5f",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🚫 {bk.bloqueoMotivo||"Bloqueado"}</span>
                                ):(
                                  <>
                                    <span style={{fontSize:9,fontWeight:700,color:"#eef1f5",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bk.clientName||"—"}</span>
                                    <span style={{fontSize:8,color:"#7f8792",lineHeight:1.1}}>{fmtHour(bk.startHour)}–{fmtHour(bk.endHour)}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MES ── */}
      {view==="reservas"&&reservaView==="mes"&&(()=>{
        const grid = getMonthGrid(currentDate);
        const todayKey = dateKey(new Date());
        const curMonth = currentDate.getMonth();
        const curYear  = currentDate.getFullYear();
        return(
          <div style={{overflowX:"auto"}}>
            {/* Nav mes */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid #333a42",background:"#15181d",position:"sticky",top:0,zIndex:10,flexWrap:"wrap"}}>
              <div style={{display:"flex",background:"#1e2228",borderRadius:6,padding:2,border:"1px solid #333a42",gap:1,marginRight:4}}>
                {[["dia","Día"],["semana","Semana"],["mes","Mes"],["lista","Lista"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setReservaView(v)} style={{padding:"3px 9px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:reservaView===v?"linear-gradient(135deg,#e3c99d,#c9ad7f)":"transparent",color:reservaView===v?"#15181d":"#7f8792"}}>{l}</button>
                ))}
              </div>
              <div style={{width:1,height:20,background:"#333a42"}}/>
              <button onClick={()=>{const d=new Date(currentDate);d.setMonth(d.getMonth()-1);setCurrentDate(d);}} style={navBtn}>‹</button>
              <button onClick={()=>setCurrentDate(new Date())} style={{...navBtn,fontSize:11,padding:"3px 10px"}}>Hoy</button>
              <button onClick={()=>{const d=new Date(currentDate);d.setMonth(d.getMonth()+1);setCurrentDate(d);}} style={navBtn}>›</button>
              <span style={{fontSize:13,fontWeight:700,color:"#b3bac4",textTransform:"capitalize"}}>{currentDate.toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</span>
            </div>
            <div style={{minWidth:700,padding:"0 8px 16px"}}>
              {/* Cabecera días */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:2,marginTop:8}}>
                {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d=>(
                  <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#7f8792",textTransform:"uppercase",padding:"4px 0"}}>{d}</div>
                ))}
              </div>
              {/* Grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                {grid.map((date,i)=>{
                  const dk = dateKey(date);
                  const isToday = dk===todayKey;
                  const isCurrentMonth = date.getMonth()===curMonth && date.getFullYear()===curYear;
                  const dayBks = expanded.filter(b=>b.date===dk&&visibleSpaceIds.includes(b.space))
                    .sort((a,b)=>a.startHour-b.startHour);
                  const maxShow = 3;
                  const extra = dayBks.length - maxShow;
                  return(
                    <div key={i} onClick={()=>{setCurrentDate(date);setView("calendar");}}
                      style={{background:isToday?"#c9ad7f0d":"#1e2228",border:`1px solid ${isToday?"#c9ad7f44":"#333a42"}`,borderRadius:8,minHeight:100,padding:"5px 6px",cursor:"pointer",opacity:isCurrentMonth?1:0.4,transition:"background 0.12s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=isToday?"#c9ad7f15":"#2a2f36"}
                      onMouseLeave={e=>e.currentTarget.style.background=isToday?"#c9ad7f0d":"#1e2228"}
                    >
                      {/* Número del día */}
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:isToday?"#c9ad7f":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:12,fontWeight:isToday?800:600,color:isToday?"#15181d":isCurrentMonth?"#eef1f5":"#7f8792"}}>{date.getDate()}</span>
                        </div>
                      </div>
                      {/* Bookings */}
                      {dayBks.slice(0,maxShow).map(bk=>{
                        const sp=SPACES[bk.space];
                        const isBlq=bk.isBloqueo;
                        return(
                          <div key={bk.id} className="dm-bk-cell" onClick={e=>{e.stopPropagation();openEdit(bk);}}
                            style={{background:isBlq?"#3a1c18":bk.sinCargo?"#333a42":`${sp.color}22`,borderLeft:`3px solid ${isBlq?"#c96b5f":bk.sinCargo?"#333a42":sp.color}`,borderRadius:4,padding:"2px 5px",marginBottom:2,overflow:"hidden"}}>
                            <div style={{fontSize:10,fontWeight:700,color:isBlq?"#c96b5f":bk.sinCargo?"#7f8792":sp.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                              {fmtHour(bk.startHour)} {isBlq?`🚫 ${bk.bloqueoMotivo||"Bloqueado"}`:bk.sinCargo?`🎁 ${bk.sinCargoMotivo||"Sin cargo"}`:bk.clientName}
                            </div>
                          </div>
                        );
                      })}
                      {extra>0&&<div style={{fontSize:9,color:"#7f8792",marginTop:2}}>+{extra} más</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LIST ── */}
      {view==="reservas"&&reservaView==="lista"&&(()=>{
        const todayKey=dateKey(new Date());
        let listItems=[...expanded];
        // bloqueos filter
        if(!listShowBloqueos) listItems=listItems.filter(b=>!b.isBloqueo);
        // time range filter
        if(listTimeRange==="proximos") listItems=listItems.filter(b=>b.date>=todayKey);
        else if(listTimeRange==="pasados") listItems=listItems.filter(b=>b.date<todayKey);
        else if(listTimeRange==="semana"){const wk=getWeekDates(listTimeDate).map(d=>dateKey(d));listItems=listItems.filter(b=>wk.includes(b.date));}
        else if(listTimeRange==="mes"){const pfx=`${listTimeDate.getFullYear()}-${pad(listTimeDate.getMonth()+1)}`;listItems=listItems.filter(b=>b.date.startsWith(pfx));}
        else if(listTimeRange==="año"){listItems=listItems.filter(b=>b.date.startsWith(String(listTimeDate.getFullYear())));}
        // space filter
        if(listFilter!=="all") listItems=listItems.filter(b=>b.space===listFilter);
        if(listClientSearch.trim()){
          const q=listClientSearch.toLowerCase();
          listItems=listItems.filter(b=>
            (b.clientName||'').toLowerCase().includes(q)||
            (b.bloqueoMotivo||'').toLowerCase().includes(q)||
            (b.notes||'').toLowerCase().includes(q)
          );
        }
        listItems.sort((a,b)=>a.date!==b.date?a.date.localeCompare(b.date):a.startHour-b.startHour);
        return(
        <div>
          {/* Nav lista */}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid #333a42",background:"#15181d",position:"sticky",top:0,zIndex:10,flexWrap:"wrap"}}>
            <div style={{display:"flex",background:"#1e2228",borderRadius:6,padding:2,border:"1px solid #333a42",gap:1}}>
              {[["dia","Día"],["semana","Semana"],["mes","Mes"],["lista","Lista"]].map(([v,l])=>(
                <button key={v} onClick={()=>setReservaView(v)} style={{padding:"3px 9px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:reservaView===v?"linear-gradient(135deg,#e3c99d,#c9ad7f)":"transparent",color:reservaView===v?"#15181d":"#7f8792"}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{padding:16,maxWidth:860,margin:"0 auto"}}>
          {/* Filtros */}
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            {/* Búsqueda */}
            <input value={listClientSearch} onChange={e=>setListClientSearch(e.target.value)} placeholder="🔍 Buscar cliente, motivo…" style={{...inpSt,maxWidth:200}}/>
            {/* Time range */}
            <div style={{display:"flex",background:"#15181d",borderRadius:8,padding:3,border:"1px solid #333a42",gap:2}}>
              {[["proximos","Próximos"],["todos","Todos"],["pasados","Pasados"],["semana","Semana"],["mes","Mes"],["año","Año"]].map(([v,l])=>(
                <button key={v} onClick={()=>{setListTimeRange(v);if(v!==listTimeRange)setListTimeDate(new Date());}} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:listTimeRange===v?"#c9ad7f":"transparent",color:listTimeRange===v?"#15181d":"#7f8792"}}>{l}</button>
              ))}
            </div>
            {/* Date nav para semana/mes/año */}
            {["semana","mes","año"].includes(listTimeRange)&&(
              <div style={{display:"flex",alignItems:"center",gap:5,background:"#15181d",borderRadius:8,padding:"3px 6px",border:"1px solid #333a42"}}>
                <button onClick={()=>{const d=new Date(listTimeDate);if(listTimeRange==="semana")d.setDate(d.getDate()-7);else if(listTimeRange==="mes")d.setMonth(d.getMonth()-1);else d.setFullYear(d.getFullYear()-1);setListTimeDate(d);}} style={navBtn}>‹</button>
                <span style={{fontSize:11,fontWeight:700,color:"#b3bac4",minWidth:140,textAlign:"center"}}>
                  {listTimeRange==="semana"&&(()=>{const wk=getWeekDates(listTimeDate);return`${wk[0].getDate()} ${wk[0].toLocaleDateString("es-AR",{month:"short"})} – ${wk[6].getDate()} ${wk[6].toLocaleDateString("es-AR",{month:"short",year:"numeric"})}`;})()}
                  {listTimeRange==="mes"&&listTimeDate.toLocaleDateString("es-AR",{month:"long",year:"numeric"})}
                  {listTimeRange==="año"&&String(listTimeDate.getFullYear())}
                </span>
                <button onClick={()=>{const d=new Date(listTimeDate);if(listTimeRange==="semana")d.setDate(d.getDate()+7);else if(listTimeRange==="mes")d.setMonth(d.getMonth()+1);else d.setFullYear(d.getFullYear()+1);setListTimeDate(d);}} style={navBtn}>›</button>
                <button onClick={()=>setListTimeDate(new Date())} style={{...navBtn,fontSize:10,padding:"2px 7px"}}>Hoy</button>
              </div>
            )}
            {/* Space filter */}
            <select value={listFilter} onChange={e=>setListFilter(e.target.value)} style={selSt}>
              <option value="all">Todos los espacios</option>
              {Object.values(SPACES).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {/* Bloqueos toggle */}
            <button onClick={()=>setListShowBloqueos(p=>!p)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${listShowBloqueos?"#c96b5f":"#333a42"}`,background:listShowBloqueos?"#c96b5f18":"transparent",color:listShowBloqueos?"#c96b5f":"#7f8792",cursor:"pointer",fontSize:11,fontWeight:600}}>
              🚫 {listShowBloqueos?"Ocultar bloqueos":"Mostrar bloqueos"}
            </button>
            <span style={{fontSize:11,color:"#7f8792",marginLeft:"auto"}}>{listItems.length} resultado{listItems.length!==1?"s":""}</span>
          </div>
          {listItems.map(bk=>{
            const sp=SPACES[bk.space];
            const pc=payColors(bk);
            const net=getNetAmount(bk);
            const isBlq=bk.isBloqueo;
            return(
              <div key={bk.id} className="dm-bk-row" onClick={()=>openEdit(bk)} style={{background:isBlq?"#1c1210":"#15181d",border:`1px solid ${isBlq?"#7f1d1d33":sp.color+"2a"}`,borderLeft:`4px solid ${isBlq?"#c96b5f":sp.color}`,borderRadius:10,padding:"10px 14px",marginBottom:7,cursor:"pointer",display:"flex",gap:14,alignItems:"center",transition:"background 0.12s"}}
                onMouseEnter={e=>e.currentTarget.style.background=isBlq?"#1e1210":"#141b28"}
                onMouseLeave={e=>e.currentTarget.style.background=isBlq?"#1c1210":"#15181d"}
              >
                <div style={{minWidth:76}}>
                  <div style={{fontSize:10,color:"#7f8792"}}>{new Date(bk.date+"T12:00").toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"2-digit"})}</div>
                  <div style={{fontSize:13,fontWeight:700}}>{fmtHour(bk.startHour)}–{fmtHour(bk.endHour)}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:isBlq?"#c96b5f":"#eef1f5"}}>
                    {isBlq?`🚫 ${bk.bloqueoMotivo||"Bloqueado"}`:bk.sinCargo?`🎁 ${bk.sinCargoMotivo||"Sin cargo"}`:bk.clientName}
                    {!isBlq&&bk.recurrence&&bk.recurrence!="none"&&<span style={{marginLeft:6,fontSize:10,color:"#60a5fa"}}>🔁</span>}
                  </div>
                  <div style={{fontSize:11,color:"#7f8792"}}>{sp.label}{!isBlq&&bk.clientOrg?` · ${bk.clientOrg}`:""}</div>
                  {bk.createdBy&&<div style={{fontSize:9,color:"#334155"}}>por {bk.createdBy}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  {isBlq?<span style={{fontSize:10,color:"#c96b5f",fontWeight:700}}>Bloqueo</span>:
                  bk.sinCargo?<span style={{fontSize:10,color:"#7f8792"}}>Sin cargo</span>:(
                    <>
                      <div style={{fontSize:14,fontWeight:800,color:"#22c55e"}}>{fmtMoney(net)}</div>
                      {bk.descuentoTipo&&bk.descuentoTipo!=="none"&&<div style={{fontSize:9,color:"#f59e0b"}}>✂ desc. aplicado</div>}
                      <div style={{fontSize:9,padding:"2px 8px",borderRadius:20,fontWeight:700,display:"inline-block",marginTop:2,background:pc.bg,color:pc.fg}}>{payLabel(bk)}</div>
                      {isPast(bk)&&bk.asistio!==null&&<div style={{fontSize:9,fontWeight:700,marginTop:2,color:bk.asistio?"#22c55e":"#c96b5f"}}>{bk.asistio?"✓ asistió":"✗ no asistió"}</div>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {listItems.length===0&&<div style={{textAlign:"center",padding:60,color:"#7f8792"}}>No hay registros para este filtro.</div>}
          </div>
        </div>
        );
      })()}

      {/* ── CLIENTES ── */}
      {view==="clientes"&&(()=>{
        const SPACE_FILTERS=[
          {v:"all",l:"Todos"},
          {v:"futbol",l:"⚽ Fútbol (todos)"},
          {v:"futbol_11",l:"F11"},
          {v:"futbol_8",l:"F8 (todas)"},
          {v:"hockey",l:"🏑 Hockey (todos)"},
          {v:"hockey_11",l:"H11"},
          {v:"hockey_7",l:"H7 (todas)"},
          {v:"coworking",l:"💼 Coworking"},
        ];
        const SPACE_IDS_MAP={
          futbol:["futbol_11","futbol_8a","futbol_8b","futbol_8c"],
          futbol_11:["futbol_11"],
          futbol_8:["futbol_8a","futbol_8b","futbol_8c"],
          hockey:["hockey_11","hockey_7a","hockey_7b"],
          hockey_11:["hockey_11"],
          hockey_7:["hockey_7a","hockey_7b"],
          coworking:["coworking_total","sala_10","sala_4a","sala_4b","escritorio"],
        };
        const isIncomplete=c=>!c.name||!c.phone||!c.email;
        let shown=[...clients];
        if(clientListSearch) shown=shown.filter(c=>(c.name||"").toLowerCase().includes(clientListSearch.toLowerCase())||(c.phone||"").includes(clientListSearch)||(c.email||"").toLowerCase().includes(clientListSearch.toLowerCase()));
        if(clientFilter==="incompletos") shown=shown.filter(isIncomplete);
        if(clientSpaceFilter!=="all"){
          const ids=SPACE_IDS_MAP[clientSpaceFilter]||[clientSpaceFilter];
          shown=shown.filter(c=>expanded.some(b=>b.clientId===c.id&&ids.includes(b.space)));
        }
        shown.sort((a,b)=>{
          const ha=clientHistory(a.id),hb=clientHistory(b.id);
          const ta=ha.filter(x=>!x.sinCargo&&!x.isBloqueo).reduce((s,x)=>s+getNetAmount(x),0);
          const tb=hb.filter(x=>!x.sinCargo&&!x.isBloqueo).reduce((s,x)=>s+getNetAmount(x),0);
          if(clientSort==="name") return (a.name||"").localeCompare(b.name||"");
          if(clientSort==="count_desc") return hb.length-ha.length;
          if(clientSort==="count_asc") return ha.length-hb.length;
          if(clientSort==="monto_desc") return tb-ta;
          if(clientSort==="monto_asc") return ta-tb;
          return 0;
        });
        const incompleteCount=clients.filter(isIncomplete).length;
        return(
        <div style={{padding:16,maxWidth:860,margin:"0 auto"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <span style={{fontSize:13,fontWeight:700,color:"#b3bac4"}}>{shown.length} / {clients.length} clientes{incompleteCount>0&&<span style={{marginLeft:8,fontSize:11,color:"#f59e0b",fontWeight:700}}>⚠ {incompleteCount} incompletos</span>}</span>
            <div style={{display:"flex",gap:8}}>
              {isAdmin&&<button onClick={()=>{const g=findDuplicates();setDupGroups(g);const init={};g.forEach((gr,i)=>{const best=gr.clients.reduce((a,b)=>clientHistory(b.id).length>clientHistory(a.id).length?b:a);init[i]=best.id;});setDupKeep(init);setDupModal(true);}} style={{background:"#1e2228",color:"#f59e0b",border:"1px solid #f59e0b44",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontWeight:700,fontSize:12}}>🔍 Duplicados</button>}
              {canEdit&&<button onClick={()=>openClientModal()} style={{background:"linear-gradient(135deg,#e3c99d 0%,#c9ad7f 60%,#a98d63 100%)",color:"#15181d",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontWeight:700,fontSize:12}}>+ Nuevo cliente</button>}
            </div>
          </div>
          {/* Filtros */}
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            <input value={clientListSearch} onChange={e=>setClientListSearch(e.target.value)} placeholder="🔍 Buscar por nombre, tel, email…" style={{...inpSt,maxWidth:220}}/>
            <div style={{display:"flex",background:"#15181d",borderRadius:8,padding:3,border:"1px solid #333a42",gap:2}}>
              <button onClick={()=>setClientFilter("all")} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:clientFilter==="all"?"#c9ad7f":"transparent",color:clientFilter==="all"?"#15181d":"#7f8792"}}>Todos</button>
              <button onClick={()=>setClientFilter("incompletos")} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:clientFilter==="incompletos"?"#f59e0b":"transparent",color:clientFilter==="incompletos"?"#000":"#7f8792"}}>⚠ Incompletos</button>
            </div>
            <select value={clientSpaceFilter} onChange={e=>setClientSpaceFilter(e.target.value)} style={selSt}>
              {SPACE_FILTERS.map(({v,l})=><option key={v} value={v}>{l}</option>)}
            </select>
            <select value={clientSort} onChange={e=>setClientSort(e.target.value)} style={selSt}>
              <option value="count_desc">↓ Más alquileres</option>
              <option value="count_asc">↑ Menos alquileres</option>
              <option value="monto_desc">↓ Mayor monto</option>
              <option value="monto_asc">↑ Menor monto</option>
              <option value="name">A–Z nombre</option>
            </select>
          </div>
          {shown.length===0&&<div style={{textAlign:"center",padding:60,color:"#7f8792"}}><div style={{fontSize:32,marginBottom:10}}>👥</div><div>Sin clientes para este filtro.</div></div>}
          {shown.map(c=>{
            const hist=clientHistory(c.id);
            const total=hist.filter(b=>!b.sinCargo&&!b.isBloqueo).reduce((s,b)=>s+getNetAmount(b),0);
            const incomplete=isIncomplete(c);
            const missing=[];
            if(!c.name) missing.push("nombre");
            if(!c.phone) missing.push("teléfono");
            if(!c.email) missing.push("email");
            return(
              <div key={c.id} className="dm-bk-row" onClick={()=>canEdit&&openClientModal(c)} style={{background:"#15181d",border:`1px solid ${incomplete?"#f59e0b33":"#333a42"}`,borderLeft:`4px solid ${incomplete?"#f59e0b":"#333a42"}`,borderRadius:12,padding:"14px 16px",marginBottom:8,cursor:canEdit?"pointer":"default",transition:"background 0.12s"}}
                onMouseEnter={e=>{if(canEdit)e.currentTarget.style.background="#141b28";}}
                onMouseLeave={e=>e.currentTarget.style.background="#15181d"}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:800,display:"flex",alignItems:"center",gap:8}}>
                      {c.name||<span style={{color:"#f59e0b",fontStyle:"italic"}}>Sin nombre</span>}
                      {incomplete&&<span style={{fontSize:10,background:"#f59e0b22",color:"#f59e0b",padding:"2px 7px",borderRadius:20,fontWeight:700}}>⚠ falta: {missing.join(", ")}</span>}
                    </div>
                    {c.org&&<div style={{fontSize:11,color:"#7f8792"}}>{c.org}</div>}
                  </div>
                  <div style={{textAlign:"right",marginLeft:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>{fmtMoney(total)}</div>
                    <div style={{fontSize:10,color:"#7f8792"}}>{hist.length} alquiler{hist.length!==1?"es":""}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  {c.phone?<span style={{fontSize:11,color:"#7f8792"}}>📱 {c.phone}</span>:<span style={{fontSize:11,color:"#f59e0b55"}}>📱 sin tel.</span>}
                  {c.email?<span style={{fontSize:11,color:"#7f8792"}}>✉ {c.email}</span>:<span style={{fontSize:11,color:"#f59e0b55"}}>✉ sin email</span>}
                </div>
                {hist.length>0&&<div style={{marginTop:8,display:"flex",gap:5,flexWrap:"wrap"}}>{hist.slice(-5).map(bk=><span key={bk.id} style={{fontSize:9,background:"#333a42",borderRadius:6,padding:"2px 7px",color:"#7f8792"}}>{new Date(bk.date+"T12:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"})} · {SPACES[bk.space]?.short}</span>)}{hist.length>5&&<span style={{fontSize:9,color:"#7f8792"}}>+{hist.length-5} más</span>}</div>}
              </div>
            );
          })}
        </div>
        );
      })()}

      {/* ── FINANZAS ── */}
      {view==="finanzas"&&canFinance&&(
        <div style={{padding:16,maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
            {/* Tipo de período */}
            <div style={{display:"flex",background:"#15181d",borderRadius:8,padding:3,border:"1px solid #333a42"}}>
              {[["semana","Semana"],["mes","Mes"],["año","Año"]].map(([v,l])=>(
                <button key={v} onClick={()=>{setFinPeriod(v);setFinDate(new Date());}} style={{padding:"5px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:finPeriod===v?"#c9ad7f":"transparent",color:finPeriod===v?"#15181d":"#7f8792"}}>{l}</button>
              ))}
            </div>
            {/* Navegación */}
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#15181d",borderRadius:8,padding:"3px 6px",border:"1px solid #333a42"}}>
              <button onClick={()=>{const d=new Date(finDate);if(finPeriod==="semana")d.setDate(d.getDate()-7);else if(finPeriod==="mes")d.setMonth(d.getMonth()-1);else d.setFullYear(d.getFullYear()-1);setFinDate(d);}} style={navBtn}>‹</button>
              <span style={{fontSize:12,fontWeight:700,color:"#b3bac4",minWidth:160,textAlign:"center"}}>
                {finPeriod==="semana"&&(()=>{const wk=getWeekDates(finDate);return `${wk[0].getDate()} ${wk[0].toLocaleDateString("es-AR",{month:"short"})} – ${wk[6].getDate()} ${wk[6].toLocaleDateString("es-AR",{month:"short",year:"numeric"})}`;})()}
                {finPeriod==="mes"&&finDate.toLocaleDateString("es-AR",{month:"long",year:"numeric"})}
                {finPeriod==="año"&&String(finDate.getFullYear())}
              </span>
              <button onClick={()=>{const d=new Date(finDate);if(finPeriod==="semana")d.setDate(d.getDate()+7);else if(finPeriod==="mes")d.setMonth(d.getMonth()+1);else d.setFullYear(d.getFullYear()+1);setFinDate(d);}} style={navBtn}>›</button>
              <button onClick={()=>setFinDate(new Date())} style={{...navBtn,fontSize:10,padding:"2px 8px"}}>Hoy</button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            {[
              {label:"Total facturado",val:fmtMoney(finData.total),color:"#eef1f5",sub:`${finData.count} alquiler${finData.count!==1?"es":""}`},
              {label:"Cobrado",val:fmtMoney(finData.cobrado),color:"#22c55e"},
              {label:"Pendiente de cobro",val:fmtMoney(finData.pendiente),color:finData.pendiente>0?"#f59e0b":"#22c55e"},
            ].map(c=>(
              <div key={c.label} style={{background:"#15181d",border:"1px solid #333a42",borderRadius:12,padding:"18px 20px"}}>
                <div style={{fontSize:10,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{c.label}</div>
                <div style={{fontSize:24,fontWeight:800,color:c.color}}>{c.val}</div>
                {c.sub&&<div style={{fontSize:10,color:"#7f8792",marginTop:3}}>{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* Formas de pago */}
          {finData.cobrado>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Cobrado por forma de pago</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {finData.FORMAS.map(([f,l])=>finData.byForma[f]>0&&(
                  <div key={f} style={{background:"#15181d",border:"1px solid #333a42",borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#b3bac4"}}>{l}</span>
                    <span style={{fontSize:15,fontWeight:800,color:"#22c55e"}}>{fmtMoney(finData.byForma[f])}</span>
                  </div>
                ))}
                {finData.FORMAS.every(([f])=>!finData.byForma[f])&&(
                  <div style={{gridColumn:"1/-1",fontSize:11,color:"#7f8792",padding:"8px 0"}}>Sin pagos registrados con forma de pago en este período.</div>
                )}
              </div>
            </div>
          )}

          {/* Saldos pendientes — útil para cierre de caja */}
          {finData.pending.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,color:"#f59e0b",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⚠ Saldos pendientes de cobro ({finData.pending.length})</div>
              {finData.pending.map(bk=>(
                <div key={bk.id} className="dm-bk-row" onClick={()=>openEdit(bk)} style={{background:"#181206",border:"1px solid #f59e0b33",borderLeft:"4px solid #f59e0b",borderRadius:10,padding:"10px 14px",marginBottom:6,cursor:"pointer",display:"flex",gap:14,alignItems:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#20190e"}
                  onMouseLeave={e=>e.currentTarget.style.background="#181206"}
                >
                  <div style={{minWidth:76}}>
                    <div style={{fontSize:10,color:"#a16207"}}>{new Date(bk.date+"T12:00").toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"2-digit"})}</div>
                    <div style={{fontSize:13,fontWeight:700}}>{fmtHour(bk.startHour)}–{fmtHour(bk.endHour)}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700}}>{bk.clientName}</div>
                    <div style={{fontSize:11,color:"#a16207"}}>{SPACES[bk.space]?.label}</div>
                    {isPast(bk)&&bk.asistio!==null&&<div style={{fontSize:10,fontWeight:700,marginTop:2,color:bk.asistio?"#22c55e":"#c96b5f"}}>{bk.asistio?"✓ asistió":"✗ no asistió"}</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,color:"#a16207"}}>Cobrado: {fmtMoney(getTotalPagado(bk))}</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#f59e0b"}}>Resta: {fmtMoney((Number(bk.totalAmount)||0)-getTotalPagado(bk))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {Object.keys(finData.bySpace).length>0&&(
            <div>
              <div style={{fontSize:10,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Detalle por espacio</div>
              {Object.entries(finData.bySpace).map(([spId,d])=>{
                const sp=SPACES[spId], pct=d.total>0?Math.round((d.cobrado/d.total)*100):0;
                return(
                  <div key={spId} style={{background:"#15181d",border:`1px solid ${sp.color}2a`,borderLeft:`4px solid ${sp.color}`,borderRadius:10,padding:"12px 16px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div><span style={{fontWeight:700,fontSize:13}}>{sp.label}</span><span style={{fontSize:10,color:"#7f8792",marginLeft:8}}>{d.count} alquiler{d.count!==1?"es":""}</span></div>
                      <div><span style={{fontWeight:800,color:"#22c55e",fontSize:14}}>{fmtMoney(d.cobrado)}</span><span style={{color:"#7f8792",fontSize:12}}> / {fmtMoney(d.total)}</span></div>
                    </div>
                    <div style={{background:"#333a42",borderRadius:4,height:5}}><div style={{width:`${pct}%`,background:sp.color,height:"100%",borderRadius:4}}/></div>
                    {d.total-d.cobrado>0&&<div style={{fontSize:10,color:"#f59e0b",marginTop:4}}>⚠ Pendiente: {fmtMoney(d.total-d.cobrado)}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── USUARIOS (solo admin) ── */}
      {view==="usuarios"&&isAdmin&&(
        <div style={{padding:16,maxWidth:760,margin:"0 auto"}}>
          {/* Sub-tabs */}
          <div style={{display:"flex",background:"#1e2228",borderRadius:8,padding:3,border:"1px solid #333a42",gap:2,marginBottom:18,width:"fit-content"}}>
            {[["usuarios","⚙️ Usuarios"],["historial","📋 Historial"]].map(([v,l])=>(
              <button key={v} onClick={()=>setUsuariosTab(v)} style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:usuariosTab===v?"linear-gradient(135deg,#e3c99d,#c9ad7f)":"transparent",color:usuariosTab===v?"#15181d":"#7f8792"}}>{l}</button>
            ))}
          </div>

          {usuariosTab==="usuarios"&&(<>
          {/* New/edit user form */}
          <div style={{background:"#15181d",border:"1px solid #333a42",borderRadius:12,padding:18,marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"#b3bac4",marginBottom:12}}>{editingUser?"Editar usuario":"Nuevo usuario"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <FG label="Nombre"><input value={userForm.name} onChange={e=>setUserForm(f=>({...f,name:e.target.value}))} placeholder="Nombre completo" style={inpSt}/></FG>
              <FG label="Usuario (login)"><input value={userForm.username} onChange={e=>setUserForm(f=>({...f,username:e.target.value}))} placeholder="usuario" style={inpSt}/></FG>
              <FG label="Contraseña">
                <div style={{position:"relative"}}>
                  <input type={showUserPwd?"text":"password"} value={userForm.password} onChange={e=>setUserForm(f=>({...f,password:e.target.value}))} placeholder="contraseña" style={{...inpSt,paddingRight:40}}/>
                  <button type="button" onClick={()=>setShowUserPwd(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#7f8792",fontSize:16,padding:2}}>
                    {showUserPwd?"🙈":"👁"}
                  </button>
                </div>
              </FG>
              <FG label="Rol">
                <select value={userForm.role} onChange={e=>setUserForm(f=>({...f,role:e.target.value}))} style={inpSt}>
                  <option value="admin">Administrador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="readonly">Solo lectura</option>
                </select>
              </FG>
              <FG label="Correo electrónico (recuperación)">
                <input value={userForm.email||""} onChange={e=>setUserForm(f=>({...f,email:e.target.value}))} placeholder="correo@ejemplo.com" style={inpSt}/>
              </FG>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              {editingUser&&<button onClick={()=>{setEditingUser(null);setUserForm({name:"",username:"",password:"",role:"vendedor",email:""});}} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #333a42",background:"transparent",color:"#b3bac4",cursor:"pointer",fontSize:12}}>Cancelar</button>}
              <button onClick={saveUser} disabled={!userForm.name||!userForm.username||!userForm.password} style={{padding:"7px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:(!userForm.name||!userForm.username||!userForm.password)?"#333a42":"#c9ad7f",color:(!userForm.name||!userForm.username||!userForm.password)?"#7f8792":"#15181d"}}>
                {editingUser?"Guardar cambios":"Agregar usuario"}
              </button>
            </div>
          </div>

          {/* User list */}
          {users.map(u=>(
            <div key={u.id} style={{background:"#15181d",border:"1px solid #333a42",borderRadius:10,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#e3c99d,#c9ad7f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#15181d",flexShrink:0}}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700}}>{u.name}</div>
                <div style={{fontSize:11,color:"#7f8792"}}>@{u.username}{u.email&&<span style={{marginLeft:8,color:"#333a42"}}>· {u.email}</span>}</div>
              </div>
              <div style={{fontSize:10,padding:"3px 10px",borderRadius:20,fontWeight:700,
                background:u.role==="admin"?"#f59e0b22":u.role==="vendedor"?"#c9ad7f22":"#3b82f622",
                color:u.role==="admin"?"#f59e0b":u.role==="vendedor"?"#c9ad7f":"#60a5fa"}}>
                {u.role==="admin"?"Admin":u.role==="vendedor"?"Vendedor":"Solo lectura"}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setEditingUser(u);setUserForm({name:u.name,username:u.username,password:u.password,role:u.role,email:u.email||""});}} style={{padding:"5px 10px",borderRadius:7,border:"1px solid #333a42",background:"transparent",color:"#b3bac4",cursor:"pointer",fontSize:11}}>Editar</button>
                {u.id!==currentUser.id&&<button onClick={()=>delUser(u.id)} style={{padding:"5px 10px",borderRadius:7,border:"1px solid #c96b5f44",background:"#c96b5f10",color:"#c96b5f",cursor:"pointer",fontSize:11}}>Eliminar</button>}
              </div>
            </div>
          ))}
          </>)}

          {usuariosTab==="historial"&&(()=>{
            const actionColors={
              "Login":"#60a5fa","Reserva creada":"#22c55e","Reserva editada":"#f59e0b",
              "Reserva eliminada":"#c96b5f","Pago registrado":"#c9ad7f",
              "Asistencia registrada":"#a78bfa","Perfil actualizado":"#7f8792",
            };
            const logFiltered = activityLog||[];
            return(
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontSize:11,color:"#7f8792"}}>{logFiltered.length} registros</div>
                  {logFiltered.length>0&&<button onClick={()=>setConfirmModal({title:"¿Limpiar historial?",body:"Se borrarán todos los registros de actividad.",danger:true,onConfirm:()=>{setActivityLog([]);setConfirmModal(null);}})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #c96b5f44",background:"#c96b5f10",color:"#c96b5f",cursor:"pointer",fontSize:10}}>Limpiar historial</button>}
                </div>
                {logFiltered.length===0&&<div style={{textAlign:"center",padding:60,color:"#7f8792"}}>No hay actividad registrada todavía.</div>}
                {logFiltered.map(entry=>{
                  const col=actionColors[entry.action]||"#7f8792";
                  const dt=new Date(entry.ts);
                  const dtStr=dt.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"})+" "+dt.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
                  return(
                    <div key={entry.id} style={{background:"#15181d",border:"1px solid #333a42",borderRadius:8,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"flex-start",gap:12}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0,marginTop:4}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:11,fontWeight:700,color:col}}>{entry.action}</span>
                          <span style={{fontSize:10,color:"#b3bac4",fontWeight:600}}>{entry.user}</span>
                        </div>
                        {entry.detail&&<div style={{fontSize:10,color:"#7f8792",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{entry.detail}</div>}
                      </div>
                      <div style={{fontSize:9,color:"#333a42",flexShrink:0,textAlign:"right",lineHeight:1.4}}>{dtStr}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── CELL PICKER (non-modal, múltiples reservas) ── */}
      {cellPicker&&(()=>{
        const {bks,x,y,sp,selected}=cellPicker;
        const left=Math.min(x,window.innerWidth-280);
        const top=Math.min(y+4,window.innerHeight-340);
        return(
          <>
            <div style={{position:"fixed",inset:0,zIndex:98}} onClick={()=>setCellPicker(null)}/>
            <div style={{position:"fixed",left,top,zIndex:99,background:"#141b28",border:`1px solid ${sp.color}55`,borderRadius:12,minWidth:260,maxWidth:320,boxShadow:"0 8px 32px #00000088",overflow:"hidden"}}>
              {/* Header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderBottom:"1px solid #333a42"}}>
                {selected?(
                  <button onClick={()=>setCellPicker(p=>({...p,selected:null}))} style={{background:"none",border:"none",color:sp.color,cursor:"pointer",fontSize:11,fontWeight:700,padding:0,display:"flex",alignItems:"center",gap:4}}>← Volver</button>
                ):(
                  <span style={{fontSize:11,fontWeight:700,color:sp.color}}>{bks.length} reservas · {sp.label}</span>
                )}
                <button onClick={()=>setCellPicker(null)} style={{background:"none",border:"none",color:"#7f8792",cursor:"pointer",fontSize:14,lineHeight:1,padding:"0 2px"}}>✕</button>
              </div>

              {selected?(()=>{
                // ── Vista detalle ──
                const bk=selected;
                const isBlq=bk.isBloqueo;
                const net=getNetAmount(bk);
                const pagado=getTotalPagado(bk);
                const resta=net-pagado;
                const clr=isBlq?"#c96b5f":bk.sinCargo?"#7f8792":sp.color;
                const dateStr=bk.date?new Date(bk.date+"T12:00").toLocaleDateString("es-AR",{weekday:"long",day:"2-digit",month:"long"}):"";
                const client=clients.find(c=>c.id===bk.clientId);
                return(
                  <div style={{padding:"12px 14px"}}>
                    {/* Nombre */}
                    <div style={{fontSize:16,fontWeight:800,color:clr,marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {isBlq?`🚫 ${bk.bloqueoMotivo||"Bloqueado"}`:bk.sinCargo?`🎁 ${bk.sinCargoMotivo||"Sin cargo"}`:bk.clientName||"—"}
                      {!isBlq&&bk.recurrence&&bk.recurrence!="none"&&<span style={{marginLeft:6,fontSize:10,color:"#7f8792"}}>🔁 recurrente</span>}
                    </div>
                    {/* Fecha y hora */}
                    <div style={{fontSize:11,color:"#b3bac4",marginBottom:10,textTransform:"capitalize"}}>{dateStr} · {fmtHour(bk.startHour)}–{fmtHour(bk.endHour)}hs</div>
                    {/* Info pills */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                      {client?.phone&&<span style={{fontSize:10,background:"#333a42",borderRadius:6,padding:"3px 8px",color:"#b3bac4"}}>📞 {client.phone}</span>}
                      {!isBlq&&!bk.sinCargo&&net>0&&(
                        <span style={{fontSize:10,background:resta>0?"#3a1a10":"#0a2a18",borderRadius:6,padding:"3px 8px",color:resta>0?"#f97316":"#22c55e",fontWeight:700}}>
                          {resta>0?`⚠ Debe ${fmtMoney(resta)}`:`✓ Pagado ${fmtMoney(net)}`}
                        </span>
                      )}
                      {bk.sinCargo&&<span style={{fontSize:10,background:"#333a42",borderRadius:6,padding:"3px 8px",color:"#7f8792"}}>Sin cargo</span>}
                      {isPast(bk)&&bk.asistio!==null&&(
                        <span style={{fontSize:10,background:"#333a42",borderRadius:6,padding:"3px 8px",color:bk.asistio?"#22c55e":"#c96b5f",fontWeight:700}}>
                          {bk.asistio?"✓ Asistió":"✗ No asistió"}
                        </span>
                      )}
                    </div>
                    {/* Notas */}
                    {bk.notes&&<div style={{fontSize:10,color:"#7f8792",background:"#333a42",borderRadius:6,padding:"6px 8px",marginBottom:10,lineHeight:1.5}}>📝 {bk.notes}</div>}
                    {/* Botón editar */}
                    <button onClick={()=>{setCellPicker(null);openEdit(bk);}}
                      style={{width:"100%",padding:"9px 0",borderRadius:8,border:`1px solid ${sp.color}88`,background:`${sp.color}22`,color:sp.color,fontWeight:700,fontSize:13,cursor:"pointer",letterSpacing:"0.03em"}}>
                      ✏️ Editar reserva
                    </button>
                  </div>
                );
              })():(
                // ── Vista lista ──
                <div style={{padding:"8px 10px"}}>
                  {bks.map(bk=>{
                    const isBlq=bk.isBloqueo;
                    const net=getNetAmount(bk);
                    const pagado=getTotalPagado(bk);
                    const resta=net-pagado;
                    const clr=isBlq?"#c96b5f":bk.sinCargo?"#7f8792":sp.color;
                    return(
                      <div key={bk.id} onClick={()=>setCellPicker(p=>({...p,selected:bk}))}
                        style={{padding:"7px 10px",borderRadius:8,marginBottom:5,cursor:"pointer",background:"#333a42",border:"1px solid #333a42",transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#253048"}
                        onMouseLeave={e=>e.currentTarget.style.background="#333a42"}>
                        <div style={{fontSize:12,fontWeight:700,color:clr,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {isBlq?`🚫 ${bk.bloqueoMotivo||"Bloqueado"}`:bk.sinCargo?`🎁 ${bk.sinCargoMotivo||"Sin cargo"}`:bk.clientName||"—"}
                          {!isBlq&&bk.recurrence&&bk.recurrence!="none"&&<span style={{marginLeft:4,fontSize:9,opacity:0.5}}>🔁</span>}
                        </div>
                        {!isBlq&&!bk.sinCargo&&net>0&&(
                          <div style={{fontSize:10,marginTop:2,color:resta>0?"#f59e0b":"#22c55e",fontWeight:600}}>
                            {resta>0?`⚠ ${fmtMoney(resta)} restante`:`✓ Pagado · ${fmtMoney(net)}`}
                          </div>
                        )}
                        <div style={{fontSize:9,color:"#7f8792",marginTop:1}}>{fmtHour(bk.startHour)}–{fmtHour(bk.endHour)}{bk.createdBy?` · ${bk.createdBy}`:""}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* ── MODAL ALQUILER ── */}
      {modal&&(isMobile?(
        <BookingBottomSheet
          form={form} setForm={setForm} editing={editing}
          onSave={save} onClose={()=>setModal(false)} onDelete={()=>del(editing?.id)}
          clients={clients} conflict={conflict} canEdit={canEdit} isAdmin={isAdmin}
          SPACES={SPACES} ALL_HOURS={ALL_HOURS} fmtMoney={fmtMoney}
          getNetAmount={getNetAmount} getTotalPagado={getTotalPagado}
          dateKey={dateKey} pad={pad} isPast={isPast}
          clientPicker={clientPicker} setClientPicker={setClientPicker}
        />
      ):(
        <div className="dm-overlay" style={{position:"fixed",inset:0,background:"rgba(24,22,21,0.68)",backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:100,padding:16,paddingTop:40,overflowY:"auto"}}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="dm-modal-pop" style={{background:"linear-gradient(160deg,#1e2228 0%,#15181d 100%)",border:"1px solid #333a42",borderRadius:8,width:"100%",maxWidth:520,boxShadow:"0 20px 50px -12px rgba(0,0,0,0.7)",padding:"18px 22px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:800}}>{editing?"Editar alquiler":"Nuevo alquiler"}</h2>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {editing&&<button onClick={()=>setAuditModal(editing)} style={{background:"none",border:"1px solid #333a42",color:"#7f8792",cursor:"pointer",fontSize:11,borderRadius:6,padding:"3px 8px"}}>🕑 Historial</button>}
                <button onClick={()=>setModal(false)} style={{background:"none",border:"none",color:"#7f8792",cursor:"pointer",fontSize:22}}>×</button>
              </div>
            </div>

            {/* Audit info */}
            {editing&&editing.createdBy&&(
              <div style={{background:"#1e2228",borderRadius:8,padding:"7px 12px",marginBottom:14,fontSize:10,color:"#7f8792",display:"flex",gap:16,flexWrap:"wrap"}}>
                <span>✏️ Creado por <b style={{color:"#7f8792"}}>{editing.createdBy}</b> · {fmtDateTime(editing.createdAt)}</span>
                {editing.updatedBy&&editing.updatedAt!==editing.createdAt&&<span>🔄 Modificado por <b style={{color:"#7f8792"}}>{editing.updatedBy}</b> · {fmtDateTime(editing.updatedAt)}</span>}
              </div>
            )}

            {/* Tipo de entrada */}
            <div style={{display:"flex",gap:6,marginBottom:14}}>
              {[{v:false,l:"📅 Alquiler"},{v:true,l:"🚫 Bloquear espacio"}].map(({v,l})=>(
                <button key={String(v)} onClick={()=>{setForm(f=>({...f,isBloqueo:v}));setModalTab('reserva');}} style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${form.isBloqueo===v?(v?"#c96b5f":"#c9ad7f"):"#333a42"}`,background:form.isBloqueo===v?(v?"#c96b5f18":"#c9ad7f18"):"transparent",color:form.isBloqueo===v?(v?"#c96b5f":"#c9ad7f"):"#7f8792",cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
              ))}
            </div>

            {/* Tabs — solo en modo Alquiler */}
            {!form.isBloqueo&&(
              <div style={{display:"flex",gap:0,background:"transparent",borderBottom:"1px solid #333a42",marginBottom:16}}>
                {[{v:"reserva",l:"📅 Reserva"},{v:"cliente",l:"👤 Cliente"},{v:"cobro",l:"💰 Cobro"}].map(({v,l})=>(
                  <button key={v} onClick={()=>setModalTab(v)} style={{flex:1,padding:"9px 0",border:"none",borderBottom:modalTab===v?"2px solid #c9ad7f":"2px solid transparent",cursor:"pointer",fontSize:13,fontWeight:modalTab===v?700:500,background:"transparent",color:modalTab===v?"#eef1f5":"#7f8792",transition:"color 0.12s,border-color 0.12s"}}>{l}</button>
                ))}
              </div>
            )}

            {form.isBloqueo?(
              <FG label="Motivo del bloqueo *">
                <input value={form.bloqueoMotivo||""} onChange={e=>setForm(f=>({...f,bloqueoMotivo:e.target.value}))} placeholder="Ej: Academia, Torneo nocturno…" style={{...inpSt,borderColor:!(form.bloqueoMotivo||"").trim()?"#c96b5f66":"#333a42"}}/>
                {!(form.bloqueoMotivo||"").trim()&&<div style={{fontSize:10,color:"#c96b5f",marginTop:3}}>Requerido</div>}
              </FG>
            ):(
              <>
            {modalTab==='reserva'&&<></>}
              </>
            )}

            {(form.isBloqueo||modalTab==='reserva')&&(<>
            <FG label="Espacio">
              <select value={form.space} onChange={e=>{const sp=SPACES[e.target.value];setForm(f=>({...f,space:e.target.value,totalAmount:sp.price!=null?sp.price:f.totalAmount}));}} style={inpSt}>
                {Object.values(SPACES).map(s=><option key={s.id} value={s.id}>{s.label}{s.price?` — ${fmtMoney(s.price)}`:" — a convenir"}</option>)}
              </select>
            </FG>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <FG label="Fecha"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inpSt}/></FG>
              <FG label="Desde"><select value={form.startHour} onChange={e=>setForm(f=>({...f,startHour:+e.target.value,endHour:Math.max(+e.target.value+0.5,f.endHour)}))} style={inpSt}>{ALL_SLOTS.filter(h=>h<23.5).map(h=><option key={h} value={h}>{fmtHour(h)}</option>)}</select></FG>
              <FG label="Hasta"><select value={form.endHour} onChange={e=>setForm(f=>({...f,endHour:+e.target.value}))} style={inpSt}>{ALL_SLOTS.filter(h=>h>form.startHour).map(h=><option key={h} value={h}>{fmtHour(h)}</option>)}<option value={23.5}>23:30</option></select></FG>
            </div>

            {conflict&&<div style={{background:"#c96b5f15",border:"1px solid #c96b5f",borderRadius:8,padding:"7px 12px",fontSize:12,color:"#c96b5f",marginBottom:10}}>⚠️ Conflicto de horario con otro alquiler o cancha relacionada.</div>}

            {/* Recurrencia */}
            <div style={{background:"#1e2228",borderRadius:10,padding:"12px 14px",marginBottom:12,border:"1px solid #333a42"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#b3bac4",marginBottom:10}}>🔁 Repetición semanal</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[["none","No repetir"],["count","N semanas"],["until","Hasta fecha"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,recurrence:v}))} style={{padding:"4px 12px",borderRadius:20,border:"1px solid",fontSize:11,cursor:"pointer",borderColor:form.recurrence===v?"#c9ad7f":"#333a42",background:form.recurrence===v?"#c9ad7f22":"transparent",color:form.recurrence===v?"#c9ad7f":"#7f8792"}}>{l}</button>
                ))}
              </div>
              {form.recurrence==="count"&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:12,color:"#7f8792"}}>Semanas:</span><input type="number" min={1} max={52} value={form.recurrenceCount} onChange={e=>setForm(f=>({...f,recurrenceCount:+e.target.value}))} style={{...inpSt,width:60}}/><span style={{fontSize:11,color:"#7f8792"}}>{form.recurrenceCount} alquileres</span></div>}
              {form.recurrence==="until"&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:12,color:"#7f8792"}}>Hasta:</span><input type="date" value={form.recurrenceUntil} onChange={e=>setForm(f=>({...f,recurrenceUntil:e.target.value}))} style={{...inpSt,width:"auto"}}/></div>}
            </div>
            </>)}

            {/* Tab Cliente */}
            {!form.isBloqueo&&modalTab==='cliente'&&(
              <>
              <>
                <div style={{fontSize:9,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Cliente</div>
                <div style={{marginBottom:10}}>
                  {form.clientName?(
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#1e2228",borderRadius:8,padding:"8px 12px",border:"1px solid #333a42"}}>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{form.clientName}</div>{form.clientOrg&&<div style={{fontSize:11,color:"#7f8792"}}>{form.clientOrg}</div>}</div>
                      <button onClick={()=>setForm(f=>({...f,clientId:"",clientName:"",clientPhone:"",clientEmail:"",clientOrg:""}))} style={{background:"none",border:"none",color:"#7f8792",cursor:"pointer",fontSize:16}}>×</button>
                    </div>
                  ):(
                    <button onClick={()=>setClientPicker(true)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px dashed #333a42",background:"transparent",color:"#7f8792",cursor:"pointer",fontSize:12,textAlign:"left"}}>👥 Elegir cliente existente…</button>
                  )}
                </div>
                {!form.clientId&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <FG label="Nombre *"><input value={form.clientName} onChange={e=>setForm(f=>({...f,clientName:e.target.value}))} placeholder="Juan García" style={inpSt}/></FG>
                    <FG label="WhatsApp"><input value={form.clientPhone} onChange={e=>setForm(f=>({...f,clientPhone:e.target.value}))} placeholder="+54 9 341…" style={inpSt}/></FG>
                    <FG label="Email"><input value={form.clientEmail} onChange={e=>setForm(f=>({...f,clientEmail:e.target.value}))} placeholder="email@…" style={inpSt}/></FG>
                    <FG label="Empresa / Club"><input value={form.clientOrg} onChange={e=>setForm(f=>({...f,clientOrg:e.target.value}))} placeholder="Org…" style={inpSt}/></FG>
                  </div>
                )}
              </>
              </>
            )}

            {/* Tab Cobro */}
            {!form.isBloqueo&&modalTab==='cobro'&&(
              <>
              <>
                <div style={{fontSize:9,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Pago</div>

                {/* Montos base */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <FG label="Total ($)"><input type="number" value={form.totalAmount} onChange={e=>setForm(f=>({...f,totalAmount:e.target.value}))} placeholder="121000" style={inpSt}/></FG>
                  <FG label="Seña acordada ($)"><input type="number" value={form.señaAmount} onChange={e=>setForm(f=>({...f,señaAmount:e.target.value}))} placeholder="40000" style={inpSt}/></FG>
                </div>

                {/* Descuento */}
                <div style={{background:"#1e2228",borderRadius:10,padding:"10px 12px",marginBottom:10,border:"1px solid #333a42"}}>
                  <div style={{fontSize:10,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🏷 Descuento</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                    {[["none","Sin descuento"],["pct","% Porcentaje"],["monto","$ Fijo"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setForm(f=>({...f,descuentoTipo:v,descuentoValor:"",descuentoMotivo:""}))} style={{padding:"4px 10px",borderRadius:20,border:"1px solid",fontSize:11,cursor:"pointer",borderColor:form.descuentoTipo===v?"#f59e0b":"#333a42",background:form.descuentoTipo===v?"#f59e0b22":"transparent",color:form.descuentoTipo===v?"#f59e0b":"#7f8792",fontWeight:600}}>{l}</button>
                    ))}
                    <button onClick={()=>setForm(f=>({...f,descuentoTipo:"pct",descuentoValor:"100"}))} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${form.descuentoTipo==="pct"&&form.descuentoValor==="100"?"#c9ad7f44":"#333a42"}`,background:form.descuentoTipo==="pct"&&form.descuentoValor==="100"?"#c9ad7f15":"transparent",color:form.descuentoTipo==="pct"&&form.descuentoValor==="100"?"#c9ad7f":"#7f8792",fontSize:11,cursor:"pointer",fontWeight:600}}>🎁 Sin cargo</button>
                  </div>
                  {form.descuentoTipo!=="none"&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <input type="number" value={form.descuentoValor} onChange={e=>setForm(f=>({...f,descuentoValor:e.target.value}))} placeholder={form.descuentoTipo==="pct"?"10":"5000"} style={{...inpSt,width:90}}/>
                      <span style={{fontSize:11,color:"#7f8792"}}>{form.descuentoTipo==="pct"?"%":"ARS"}</span>
                      {Number(form.totalAmount)>0&&Number(form.descuentoValor)>0&&(
                        <span style={{fontSize:13,fontWeight:800,color:"#22c55e"}}>→ {fmtMoney(getNetAmount(form))}</span>
                      )}
                    </div>
                  )}
                  {(()=>{const es100=form.descuentoTipo==="pct"&&Number(form.descuentoValor)>=100;const esCero=form.descuentoTipo==="monto"&&Number(form.totalAmount)>0&&Number(form.descuentoValor)>=Number(form.totalAmount);return(es100||esCero)&&(<div style={{marginTop:8,background:"#c9ad7f15",border:"1px solid #c9ad7f44",borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13}}>🎁</span><span style={{fontSize:11,color:"#c9ad7f",fontWeight:700}}>Cortesía — se registra en el historial del cliente a $0</span></div>);})()}
                  {form.descuentoTipo!=="none"&&(
                    <div style={{marginTop:8}}>
                      <FG label="Motivo del descuento *">
                        <input value={form.descuentoMotivo||""} onChange={e=>setForm(f=>({...f,descuentoMotivo:e.target.value}))} placeholder="Ej: cliente frecuente, cortesía sponsor, promoción…" style={{...inpSt,borderColor:!(form.descuentoMotivo||"").trim()?"#c96b5f66":"#333a42"}}/>
                        {!(form.descuentoMotivo||"").trim()&&<div style={{fontSize:10,color:"#c96b5f",marginTop:3}}>Requerido para guardar</div>}
                      </FG>
                    </div>
                  )}
                </div>

                {/* Saldo calculado */}
                {Number(form.totalAmount)>0&&Number(form.señaAmount)>0&&(
                  <div style={{background:"#1e2228",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#7f8792"}}>Saldo a cobrar el día del partido</span>
                    <span style={{fontSize:14,fontWeight:800,color:"#c9ad7f"}}>{fmtMoney(getNetAmount(form)-Number(form.señaAmount))}</span>
                  </div>
                )}

                {/* Pagos recibidos */}
                {(()=>{
                  const pagos=form.pagos||[];
                  const total=getNetAmount(form);
                  const totalPagado=pagos.reduce((s,p)=>s+(Number(p.monto)||0),0);
                  const restante=total-totalPagado;
                  return(
                    <>
                      {pagos.length>0&&(
                        <div style={{marginBottom:10}}>
                          <div style={{fontSize:9,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Pagos registrados</div>
                          {pagos.map(p=>(
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,background:"#1e2228",borderRadius:7,padding:"6px 10px",marginBottom:4}}>
                              <span style={{fontSize:10,color:"#7f8792",minWidth:34}}>{p.fecha?new Date(p.fecha+"T12:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}):"—"}</span>
                              <span style={{fontSize:13,fontWeight:700,color:"#22c55e",flex:1}}>{fmtMoney(p.monto)}</span>
                              {p.forma&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:"#333a42",color:"#7f8792",fontWeight:600}}>{{efectivo:"💵 Efectivo",transferencia:"🏦 Transfer.",debito:"💳 Débito",credito:"💳 Crédito",cuentacorriente:"📒 Cta.Cte."}[p.forma]||p.forma}</span>}
                              {p.nota&&<span style={{fontSize:10,color:"#7f8792"}}>{p.nota}</span>}
                              {canEdit&&<button onClick={()=>setForm(f=>({...f,pagos:f.pagos.filter(x=>x.id!==p.id)}))} style={{background:"none",border:"none",color:"#c96b5f",cursor:"pointer",fontSize:15,padding:0,lineHeight:1}}>×</button>}
                            </div>
                          ))}
                          <div style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",borderTop:"1px solid #333a42",marginTop:2}}>
                            <span style={{fontSize:11,color:"#7f8792"}}>Total cobrado</span>
                            <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>{fmtMoney(totalPagado)}</span>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:restante>0?"#f59e0b12":"#22c55e12",borderRadius:7,marginTop:4,border:`1px solid ${restante>0?"#f59e0b33":"#22c55e33"}`}}>
                            <span style={{fontSize:12,fontWeight:700,color:restante>0?"#f59e0b":"#22c55e"}}>{restante>0?"⚠ Saldo restante":"✓ Pagado completo"}</span>
                            {restante>0&&<span style={{fontSize:13,fontWeight:800,color:"#f59e0b"}}>{fmtMoney(restante)}</span>}
                          </div>
                        </div>
                      )}

                      {/* Agregar pago */}
                      {canEdit&&(
                        <div style={{background:"#1e2228",borderRadius:10,padding:"12px",marginBottom:10,border:"1px dashed #333a42"}}>
                          <div style={{fontSize:9,color:"#c9ad7f",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>+ Registrar pago recibido</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                            <FG label="Monto ($)"><input type="number" value={form.newPagoMonto} onChange={e=>setForm(f=>({...f,newPagoMonto:e.target.value}))} placeholder={restante>0?String(restante):"0"} style={inpSt}/></FG>
                            <FG label="Fecha"><input type="date" value={form.newPagoFecha||dateKey(new Date())} onChange={e=>setForm(f=>({...f,newPagoFecha:e.target.value}))} style={inpSt}/></FG>
                          </div>
                          <div style={{marginBottom:8}}>
                            <FG label="Forma de pago">
                              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                {[["efectivo","💵 Efectivo"],["transferencia","🏦 Transf."],["debito","💳 Débito"],["credito","💳 Crédito"],["cuentacorriente","📒 Cta. Cte."]].map(([v,l])=>(
                                  <button key={v} type="button" onClick={()=>setForm(f=>({...f,newPagoForma:v}))} style={{padding:"5px 10px",borderRadius:20,border:"1px solid",fontSize:11,cursor:"pointer",borderColor:(form.newPagoForma||"efectivo")===v?"#c9ad7f":"#333a42",background:(form.newPagoForma||"efectivo")===v?"#c9ad7f22":"transparent",color:(form.newPagoForma||"efectivo")===v?"#c9ad7f":"#7f8792",fontWeight:600}}>{l}</button>
                                ))}
                              </div>
                            </FG>
                          </div>
                          <button onClick={()=>{
                            if(!form.newPagoMonto) return;
                            const p={id:"p_"+Date.now(),monto:Number(form.newPagoMonto),fecha:form.newPagoFecha||dateKey(new Date()),forma:form.newPagoForma||"efectivo",nota:""};
                            const newPagos=[...(form.pagos||[]),p];
                            const updatedForm={...form,pagos:newPagos,newPagoMonto:"",newPagoFecha:"",newPagoForma:""};
                            setForm(updatedForm);
                            // Guarda inmediatamente si es una reserva existente
                            if(editing){
                              const existing=bookings.find(b=>b.id===editing.id);
                              const entry={...updatedForm,id:editing.id,...audit(existing)};
                              setBookings(prev=>prev.map(b=>b.id===editing.id?entry:b));
                              logActivity("Pago registrado",`${form.clientName||"?"} · ${fmtMoney(p.monto)} · ${p.forma}`);
                            }
                          }} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:form.newPagoMonto?"#c9ad7f":"#333a42",color:form.newPagoMonto?"#15181d":"#7f8792",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                            Registrar pago
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
              </>
            )}

            {/* Asistencia — solo si ya pasó la fecha/hora */}
            {editing&&!form.sinCargo&&isPast({date:form.date,endHour:form.endHour})&&(
              <>
                <div style={{borderTop:"1px solid #333a42",margin:"10px 0"}}/>
                <div style={{fontSize:9,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Asistencia</div>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  {[{val:true,label:"✓ Asistió",activeColor:"#22c55e"},{val:false,label:"✗ No asistió",activeColor:"#c96b5f"}].map(({val,label,activeColor})=>(
                    <button key={String(val)} onClick={()=>{
                      const newVal=form.asistio===val?null:val;
                      const updatedForm={...form,asistio:newVal};
                      setForm(updatedForm);
                      if(editing){
                        const existing=bookings.find(b=>b.id===editing.id);
                        const entry={...updatedForm,id:editing.id,...audit(existing)};
                        setBookings(prev=>prev.map(b=>b.id===editing.id?entry:b));
                        if(newVal!==null) logActivity("Asistencia registrada",`${form.clientName||"?"} · ${newVal?"Asistió":"No asistió"} · ${form.date}`);
                      }
                    }} style={{flex:1,padding:"10px",borderRadius:8,border:`2px solid ${form.asistio===val?activeColor:"#333a42"}`,background:form.asistio===val?`${activeColor}22`:"transparent",color:form.asistio===val?activeColor:"#7f8792",cursor:"pointer",fontWeight:700,fontSize:13,transition:"all 0.15s"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <FG label="Notas"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Observaciones…" style={{...inpSt,height:50,resize:"vertical"}}/></FG>

            {(()=>{
              const MODAL_TABS=['reserva','cliente','cobro'];
              const tabIdx=MODAL_TABS.indexOf(modalTab);
              const disabled=!form.date||(form.isBloqueo&&!(form.bloqueoMotivo||"").trim())||(!form.isBloqueo&&!form.clientName)||(form.descuentoTipo!=="none"&&!(form.descuentoMotivo||"").trim());
              const isLast=form.isBloqueo||tabIdx===MODAL_TABS.length-1;
              return(
                <div style={{display:"flex",gap:8,marginTop:16}}>
                  {editing&&canEdit&&<button onClick={()=>del(editing.id)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #c96b5f44",background:"#c96b5f10",color:"#c96b5f",cursor:"pointer",fontSize:12}}>Eliminar</button>}
                  <div style={{flex:1}}/>
                  <button onClick={()=>setModal(false)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid #333a42",background:"transparent",color:"#b3bac4",cursor:"pointer",fontSize:12}}>Cancelar</button>
                  {!form.isBloqueo&&tabIdx>0&&(
                    <button onClick={()=>setModalTab(MODAL_TABS[tabIdx-1])} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #333a42",background:"transparent",color:"#b3bac4",cursor:"pointer",fontSize:12}}>← Anterior</button>
                  )}
                  {canEdit&&(isLast?(
                    <button onClick={save} disabled={disabled} style={{padding:"8px 20px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:disabled?"#333a42":"#c9ad7f",color:disabled?"#7f8792":"#15181d"}}>{editing?"Guardar":form.isBloqueo?"Bloquear":"Crear alquiler"}</button>
                  ):(
                    <button onClick={()=>setModalTab(MODAL_TABS[tabIdx+1])} style={{padding:"8px 20px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:"linear-gradient(135deg,#e3c99d 0%,#c9ad7f 60%,#a98d63 100%)",color:"#15181d"}}>Siguiente →</button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ))}

      {/* ── AUDIT MODAL ── */}
      {auditModal&&(
        <div style={{position:"fixed",inset:0,background:"#000000d0",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}
          onClick={e=>e.target===e.currentTarget&&setAuditModal(null)}>
          <div style={{background:"#15181d",border:"1px solid #333a42",borderRadius:14,width:"100%",maxWidth:420,maxHeight:"70vh",overflowY:"auto",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{margin:0,fontSize:15,fontWeight:700}}>🕑 Historial de cambios</h3>
              <button onClick={()=>setAuditModal(null)} style={{background:"none",border:"none",color:"#7f8792",cursor:"pointer",fontSize:20}}>×</button>
            </div>
            {(auditModal.history||[]).length===0&&<div style={{color:"#7f8792",fontSize:12}}>Sin historial.</div>}
            {[...(auditModal.history||[])].reverse().map((h,i)=>(
              <div key={i} style={{background:"#1e2228",borderRadius:8,padding:"8px 12px",marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:700,color:"#eef1f5"}}>{h.action}</div>
                <div style={{fontSize:11,color:"#7f8792"}}>por <b>{h.by}</b> · {fmtDateTime(h.at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CLIENT PICKER ── */}
      {clientPicker&&(
        <div style={{position:"fixed",inset:0,background:"#000000d0",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}
          onClick={e=>e.target===e.currentTarget&&setClientPicker(false)}>
          <div style={{background:"#15181d",border:"1px solid #333a42",borderRadius:14,width:"100%",maxWidth:400,maxHeight:"70vh",overflowY:"auto",padding:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h3 style={{margin:0,fontSize:15,fontWeight:700}}>Elegir cliente</h3>
              <button onClick={()=>setClientPicker(false)} style={{background:"none",border:"none",color:"#7f8792",cursor:"pointer",fontSize:20}}>×</button>
            </div>
            <input value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Buscar…" style={{...inpSt,marginBottom:10}}/>
            {clients.filter(c=>c.name.toLowerCase().includes(clientSearch.toLowerCase())||(c.org||"").toLowerCase().includes(clientSearch.toLowerCase())).map(c=>(
              <div key={c.id} onClick={()=>pickClient(c)} style={{padding:"10px 12px",borderRadius:8,border:"1px solid #333a42",marginBottom:6,cursor:"pointer",transition:"background 0.12s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#141b28"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <div style={{fontSize:13,fontWeight:700}}>{c.name}</div>
                <div style={{fontSize:11,color:"#7f8792"}}>{c.org||""}{c.phone?` · ${c.phone}`:""}</div>
              </div>
            ))}
            {clients.length===0&&<div style={{textAlign:"center",padding:30,color:"#7f8792",fontSize:12}}>No hay clientes aún.</div>}
          </div>
        </div>
      )}

      {/* ── CLIENT MODAL ── */}
      {clientModal&&(
        <div style={{position:"fixed",inset:0,background:"#000000d0",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}
          onClick={e=>e.target===e.currentTarget&&setClientModal(false)}>
          <div style={{background:"#15181d",border:"1px solid #333a42",borderRadius:14,width:"100%",maxWidth:420,padding:22,maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{margin:0,fontSize:16,fontWeight:700}}>{editingClient?"Editar cliente":"Nuevo cliente"}</h3>
              <button onClick={()=>setClientModal(false)} style={{background:"none",border:"none",color:"#7f8792",cursor:"pointer",fontSize:20}}>×</button>
            </div>
            <FG label="Nombre *"><input value={clientForm.name} onChange={e=>setClientForm(f=>({...f,name:e.target.value}))} placeholder="Juan García" style={inpSt}/></FG>
            <FG label="WhatsApp"><input value={clientForm.phone} onChange={e=>setClientForm(f=>({...f,phone:e.target.value}))} placeholder="+54 9 341…" style={inpSt}/></FG>
            <FG label="Email"><input value={clientForm.email} onChange={e=>setClientForm(f=>({...f,email:e.target.value}))} placeholder="email@…" style={inpSt}/></FG>
            <FG label="Empresa / Club"><input value={clientForm.org} onChange={e=>setClientForm(f=>({...f,org:e.target.value}))} placeholder="Org…" style={inpSt}/></FG>
            {editingClient&&(()=>{
              const hist=clientHistory(editingClient.id);
              return hist.length>0?(
                <div style={{marginTop:12,borderTop:"1px solid #333a42",paddingTop:12}}>
                  <div style={{fontSize:10,color:"#7f8792",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Historial ({hist.length})</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:140,overflowY:"auto"}}>
                    {hist.map(bk=>(
                      <div key={bk.id} onClick={()=>{setClientModal(false);openEdit(bk);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:"#b3bac4",background:"#1e2228",borderRadius:6,padding:"4px 8px",cursor:"pointer",transition:"background 0.12s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#2a2f36"}
                        onMouseLeave={e=>e.currentTarget.style.background="#1e2228"}>
                        <span>{new Date(bk.date+"T12:00").toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"2-digit"})} · {SPACES[bk.space]?.short} · {fmtHour(bk.startHour)}–{fmtHour(bk.endHour)}</span>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          {isPast(bk)&&bk.asistio!==null&&<span style={{fontSize:9,fontWeight:700,color:bk.asistio?"#22c55e":"#c96b5f"}}>{bk.asistio?"✓":"✗"}</span>}
                          <span style={{color:"#22c55e",fontWeight:700}}>{bk.sinCargo||getNetAmount(bk)===0?"SC":fmtMoney(getNetAmount(bk))}</span>
                          <span style={{fontSize:9,color:"#333a42"}}>›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ):null;
            })()}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              {editingClient&&canEdit&&<button onClick={()=>{setConfirmModal({title:'¿Eliminar cliente?',body:editingClient.name,danger:true,onConfirm:()=>{setClients(p=>p.filter(c=>c.id!==editingClient.id));setClientModal(false);setConfirmModal(null);showToast('Cliente eliminado','error');}});}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #c96b5f44",background:"#c96b5f10",color:"#c96b5f",cursor:"pointer",fontSize:12}}>Eliminar</button>}
              <div style={{flex:1}}/>
              <button onClick={()=>setClientModal(false)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #333a42",background:"transparent",color:"#b3bac4",cursor:"pointer",fontSize:12}}>Cancelar</button>
              <button onClick={saveClient} disabled={!clientForm.name} style={{padding:"8px 18px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:!clientForm.name?"#333a42":"#c9ad7f",color:!clientForm.name?"#7f8792":"#15181d"}}>{editingClient?"Guardar":"Agregar"}</button>
            </div>
          </div>
        </div>
      )}
      {/* ── DUPLICATES MODAL ── */}
      {dupModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(24,22,21,0.82)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:600,padding:16}}
          onClick={e=>e.target===e.currentTarget&&setDupModal(false)}>
          <div style={{background:'linear-gradient(160deg,#1e2228,#15181d)',border:'1px solid #333a42',borderRadius:14,width:'100%',maxWidth:560,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 50px rgba(0,0,0,0.7)'}}>
            {/* Header */}
            <div style={{padding:'18px 20px 14px',borderBottom:'1px solid #333a42',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:'#eef1f5'}}>🔍 Duplicados detectados</div>
                <div style={{fontSize:11,color:'#7f8792',marginTop:2}}>{dupGroups.length===0?'No se encontraron duplicados':`${dupGroups.length} grupo${dupGroups.length>1?"s":""} · Elegí cuál conservar en cada uno`}</div>
              </div>
              <button onClick={()=>setDupModal(false)} style={{background:'none',border:'none',color:'#7f8792',fontSize:22,cursor:'pointer'}}>×</button>
            </div>
            {/* Body */}
            <div style={{overflowY:'auto',padding:'14px 20px',flex:1}}>
              {dupGroups.length===0&&(
                <div style={{textAlign:'center',padding:'40px 0',color:'#7f8792'}}>
                  <div style={{fontSize:32,marginBottom:8}}>✅</div>
                  <div style={{fontSize:13,fontWeight:700,color:'#eef1f5'}}>¡Base de datos limpia!</div>
                  <div style={{fontSize:11,marginTop:4}}>No se encontraron clientes duplicados.</div>
                </div>
              )}
              {dupGroups.map((grp,gi)=>{
                const keepId=dupKeep[gi]||grp.clients[0].id;
                const removeIds=grp.clients.filter(c=>c.id!==keepId).map(c=>c.id);
                return(
                  <div key={gi} style={{background:'#15181d',border:'1px solid #333a42',borderRadius:10,padding:14,marginBottom:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,background:grp.reason==='phone'?'#60a5fa22':'#f59e0b22',color:grp.reason==='phone'?'#60a5fa':'#f59e0b'}}>
                        {grp.reason==='phone'?'📞 Mismo teléfono':'🔤 Nombre similar'}
                      </span>
                      <span style={{fontSize:10,color:'#7f8792'}}>{grp.clients.length} clientes</span>
                    </div>
                    {grp.clients.map(c=>{
                      const hist=clientHistory(c.id);
                      const total=hist.filter(b=>!b.sinCargo&&!b.isBloqueo).reduce((s,b)=>s+getNetAmount(b),0);
                      const isKeep=c.id===keepId;
                      return(
                        <div key={c.id} onClick={()=>setDupKeep(p=>({...p,[gi]:c.id}))}
                          style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,marginBottom:6,cursor:'pointer',border:`1px solid ${isKeep?'#c9ad7f':'#333a42'}`,background:isKeep?'#c9ad7f11':'#1e2228',transition:'all 0.15s'}}>
                          <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${isKeep?'#c9ad7f':'#333a42'}`,background:isKeep?'#c9ad7f':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {isKeep&&<div style={{width:8,height:8,borderRadius:'50%',background:'#15181d'}}/>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:700,color:isKeep?'#eef1f5':'#b3bac4'}}>{c.name||'Sin nombre'}</div>
                            <div style={{fontSize:10,color:'#7f8792',marginTop:1}}>
                              {c.phone&&<span>{c.phone}</span>}
                              {c.email&&<span style={{marginLeft:6}}>{c.email}</span>}
                            </div>
                          </div>
                          <div style={{textAlign:'right',flexShrink:0}}>
                            <div style={{fontSize:11,fontWeight:700,color:'#22c55e'}}>{hist.length} reservas</div>
                            {total>0&&<div style={{fontSize:10,color:'#7f8792'}}>{fmtMoney(total)}</div>}
                          </div>
                          {isKeep&&<span style={{fontSize:9,fontWeight:700,color:'#c9ad7f',background:'#c9ad7f22',padding:'2px 6px',borderRadius:6,flexShrink:0}}>CONSERVAR</span>}
                        </div>
                      );
                    })}
                    <button onClick={()=>{
                      setConfirmModal({
                        title:'¿Fusionar estos clientes?',
                        body:`Se conserva "${grp.clients.find(c=>c.id===keepId)?.name}" y se eliminan ${removeIds.length} duplicado${removeIds.length>1?"s":""}.`,
                        danger:false,
                        onConfirm:()=>{
                          mergeClients(keepId,removeIds);
                          setDupGroups(p=>p.filter((_,i)=>i!==gi));
                          setDupKeep(p=>{ const n={...p}; delete n[gi]; return n; });
                          setConfirmModal(null);
                        }
                      });
                    }} style={{width:'100%',marginTop:4,padding:'7px',borderRadius:8,border:'1px solid #c9ad7f44',background:'#c9ad7f11',color:'#c9ad7f',cursor:'pointer',fontSize:12,fontWeight:700}}>
                      Fusionar → conservar "{grp.clients.find(c=>c.id===keepId)?.name}"
                    </button>
                  </div>
                );
              })}
            </div>
            {dupGroups.length>0&&(
              <div style={{padding:'12px 20px',borderTop:'1px solid #333a42',flexShrink:0,display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setDupModal(false)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #333a42',background:'transparent',color:'#b3bac4',cursor:'pointer',fontSize:12}}>Cerrar</button>
                <button onClick={()=>{
                  setConfirmModal({
                    title:`¿Fusionar todos los grupos?`,
                    body:`Se van a procesar ${dupGroups.length} grupos de duplicados de una vez.`,
                    danger:false,
                    onConfirm:()=>{
                      dupGroups.forEach((grp,gi)=>{
                        const keepId=dupKeep[gi]||grp.clients[0].id;
                        const removeIds=grp.clients.filter(c=>c.id!==keepId).map(c=>c.id);
                        mergeClients(keepId,removeIds);
                      });
                      setDupGroups([]);
                      setDupKeep({});
                      setConfirmModal(null);
                      setDupModal(false);
                    }
                  });
                }} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'#c9ad7f',color:'#15181d',cursor:'pointer',fontSize:12,fontWeight:700}}>Fusionar todos ({dupGroups.length})</button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── CONFIRM MODAL ── */}
      {confirmModal&&(
        <div style={{position:'fixed',inset:0,background:'#000000d0',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:16}}
          onClick={e=>e.target===e.currentTarget&&setConfirmModal(null)}>
          <div style={{background:'#15181d',border:'1px solid #333a42',borderRadius:14,width:'100%',maxWidth:380,padding:24}}>
            <div style={{fontSize:16,fontWeight:800,marginBottom:8,color:confirmModal.danger?'#c96b5f':'#eef1f5'}}>{confirmModal.title}</div>
            <div style={{fontSize:13,color:'#b3bac4',marginBottom:20,lineHeight:1.5}}>{confirmModal.body}</div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setConfirmModal(null)}
                style={{padding:'8px 16px',borderRadius:8,border:'1px solid #333a42',background:'transparent',color:'#b3bac4',cursor:'pointer',fontSize:13}}>
                Cancelar
              </button>
              <button onClick={confirmModal.onConfirm}
                style={{padding:'8px 18px',borderRadius:8,border:'none',background:confirmModal.danger?'#c96b5f':'#c9ad7f',color:confirmModal.danger?'#fff':'#15181d',cursor:'pointer',fontSize:13,fontWeight:700}}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERFIL MODAL ── */}
      {profileModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(24,22,21,0.72)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:600,padding:16}}
          onClick={e=>e.target===e.currentTarget&&setProfileModal(false)}>
          <div style={{background:'linear-gradient(160deg,#1e2228 0%,#15181d 100%)',border:'1px solid #333a42',borderRadius:14,width:'100%',maxWidth:420,padding:24,boxShadow:'0 20px 50px rgba(0,0,0,0.7)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:'#eef1f5'}}>Mi perfil</div>
                <div style={{fontSize:11,color:'#7f8792'}}>@{currentUser.username}</div>
              </div>
              <button onClick={()=>setProfileModal(false)} style={{background:'none',border:'none',color:'#7f8792',fontSize:22,cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            {/* Email */}
            <FG label="Correo electrónico">
              <input value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))}
                placeholder="tu@correo.com" style={inpSt}/>
            </FG>
            <div style={{borderTop:'1px solid #333a42',margin:'14px 0'}}/>
            <div style={{fontSize:10,color:'#7f8792',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Cambiar contraseña</div>
            <FG label="Contraseña actual">
              <div style={{position:'relative'}}>
                <input type={showProfilePwd.cur?"text":"password"} value={profileForm.currentPwd} onChange={e=>setProfileForm(f=>({...f,currentPwd:e.target.value}))}
                  placeholder="••••••••" style={{...inpSt,paddingRight:40}}/>
                <button type="button" onClick={()=>setShowProfilePwd(p=>({...p,cur:!p.cur}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#7f8792',fontSize:16,padding:2}}>
                  {showProfilePwd.cur?"🙈":"👁"}
                </button>
              </div>
            </FG>
            <FG label="Nueva contraseña">
              <div style={{position:'relative'}}>
                <input type={showProfilePwd.nw?"text":"password"} value={profileForm.newPwd} onChange={e=>setProfileForm(f=>({...f,newPwd:e.target.value}))}
                  placeholder="••••••••" style={{...inpSt,paddingRight:40}}/>
                <button type="button" onClick={()=>setShowProfilePwd(p=>({...p,nw:!p.nw}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#7f8792',fontSize:16,padding:2}}>
                  {showProfilePwd.nw?"🙈":"👁"}
                </button>
              </div>
            </FG>
            <FG label="Confirmar nueva contraseña">
              <div style={{position:'relative'}}>
                <input type={showProfilePwd.cf?"text":"password"} value={profileForm.confirmPwd} onChange={e=>setProfileForm(f=>({...f,confirmPwd:e.target.value}))}
                  placeholder="••••••••" style={{...inpSt,paddingRight:40}}/>
                <button type="button" onClick={()=>setShowProfilePwd(p=>({...p,cf:!p.cf}))} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#7f8792',fontSize:16,padding:2}}>
                  {showProfilePwd.cf?"🙈":"👁"}
                </button>
              </div>
            </FG>
            {profileError&&<div style={{background:'#c96b5f15',border:'1px solid #c96b5f44',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#c96b5f',marginBottom:10}}>{profileError}</div>}
            {profileSuccess&&<div style={{background:'#22c55e15',border:'1px solid #22c55e44',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#22c55e',marginBottom:10}}>{profileSuccess}</div>}
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <button onClick={()=>setProfileModal(false)} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #333a42',background:'transparent',color:'#b3bac4',cursor:'pointer',fontSize:12}}>Cancelar</button>
              <button onClick={()=>{
                setProfileError(''); setProfileSuccess('');
                const u=users.find(x=>x.id===currentUser.id);
                // Validate password change if any pwd field filled
                const pwdChange=profileForm.currentPwd||profileForm.newPwd||profileForm.confirmPwd;
                if(pwdChange){
                  if(!profileForm.currentPwd){setProfileError('Ingresá tu contraseña actual.');return;}
                  if(u?.password!==profileForm.currentPwd){setProfileError('La contraseña actual no es correcta.');return;}
                  if(!profileForm.newPwd){setProfileError('Ingresá la nueva contraseña.');return;}
                  if(profileForm.newPwd.length<4){setProfileError('La nueva contraseña debe tener al menos 4 caracteres.');return;}
                  if(profileForm.newPwd!==profileForm.confirmPwd){setProfileError('Las contraseñas nuevas no coinciden.');return;}
                }
                // Save
                const updated={...u, email:profileForm.email, ...(pwdChange?{password:profileForm.newPwd}:{})};
                setUsers(p=>p.map(x=>x.id===currentUser.id?updated:x));
                setCurrentUser(updated);
                logActivity('Perfil actualizado', pwdChange?'Cambió contraseña y/o email':'Actualizó email');
                setProfileSuccess('¡Cambios guardados!');
                setProfileForm(f=>({...f,currentPwd:'',newPwd:'',confirmPwd:''}));
              }} style={{flex:1,padding:'8px 16px',borderRadius:8,border:'none',background:'#c9ad7f',color:'#15181d',cursor:'pointer',fontSize:12,fontWeight:700}}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          zIndex:9999, pointerEvents:'none',
          background: toast.type==='error' ? '#180e0c' : '#0a2a18',
          border:`1px solid ${toast.type==='error' ? '#c96b5f' : '#22c55e'}`,
          color: toast.type==='error' ? '#c96b5f' : '#22c55e',
          borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:700,
          boxShadow:'0 4px 24px #00000066',
          animation:'fadeInUp 0.2s ease',
          whiteSpace:'nowrap',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function FG({label,children}){
  return(
    <div style={{marginBottom:10}}>
      <label style={{display:"block",fontSize:11,color:"#b3bac4",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4,fontWeight:500}}>{label}</label>
      {children}
    </div>
  );
}

const navBtn ={background:"#1e2228",border:"1px solid #333a42",color:"#b3bac4",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:15,transition:"background 0.12s"};
const inpSt  ={width:"100%",background:"#1e2228",border:"1px solid #333a42",borderRadius:8,padding:"10px 12px",color:"#eef1f5",fontSize:14,outline:"none",boxSizing:"border-box",transition:"border-color 0.12s"};
const selSt  ={background:"#1e2228",border:"1px solid #333a42",borderRadius:8,padding:"10px 12px",color:"#eef1f5",fontSize:14,outline:"none"};
const lblSt  ={display:"block",fontSize:11,color:"#b3bac4",marginBottom:5,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em"};
