"use client";
import { useEffect, useState } from "react";

const CSS = `
  @keyframes rg-fa { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-14px) rotate(4deg)} }
  @keyframes rg-fb { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
  @keyframes rg-fc { 0%,100%{transform:translateY(0) rotate(6deg)} 50%{transform:translateY(-18px) rotate(2deg)} }
  @keyframes rg-fd { 0%,100%{transform:translateY(0) rotate(-6deg)} 50%{transform:translateY(-12px) rotate(-2deg)} }
  @keyframes rg-fe { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(6deg)} }
  @keyframes rg-scan { 0%{top:5%;opacity:0} 5%{opacity:1} 90%{opacity:1} 100%{top:95%;opacity:0} }
  @keyframes rg-pr { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.25} 50%{transform:translate(-50%,-50%) scale(1.12);opacity:.5} }
  @keyframes rg-gb { 0%,100%{filter:drop-shadow(0 0 18px #6366f1) drop-shadow(0 0 40px rgba(99,102,241,.4))} 50%{filter:drop-shadow(0 0 28px #818cf8) drop-shadow(0 0 60px rgba(129,140,248,.6))} }
  @keyframes rg-sh { 0%,100%{opacity:.15} 50%{opacity:.5} }
  @keyframes rg-cw { to{transform:rotate(360deg)} }
  @keyframes rg-ccw { to{transform:rotate(-360deg)} }
  @keyframes rg-bl { 0%,100%{opacity:1} 50%{opacity:.15} }
  @keyframes rg-bi { from{opacity:0;transform:scale(.9) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes rg-orb { from{transform:rotate(0deg) translateX(var(--r)) rotate(0deg)} to{transform:rotate(360deg) translateX(var(--r)) rotate(-360deg)} }
`;

function GemDia({ pw, ph, color, glow, style, an, dur, del }: { pw:number;ph:number;color:string;glow:string;style?:React.CSSProperties;an?:string;dur?:string;del?:string }) {
  const th = ph*0.32, cx=pw/2;
  return (
    <div style={{ position:"absolute", ...style, animation:an?`${an} ${dur} ease-in-out infinite`:undefined, animationDelay:del }}>
      <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} fill="none" style={{ filter:`drop-shadow(0 0 12px ${glow}) drop-shadow(0 0 24px ${glow}66)` }}>
        <polygon points={`0,${th} ${cx},0 ${pw},${th}`} fill={`${color}55`} stroke={color} strokeWidth="1.1"/>
        <polygon points={`0,${th} ${cx},${th*1.6} ${pw*.3},${ph}`} fill={`${color}28`} stroke={color} strokeWidth=".8"/>
        <polygon points={`${pw},${th} ${cx},${th*1.6} ${pw*.7},${ph}`} fill={`${color}1a`} stroke={color} strokeWidth=".8"/>
        <polygon points={`${pw*.3},${ph} ${cx},${th*1.6} ${pw*.7},${ph}`} fill={`${color}12`} stroke={color} strokeWidth=".8"/>
        <line x1={0} y1={th} x2={pw} y2={th} stroke={`${color}66`} strokeWidth=".6"/>
        <line x1={cx} y1={0} x2={cx*0.6} y2={th*1.6} stroke={`${color}44`} strokeWidth=".5"/>
        <line x1={cx} y1={0} x2={cx*1.4} y2={th*1.6} stroke={`${color}44`} strokeWidth=".5"/>
        <ellipse cx={pw*.36} cy={th*.48} rx={pw*.09} ry={th*.2} fill="white" opacity=".5"/>
      </svg>
    </div>
  );
}

function GemHex({ size, color, style, an, dur, del }: { size:number;color:string;style?:React.CSSProperties;an?:string;dur?:string;del?:string }) {
  const r=size/2;
  const pt=(a:number)=>{ const rad=(a-90)*Math.PI/180; return `${r+r*Math.cos(rad)},${r+r*Math.sin(rad)}`; };
  const outer=Array.from({length:6},(_,i)=>pt(i*60)).join(" ");
  const inner=Array.from({length:6},(_,i)=>{ const rad=(i*60-90)*Math.PI/180; return `${r+r*.58*Math.cos(rad)},${r+r*.58*Math.sin(rad)}`; }).join(" ");
  return (
    <div style={{ position:"absolute", ...style, animation:an?`${an} ${dur} ease-in-out infinite`:undefined, animationDelay:del }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ filter:`drop-shadow(0 0 10px ${color}aa) drop-shadow(0 0 20px ${color}44)` }}>
        <polygon points={outer} fill={`${color}22`} stroke={color} strokeWidth="1.2"/>
        <polygon points={inner} fill={`${color}12`} stroke={`${color}55`} strokeWidth=".8"/>
        <circle cx={r} cy={r} r="3.5" fill={color} opacity=".75"/>
      </svg>
    </div>
  );
}

function OrbitDot({ color, radius, dur, delay, size=5 }: { color:string;radius:number;dur:string;delay:string;size?:number }) {
  return (
    <div style={{ position:"absolute", top:"50%", left:"50%", ["--r" as any]:`${radius}px`, animation:`rg-orb ${dur} linear infinite`, animationDelay:delay }}>
      <div style={{ width:size, height:size, borderRadius:"50%", background:color, boxShadow:`0 0 8px ${color},0 0 16px ${color}66`, transform:"translate(-50%,-50%)" }}/>
    </div>
  );
}

function Badge({ label, val, color, style }: { label:string;val:string;color:string;style:React.CSSProperties }) {
  return (
    <div style={{ position:"absolute", ...style, background:"linear-gradient(135deg,rgba(10,8,30,.9),rgba(20,15,55,.85))", border:`1px solid ${color}55`, borderRadius:10, padding:"6px 10px", backdropFilter:"blur(12px)", boxShadow:`0 0 16px ${color}33`, animation:"rg-bi .6s ease-out both" }}>
      <div style={{ fontSize:7, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", fontFamily:"Space Grotesk,sans-serif" }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:900, color, fontFamily:"Space Grotesk,sans-serif", textShadow:`0 0 12px ${color}`, marginTop:1 }}>{val}</div>
    </div>
  );
}

export default function HeroVisual() {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(true); }, []);

  return (
    <div style={{ position:"relative", width:"100%", maxWidth:520, margin:"0 auto", aspectRatio:"1/1.02", userSelect:"none", minHeight:340 }}>
      <style>{CSS}</style>

      {/* Ambient glow */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 65% 55% at 52% 48%,rgba(99,102,241,.28) 0%,rgba(79,70,229,.1) 40%,transparent 70%)", filter:"blur(40px)" }}/>

      {/* SVG: grid, rings, rays, scan */}
      <svg viewBox="0 0 520 530" style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible" }} fill="none">
        <defs>
          <pattern id="rg-gd" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".5" r=".65" fill="rgba(99,102,241,.18)"/></pattern>
          <radialGradient id="rg-cg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,.7)"/>
            <stop offset="55%" stopColor="rgba(99,102,241,.15)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
          <linearGradient id="rg-sv" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0"/>
            <stop offset="50%" stopColor="#818cf8" stopOpacity=".8"/>
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="rg-r1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#818cf8" stopOpacity=".55"/><stop offset="100%" stopColor="#818cf8" stopOpacity="0"/></linearGradient>
          <linearGradient id="rg-r2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#60a5fa" stopOpacity=".55"/><stop offset="100%" stopColor="#60a5fa" stopOpacity="0"/></linearGradient>
          <linearGradient id="rg-r3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#34d399" stopOpacity=".55"/><stop offset="100%" stopColor="#34d399" stopOpacity="0"/></linearGradient>
          <linearGradient id="rg-r4" x1="100%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#fbbf24" stopOpacity=".55"/><stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/></linearGradient>
          <filter id="rg-bf"><feGaussianBlur stdDeviation="2.5"/></filter>
        </defs>
        <rect width="520" height="530" fill="url(#rg-gd)"/>
        <g style={{ transformOrigin:"260px 265px", animation:"rg-cw 32s linear infinite" }}>
          <circle cx="260" cy="265" r="200" stroke="rgba(99,102,241,.07)" strokeWidth="1" strokeDasharray="6 18"/>
        </g>
        <g style={{ transformOrigin:"260px 265px", animation:"rg-ccw 18s linear infinite" }}>
          <circle cx="260" cy="265" r="145" stroke="rgba(99,102,241,.1)" strokeWidth="1" strokeDasharray="4 12"/>
        </g>
        <g style={{ transformOrigin:"260px 265px", animation:"rg-cw 10s linear infinite" }}>
          <circle cx="260" cy="265" r="88" stroke="rgba(129,140,248,.16)" strokeWidth="1.2" strokeDasharray="3 8"/>
          <circle cx="260" cy="177" r="4.5" fill="#818cf8" filter="url(#rg-bf)" opacity=".9"/>
        </g>
        <circle cx="260" cy="265" r="74" fill="url(#rg-cg)" opacity=".8"/>
        <circle cx="260" cy="265" r="50" stroke="rgba(99,102,241,.4)" strokeWidth="1.5" fill="none" style={{ transformOrigin:"260px 265px", animation:"rg-pr 3.5s ease-in-out infinite" }}/>
        <line x1="260" y1="265" x2="90" y2="100" stroke="url(#rg-r1)" strokeWidth="1.5" style={{ animation:"rg-sh 3s ease-in-out infinite" }}/>
        <line x1="260" y1="265" x2="430" y2="90" stroke="url(#rg-r2)" strokeWidth="1.5" style={{ animation:"rg-sh 3s ease-in-out infinite", animationDelay:".8s" }}/>
        <line x1="260" y1="265" x2="85" y2="435" stroke="url(#rg-r3)" strokeWidth="1.5" style={{ animation:"rg-sh 3s ease-in-out infinite", animationDelay:"1.6s" }}/>
        <line x1="260" y1="265" x2="435" y2="430" stroke="url(#rg-r4)" strokeWidth="1.5" style={{ animation:"rg-sh 3s ease-in-out infinite", animationDelay:"2.4s" }}/>
        {ok && <rect x="232" y="0" width="56" height="20" fill="url(#rg-sv)" style={{ animation:"rg-scan 4.5s ease-in-out infinite 1.2s" }}/>}
        {["M24,50 L24,24 L50,24","M496,50 L496,24 L470,24","M24,480 L24,506 L50,506","M496,480 L496,506 L470,506"].map((d,i)=>(<path key={i} d={d} stroke="rgba(99,102,241,.28)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>))}
        {ok && ([[140,185,"#818cf8","0s"],[392,160,"#60a5fa","1s"],[118,362,"#34d399","2s"],[402,378,"#fbbf24","1.5s"],[198,452,"#c4b5fd","0.5s"],[332,462,"#93c5fd","2.5s"]] as [number,number,string,string][]).map(([cx,cy,c,d],i)=>(<circle key={i} cx={cx} cy={cy} r="1.4" fill={c} style={{ animation:`rg-bl ${2+i*.35}s ease-in-out infinite`, animationDelay:d }}/>))}
      </svg>

      {/* Orbit dots */}
      <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0 }}>
        {([["#818cf8",88,"7s","0s"],["#60a5fa",88,"7s","-3.5s"],["#34d399",145,"12s","0s"],["#fbbf24",145,"12s","-6s"],["#c4b5fd",145,"12s","-3s"]] as [string,number,string,string][]).map(([c,r,d,dl],i)=>(<OrbitDot key={i} color={c} radius={r} dur={d} delay={dl} size={i<2?6:4}/>))}
      </div>

      {/* Main hero gem */}
      <div style={{ position:"absolute", top:"26%", left:"50%", transform:"translateX(-50%)", animation:"rg-fa 6s ease-in-out infinite, rg-gb 4s ease-in-out infinite", zIndex:10 }}>
        <svg width={120} height={140} viewBox="0 0 120 140" fill="none" style={{ filter:"drop-shadow(0 0 22px #6366f1) drop-shadow(0 0 50px rgba(99,102,241,.55))" }}>
          <polygon points="0,45 60,0 120,45" fill="#818cf888" stroke="#818cf8" strokeWidth="1.2"/>
          <polygon points="0,45 45,68 18,140" fill="#6366f148" stroke="#818cf8" strokeWidth="1"/>
          <polygon points="120,45 75,68 102,140" fill="#6366f130" stroke="#818cf8" strokeWidth="1"/>
          <polygon points="18,140 45,68 75,68 102,140" fill="#818cf820" stroke="#818cf8" strokeWidth="1"/>
          <line x1="0" y1="45" x2="120" y2="45" stroke="#818cf877" strokeWidth=".8"/>
          <line x1="0" y1="45" x2="45" y2="68" stroke="#818cf855" strokeWidth=".6"/>
          <line x1="120" y1="45" x2="75" y2="68" stroke="#818cf855" strokeWidth=".6"/>
          <line x1="45" y1="68" x2="75" y2="68" stroke="#818cf855" strokeWidth=".6"/>
          <line x1="60" y1="0" x2="45" y2="68" stroke="#a5b4fc44" strokeWidth=".5"/>
          <line x1="60" y1="0" x2="75" y2="68" stroke="#a5b4fc44" strokeWidth=".5"/>
          <ellipse cx="44" cy="22" rx="10" ry="7" fill="white" opacity=".5" transform="rotate(-15,44,22)"/>
          <ellipse cx="28" cy="35" rx="4" ry="2" fill="white" opacity=".3"/>
        </svg>
      </div>

      {/* Corner gems */}
      <GemDia pw={60} ph={72} color="#a78bfa" glow="#7c3aed" style={{ top:"5%",    left:"3%"   }} an="rg-fb" dur="5.5s" del="0s"/>
      <GemDia pw={68} ph={80} color="#60a5fa" glow="#2563eb" style={{ top:"3%",    right:"3%"  }} an="rg-fc" dur="7s"   del="1s"/>
      <GemHex size={68} color="#34d399" style={{ bottom:"11%", left:"2%"   }} an="rg-fd" dur="6.5s" del="0.5s"/>
      <GemHex size={74} color="#fbbf24" style={{ bottom:"9%",  right:"2%"  }} an="rg-fe" dur="5s"   del="1.5s"/>
      <GemHex size={36} color="#22d3ee" style={{ top:"44%",   left:"7%"   }} an="rg-fb" dur="4.5s" del="2s"/>
      <GemDia pw={36} ph={44} color="#f472b6" glow="#db2777" style={{ top:"42%",   right:"6%"  }} an="rg-fa" dur="4s"   del="0.8s"/>

      {/* Hub orb */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"16%", zIndex:12 }}>
        <div style={{ width:"100%", paddingBottom:"100%", position:"relative", borderRadius:"50%", background:"radial-gradient(circle at 32% 28%,rgba(139,92,246,.95) 0%,rgba(99,102,241,.7) 40%,rgba(15,12,50,1) 80%)", border:"2px solid rgba(139,92,246,.7)", boxShadow:"0 0 0 6px rgba(99,102,241,.07),0 0 40px rgba(99,102,241,.5),0 0 80px rgba(99,102,241,.2)" }}>
          <div style={{ position:"absolute", top:"10%", left:"16%", width:"35%", height:"25%", background:"radial-gradient(ellipse,rgba(255,255,255,.5) 0%,transparent 75%)", borderRadius:"50%", transform:"rotate(-20deg)" }}/>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"1rem", fontWeight:900, color:"#f0f0ff", fontFamily:"Space Grotesk,sans-serif", textShadow:"0 0 16px white", lineHeight:1 }}>A</span>
            <span style={{ fontSize:"4.5px", fontWeight:800, color:"rgba(255,255,255,.35)", letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"Space Grotesk,sans-serif", marginTop:3 }}>RWA</span>
          </div>
        </div>
      </div>

      {/* APY badges */}
      {ok && (<>
        <Badge label="InvoiceFi · APY"  val="8.4%"  color="#a78bfa" style={{ top:"18%",   left:"22%",  animationDelay:".1s" }}/>
        <Badge label="TradeFi · APY"    val="9.6%"  color="#60a5fa" style={{ top:"16%",   right:"19%", animationDelay:".3s" }}/>
        <Badge label="EquipFi · APY"    val="12.1%" color="#34d399" style={{ bottom:"22%",left:"19%",  animationDelay:".5s" }}/>
        <Badge label="PrivCredit · APY" val="14.2%" color="#fbbf24" style={{ bottom:"20%",right:"17%", animationDelay:".7s" }}/>
      </>)}

      {/* Status bar */}
      {ok && (
        <div style={{ position:"absolute", bottom:"0%", left:"6%", right:"6%", borderRadius:12, background:"linear-gradient(90deg,rgba(8,6,24,.94) 0%,rgba(30,24,80,.65) 50%,rgba(8,6,24,.94) 100%)", border:"1px solid rgba(99,102,241,.22)", backdropFilter:"blur(14px)", padding:"7px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", zIndex:20, animation:"rg-bi .6s ease-out both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399", animation:"rg-bl 1.4s ease-in-out infinite" }}/>
            <span style={{ fontSize:8, fontWeight:800, color:"rgba(255,255,255,.3)", letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:"Space Grotesk,sans-serif" }}>Live · BOT Chain</span>
          </div>
          <div style={{ display:"flex", gap:14 }}>
            {([["Vol","$10.4M","#818cf8"],["Chain","677","#60a5fa"],["Gas","~0","#34d399"]] as [string,string,string][]).map(([l,v,c])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:7, fontWeight:700, color:"rgba(255,255,255,.25)", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"Space Grotesk,sans-serif" }}>{l}</span>
                <span style={{ fontSize:10, fontWeight:900, color:c, fontFamily:"Space Grotesk,sans-serif" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}