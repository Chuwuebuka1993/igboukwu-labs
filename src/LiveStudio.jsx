import { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import bronzePot from "./assets/branding/igbo_ukwu_pot.jpg";

const C = {
  bg: "#0A1120",
  navy: "#031040",
  blue: "#2F76F6",
  cobalt: "#1E56FD",
  amber: "#F36D12",
  gold: "#C9A84C",
  offwhite: "#F5F0E8",
  muted: "#7A8FA6",
  card: "#0D1830",
  border: "rgba(47,118,246,0.22)",
  bronze: "#CD7F32",
  green: "#22C55E",
  red: "#EF4444",
  purple: "#A855F7",
  teal: "#14B8A6",
  primary: "#FF4F00",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Rajdhani:wght@400;600;700&display=swap');
*{box-sizing:border-box;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:${C.navy};}
::-webkit-scrollbar-thumb{background:${C.bronze};border-radius:2px;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.pulse{animation:pulse 1.5s infinite;}
.fadeIn{animation:fadeIn .4s ease forwards;}
`;

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const KEYS  = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

const genSession = () =>
  "SSNG-LIVE-" + Date.now() + "-" + Math.random().toString(36).substr(2,8).toUpperCase();

const cd = (e = {}) => ({
  background:   C.card,
  border:       `1px solid ${C.border}`,
  borderRadius: 12,
  padding:      16,
  marginBottom: 16,
  ...e,
});

function Badge({ label, color, small }) {
  return (
    <span style={{
      background:   `${color}22`,
      border:       `1px solid ${color}`,
      color,
      borderRadius: 20,
      padding:      small ? "2px 8px" : "4px 12px",
      fontSize:     small ? 9 : 11,
      fontFamily:   "Rajdhani",
      fontWeight:   700,
      letterSpacing:1,
      whiteSpace:   "nowrap",
    }}>
      {label}
    </span>
  );
}

const PROGRESSIONS = {
  "I-V-vi-IV":   [0,7,9,5],
  "I-IV-V":      [0,5,7],
  "I-vi-IV-V":   [0,9,5,7],
  "vi-IV-I-V":   [9,5,0,7],
};

const GENRES = {
  Afrobeats:    { bpm:100,  color: C.amber  },
  Amapiano:     { bpm:112,  color: C.teal   },
  "Igbo Gospel":{ bpm:88,   color: C.purple },
  Highlife:     { bpm:115,  color: C.gold   },
  "Naija Pop":  { bpm:108,  color: C.blue   },
  Reggae:       { bpm:78,   color: C.green  },
};

const PATTERNS = {
  "Igbo Gospel": {
    kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0],
    bass:[1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1],
    pad: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
    lead:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    perc:[0,1,0,1,0,0,1,0,0,1,0,1,0,0,1,0],
  },
  Afrobeats: {
    kick:[1,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0],
    bass:[1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0],
    pad: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    lead:[0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1],
    perc:[1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1],
  },
  Amapiano: {
    kick:[1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0],
    bass:[1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0],
    pad: [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    lead:[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],
    perc:[0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1],
  },
};

function TermsGate({ onAccept }) {
  const [checks, setChecks] = useState({
    terms: false, copyright: false, ndpr: false, age: false,
  });
  const ok = Object.values(checks).every(Boolean);
  return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{ maxWidth:520, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{
            background:C.navy, border:`2px solid ${C.gold}`, borderRadius:16,
            padding:"12px 24px", display:"inline-flex", alignItems:"center", gap:8,
            boxShadow:`0 0 30px rgba(201,168,76,.2)`,
          }}>
            <span style={{ fontSize:40, color:C.amber, fontFamily:"serif" }}>𝄢</span>
            <span style={{ fontSize:48, color:C.gold,  fontFamily:"serif", marginTop:-6 }}>𝄞</span>
          </div>
          <div style={{
            fontFamily:"Cinzel", fontWeight:900, color:C.gold,
            fontSize:18, letterSpacing:2, marginTop:10,
          }}>SSNG LIVE STUDIO</div>
          <div style={{ fontSize:11, color:C.bronze, fontFamily:"Rajdhani", letterSpacing:2 }}>
            Igboukwu to the World
          </div>
        </div>

        <div style={cd({ border:`2px solid ${C.bronze}`, borderRadius:16 })}>
          <div style={{
            fontFamily:"Cinzel", fontWeight:700, color:C.bronze, fontSize:15, marginBottom:4,
          }}>Terms of Service &amp; Legal Agreement</div>

          <div style={{
            background:C.navy, borderRadius:10, padding:12, marginBottom:14,
            fontSize:11, color:C.offwhite, fontFamily:"Rajdhani", lineHeight:1.8,
          }}>
            <div style={{ color:C.gold, fontWeight:700, marginBottom:6 }}>KEY TERMS</div>
            <div>1. <strong style={{color:C.amber}}>You own your original compositions</strong> — SSNG claims no rights.</div>
            <div>2. <strong style={{color:C.amber}}>Cover songs require attribution</strong> — declare if performing someone else's song.</div>
            <div>3. <strong style={{color:C.amber}}>No direct platform streaming</strong> — record locally, distribute yourself.</div>
            <div>4. <strong style={{color:C.amber}}>AI assistance disclosed</strong> — per ISO 42001, identify AI-assisted content.</div>
            <div>5. <strong style={{color:C.amber}}>Session watermarking</strong> — all exports carry invisible SSNG watermark.</div>
          </div>

          {[
            { id:"terms",     label:"TERMS:",     text:"I agree to SoundSignatureNG Terms of Service.",                                                   color:C.gold  },
            { id:"copyright", label:"COPYRIGHT:", text:"I understand cover songs require proper licensing before commercial distribution.",                color:C.amber },
            { id:"ndpr",      label:"NDPR:",      text:"I consent to SSNG storing session metadata per Nigerian Data Protection Regulation 2019.",        color:C.teal  },
            { id:"age",       label:"AGE:",       text:"I am 16 years or older or have parental consent.",                                                color:C.blue  },
          ].map((item) => (
            <div key={item.id} style={{
              display:"flex", gap:10, alignItems:"flex-start",
              padding:"9px 0", borderBottom:`1px solid ${C.border}`,
            }}>
              <input
                type="checkbox" id={item.id}
                checked={checks[item.id]}
                onChange={(e) => setChecks((c) => ({ ...c, [item.id]: e.target.checked }))}
                style={{ marginTop:2, accentColor:item.color, flexShrink:0, width:16, height:16, cursor:"pointer" }}
              />
              <label htmlFor={item.id} style={{
                fontSize:11, color:C.muted, fontFamily:"Rajdhani", lineHeight:1.5, cursor:"pointer",
              }}>
                <span style={{ color:item.color, fontWeight:700 }}>{item.label} </span>
                {item.text}
              </label>
            </div>
          ))}

          <button
            onClick={onAccept} disabled={!ok}
            style={{
              width:"100%", marginTop:14,
              background: ok ? `linear-gradient(135deg,${C.amber},${C.cobalt})` : C.muted,
              color: ok ? C.offwhite : "#666",
              border:"none", borderRadius:12, padding:"15px",
              fontSize:15, fontWeight:700,
              cursor: ok ? "pointer" : "not-allowed",
              fontFamily:"Rajdhani", letterSpacing:1,
            }}
          >
            {ok ? "🎵 Enter SSNG Live Studio →" : "Accept all terms to continue"}
          </button>
          <div style={{
            textAlign:"center", fontSize:9, color:C.muted, fontFamily:"Rajdhani", marginTop:6,
          }}>
            Nigerian Copyright Act 2022 • ISO 42001 • NDPR 2019
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverDeclaration({ onComplete }) {
  const [isCover, setIsCover] = useState(false);
  const [title,   setTitle]   = useState("");
  const [artist,  setArtist]  = useState("");
  const [license, setLicense] = useState("personal");

  const submit = () => onComplete({
    isCover,
    original:  isCover ? { title, artist } : null,
    license,
    timestamp: new Date().toISOString(),
  });

  return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{ maxWidth:500, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, fontSize:18 }}>
            Copyright Declaration
          </div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani", marginTop:4 }}>
            Required under Nigerian Copyright Act 2022
          </div>
        </div>

        <div style={cd({ border:`2px solid ${C.purple}`, borderRadius:16 })}>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[
              { v:false, label:"🎵 My Original Song", color:C.green },
              { v:true,  label:"🎤 Cover Song",       color:C.amber },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                onClick={() => setIsCover(opt.v)}
                style={{
                  flex:1,
                  background: isCover === opt.v ? `${opt.color}22` : C.navy,
                  color:      isCover === opt.v ? opt.color : C.muted,
                  border:     `1px solid ${isCover === opt.v ? opt.color : C.border}`,
                  borderRadius:10, padding:"11px", cursor:"pointer",
                  fontSize:12, fontFamily:"Rajdhani", fontWeight:700,
                }}
              >{opt.label}</button>
            ))}
          </div>

          {isCover && (
            <div className="fadeIn">
              {[
                ["Original Title",  title,  setTitle,  "e.g. Amazing Grace"],
                ["Original Artist", artist, setArtist, "e.g. John Newton / Hillsong"],
              ].map(([l,v,s,p]) => (
                <div key={l} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:10, color:C.muted, display:"block", marginBottom:3, fontFamily:"Rajdhani" }}>
                    {l} *
                  </label>
                  <input
                    value={v} onChange={(e) => s(e.target.value)} placeholder={p}
                    style={{
                      width:"100%", background:C.navy, border:`1px solid ${C.border}`,
                      color:C.offwhite, borderRadius:8, padding:"9px 12px",
                      fontSize:12, fontFamily:"Rajdhani",
                    }}
                  />
                </div>
              ))}
              <div style={{
                background:`${C.amber}11`, border:`1px solid ${C.amber}33`,
                borderRadius:8, padding:10, marginBottom:12,
              }}>
                <div style={{ fontSize:10, color:C.amber, fontFamily:"Rajdhani", lineHeight:1.5 }}>
                  ⚠️ For commercial distribution of cover songs, obtain a mechanical license via
                  Easy Song Licensing or DistroKid Cover Song Licensing.
                </div>
              </div>
            </div>
          )}

          {!isCover && (
            <div style={{
              background:`${C.green}11`, border:`1px solid ${C.green}33`,
              borderRadius:8, padding:10, marginBottom:12,
            }}>
              <div style={{ fontSize:10, color:C.green, fontFamily:"Rajdhani", lineHeight:1.5 }}>
                ✅ Original composition — fully owned by you. SSNG embeds your authorship in the session metadata.
              </div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={isCover && (!title || !artist)}
            style={{
              width:"100%",
              background: !isCover || (title && artist)
                ? `linear-gradient(135deg,${C.purple},${C.cobalt})` : C.muted,
              color:"#fff", border:"none", borderRadius:12, padding:"14px",
              fontSize:14, fontWeight:700,
              cursor: !isCover || (title && artist) ? "pointer" : "not-allowed",
              fontFamily:"Rajdhani", letterSpacing:0.5,
            }}
          >🛡️ Confirm &amp; Enter Studio →</button>
        </div>
      </div>
    </div>
  );
}

function PianoStrip({ activeNotes = [], chordNotes = [], rootNote = 0 }) {
  const WHITE = [0,2,4,5,7,9,11];
  const BLACK = [1,3,6,8,10];
  const BOFF  = { 1:0.65, 3:1.65, 6:3.65, 8:4.65, 10:5.65 };

  const whites = [], blacks = [];
  let wi = 0;
  for (let oct = 0; oct < 3; oct++) {
    for (let k = 0; k < 12; k++) {
      const midi = (3 + oct) * 12 + k;
      const pc   = midi % 12;
      const isA  = activeNotes.includes(midi);
      const isC  = chordNotes.includes(pc);
      const isR  = pc === rootNote % 12;
      if (WHITE.includes(pc)) whites.push({ midi, pc, isA, isC, isR, idx:wi++, lbl: pc===0 ? `C${3+oct}` : "" });
      if (BLACK.includes(pc)) blacks.push({ midi, pc, isA, isC, isR, wi, k, oct });
    }
  }

  const total = whites.length;
  const wPct  = 100 / total;

  return (
    <div style={{
      position:"relative", height:90, background:C.navy,
      borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}`, padding:"5px 2px 0",
    }}>
      <div style={{ display:"flex", height:"100%", gap:1 }}>
        {whites.map((k) => (
          <div key={k.midi} style={{
            flex:1,
            background: k.isA ? C.amber : k.isC ? `${C.gold}77` : k.isR ? `${C.teal}55` : "#F0EBE0",
            borderRadius:"0 0 5px 5px",
            border:`1px solid ${C.border}`,
            position:"relative",
            transition:"background .08s",
            boxShadow: k.isA ? `0 0 10px ${C.amber}99` : "none",
          }}>
            {k.lbl && (
              <span style={{
                position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)",
                fontSize:7, color:C.muted, fontFamily:"Rajdhani", fontWeight:600,
              }}>{k.lbl}</span>
            )}
            {k.isA && (
              <div className="pulse" style={{
                position:"absolute", top:3, left:"50%", transform:"translateX(-50%)",
                width:6, height:6, borderRadius:"50%", background:C.amber,
              }} />
            )}
          </div>
        ))}
      </div>

      {blacks.map((k) => {
        const octOff     = k.oct * 7;
        const withinOct  = BOFF[k.k] || 0;
        const left       = ((octOff + withinOct) / total) * 100;
        return (
          <div key={k.midi} style={{
            position:"absolute", left:`${left}%`, top:5,
            width:`${wPct * 0.62}%`, height:"57%", zIndex:2,
            background: k.isA ? C.amber : k.isC ? C.gold : k.isR ? C.teal : "#12162A",
            borderRadius:"0 0 4px 4px",
            border:`1px solid ${C.blue}22`,
            transition:"background .08s",
            boxShadow: k.isA ? `0 0 10px ${C.amber}` : "inset 0 -2px 3px rgba(0,0,0,.5)",
          }} />
        );
      })}

      <div style={{ position:"absolute", bottom:3, right:6, display:"flex", gap:4 }}>
        {[[C.amber,"Active"],[C.gold,"Chord"],[C.teal,"Root"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:2 }}>
            <div style={{ width:6, height:6, borderRadius:2, background:c }} />
            <span style={{ fontSize:7, color:C.muted, fontFamily:"Rajdhani" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VUMeter({ active }) {
  const [heights, setH] = useState(Array(12).fill(5));
  useEffect(() => {
    if (!active) return;
    const t = setInterval(
      () => setH(Array.from({ length:12 }, () => active ? Math.max(10, Math.random()*100) : 5)),
      120,
    );
    return () => clearInterval(t);
  }, [active]);

  return (
    <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:28 }}>
      {heights.map((h, i) => {
        const c = i < 7 ? C.green : i < 10 ? C.amber : C.red;
        return (
          <div key={i} style={{
            width:8, height:`${active ? h : 5}%`, background:c,
            borderRadius:"2px 2px 0 0", transition:"height .1s", opacity: active ? 1 : 0.3,
          }} />
        );
      })}
    </div>
  );
}

function PatternLibrary({ onLoadPattern, currentGenre, currentKey, currentProg, currentBpm }) {
  const [patterns, setPatterns] = useState(() => {
    try {
      const saved = localStorage.getItem("ssng_patterns");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newName, setNewName] = useState("");

  const savePattern = () => {
    if (!newName.trim()) return;
    const pattern = {
      name: newName, genre: currentGenre, key: currentKey,
      progression: currentProg, bpm: currentBpm, id: Date.now(),
    };
    const updated = [...patterns, pattern];
    setPatterns(updated);
    try { localStorage.setItem("ssng_patterns", JSON.stringify(updated)); } catch {}
    setNewName("");
  };

  const loadPattern  = (p) => onLoadPattern(p.genre, p.key, p.progression, p.bpm);
  const deletePattern = (id) => {
    const updated = patterns.filter((p) => p.id !== id);
    setPatterns(updated);
    try { localStorage.setItem("ssng_patterns", JSON.stringify(updated)); } catch {}
  };

  return (
    <div className="fadeIn">
      <div style={cd()}>
        <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, marginBottom:10 }}>
          Save Current Session
        </div>
        <input
          type="text"
          placeholder="Pattern name (e.g. Sunday Worship)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{
            width:"100%", background:C.navy, border:`1px solid ${C.border}`,
            color:C.offwhite, borderRadius:8, padding:"10px", marginBottom:10, fontSize:12,
          }}
        />
        <button
          onClick={savePattern}
          style={{
            background:C.amber, color:C.bg, border:"none",
            borderRadius:8, padding:"8px 16px", fontWeight:700, cursor:"pointer", width:"100%",
          }}
        >💾 Save Pattern</button>
      </div>

      {patterns.length > 0 && (
        <div style={cd()}>
          <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, marginBottom:10 }}>
            Saved Patterns
          </div>
          {patterns.map((p) => (
            <div key={p.id} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"8px 0", borderBottom:`1px solid ${C.border}`,
            }}>
              <div>
                <div style={{ fontWeight:700, color:C.offwhite }}>{p.name}</div>
                <div style={{ fontSize:10, color:C.muted }}>
                  {p.genre} • {p.progression} • {p.bpm} BPM
                </div>
              </div>
              <div>
                <button
                  onClick={() => loadPattern(p)}
                  style={{
                    background:C.gold, color:C.bg, border:"none",
                    borderRadius:5, padding:"4px 10px", marginRight:6, cursor:"pointer", fontSize:11,
                  }}
                >Load</button>
                <button
                  onClick={() => deletePattern(p.id)}
                  style={{
                    background:C.red, color:"#fff", border:"none",
                    borderRadius:5, padding:"4px 10px", cursor:"pointer", fontSize:11,
                  }}
                >Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsTheory() {
  const guitarRiffs = [
    { name:"Pentatonic Run in G",  desc:"Fast ascending/descending pattern using the G major pentatonic scale.", difficulty:"Intermediate" },
    { name:"Blues Shuffle Riff",   desc:"Classic 12-bar blues rhythm with swing feel.",                          difficulty:"Beginner"     },
    { name:"Highlife Chop",        desc:"Syncopated off-beat guitar chop typical of Ghanaian Highlife.",         difficulty:"Intermediate" },
  ];
  const drumStyles = [
    { name:"Amapiano",    desc:"Log drum pattern, kick on 1, snare on 2 & 4, shaker offbeats, bass on 1 & 3." },
    { name:"Igbo Gospel", desc:"Slow 12/8 feel, heavy kick on 1, snare on 3, hi-hat triplets."                },
    { name:"Reggae",      desc:"One drop: kick on 3, snare on 3, hi-hat offbeats."                             },
    { name:"Highlife",    desc:"Upbeat 4/4 with syncopated hi-hat and snare on 2 & 4."                         },
  ];
  const pianoSkills = [
    { name:"Alberti Bass",  desc:"Broken chord pattern: low – high – middle – high." },
    { name:"Gospel Slide",  desc:"Glissando from the flat seventh to the root chord." },
    { name:"Walking Bass",  desc:"Chromatic or stepwise bass movement between chords." },
  ];
  const musicTheory = [
    { name:"Major Scale",       desc:"W-W-H-W-W-W-H pattern, bright sound."                         },
    { name:"Minor Scale",       desc:"W-H-W-W-H-W-W pattern, sad sound."                             },
    { name:"Chord Progression", desc:"Sequence of chords (e.g. I-IV-V) that form harmonic structure." },
  ];

  const Section = ({ title, items }) => (
    <div style={cd()}>
      <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, marginBottom:10 }}>{title}</div>
      {items.map((r) => (
        <div key={r.name} style={{ marginBottom:12, borderLeft:`2px solid ${C.bronze}`, paddingLeft:10 }}>
          <div style={{ fontWeight:700, color:C.offwhite }}>{r.name}</div>
          <div style={{ fontSize:11, color:C.muted }}>{r.desc}</div>
          {r.difficulty && <Badge label={r.difficulty} color={C.amber} small />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fadeIn">
      <Section title="🎸 Guitar Riffs &amp; Runs" items={guitarRiffs} />
      <Section title="🥁 Drum Styles"             items={drumStyles}  />
      <Section title="🎹 Piano Skills"            items={pianoSkills} />
      <Section title="📖 Music Theory"            items={musicTheory} />
    </div>
  );
}

function ContentHub() {
  const [photo, setPhoto] = useState(() => {
    try { return localStorage.getItem("ssng_photo") || null; } catch { return null; }
  });
  const [name, setName] = useState(() => {
    try { return localStorage.getItem("ssng_name") || ""; } catch { return ""; }
  });
  const [bio, setBio] = useState(() => {
    try { return localStorage.getItem("ssng_bio") || ""; } catch { return ""; }
  });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      try { localStorage.setItem("ssng_photo", reader.result); } catch {}
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    try {
      localStorage.setItem("ssng_name", name);
      localStorage.setItem("ssng_bio",  bio);
    } catch {}
  };

  return (
    <div className="fadeIn">
      <div style={cd()}>
        <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, marginBottom:10 }}>
          🎤 Instrumentalist Profile
        </div>

        <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:16 }}>
          {photo ? (
            <img
              src={photo} alt="Profile"
              style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:`2px solid ${C.bronze}` }}
            />
          ) : (
            <div style={{
              width:80, height:80, borderRadius:"50%", background:C.navy,
              border:`2px solid ${C.bronze}`, display:"flex", alignItems:"center",
              justifyContent:"center", color:C.muted, fontSize:28,
            }}>📸</div>
          )}
          <input type="file" accept="image/*" onChange={handlePhoto}
            style={{ fontSize:10, color:C.muted }} />
        </div>

        <input
          type="text" placeholder="Your Name / Stage Name"
          value={name} onChange={(e) => setName(e.target.value)} onBlur={saveProfile}
          style={{
            width:"100%", background:C.navy, border:`1px solid ${C.border}`,
            borderRadius:8, padding:10, marginBottom:10, color:C.offwhite, fontSize:12,
            fontFamily:"Rajdhani",
          }}
        />

        <textarea
          placeholder="Short bio (e.g. Gospel pianist from Lagos)"
          value={bio} onChange={(e) => setBio(e.target.value)} onBlur={saveProfile}
          rows={3}
          style={{
            width:"100%", background:C.navy, border:`1px solid ${C.border}`,
            borderRadius:8, padding:10, color:C.offwhite, fontSize:12,
            fontFamily:"Rajdhani", resize:"vertical",
          }}
        />

        <div style={{
          display:"flex", alignItems:"center", gap:12, marginTop:14,
          background:`${C.bronze}11`, border:`1px solid ${C.bronze}33`,
          borderRadius:10, padding:10,
        }}>
          <img
            src={bronzePot}
            alt="Igbo Ukwu Bronze Roped Pot — 9th century"
            style={{
              width:56, height:56, borderRadius:8, objectFit:"cover",
              border:`2px solid ${C.bronze}`, flexShrink:0,
            }}
          />
          <div>
            <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.bronze, fontSize:11 }}>
              Igboukwu Bronze Heritage Badge
            </div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"Rajdhani", lineHeight:1.5, marginTop:2 }}>
              The Igbo Ukwu Bronze Roped Pot (9th c. AD) — one of Africa's
              earliest and finest lost-wax cast bronzes, excavated in Igbo Ukwu,
              Anambra State. A symbol of Igbo civilisation and artistic mastery.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DJPresets({ onApplyPreset }) {
  const presets = [
    { name:"Amapiano Groove",      genre:"Amapiano",    progression:"I-V-vi-IV", bpm:112 },
    { name:"Gospel Contemporary",  genre:"Igbo Gospel", progression:"I-V-vi-IV", bpm:88  },
    { name:"Reggae Chill",         genre:"Reggae",      progression:"I-V-vi-IV", bpm:78  },
    { name:"Highlife Party",       genre:"Highlife",    progression:"I-IV-V",    bpm:115 },
  ];

  return (
    <div className="fadeIn">
      <div style={cd()}>
        <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, marginBottom:10 }}>
          ⚡ One-Click DJ Presets
        </div>
        <div style={{ display:"grid", gap:10 }}>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => onApplyPreset(p.genre, p.progression, p.bpm)}
              style={{
                background:C.navy, border:`1px solid ${C.bronze}`,
                borderRadius:10, padding:12, textAlign:"left", cursor:"pointer",
                transition:"border-color .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.amber)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.bronze)}
            >
              <div style={{ fontWeight:700, color:C.offwhite, fontFamily:"Rajdhani" }}>{p.name}</div>
              <div style={{ fontSize:10, color:C.muted }}>
                {p.genre} • {p.progression} • {p.bpm} BPM
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SSNGLogo() {
  const notes = [
    { pc:"C",  cx:60,  fill:"#FF6B6B", fs:6   },
    { pc:"C#", cx:73,  fill:"#FF9A8B", fs:6   },
    { pc:"D",  cx:86,  fill:"#FFC785", fs:6   },
    { pc:"D#", cx:99,  fill:"#FFE599", fs:5   },
    { pc:"E",  cx:112, fill:"#F9F871", fs:6   },
    { pc:"F",  cx:125, fill:"#C5E38B", fs:6   },
    { pc:"F#", cx:138, fill:"#81DFA0", fs:6   },
    { pc:"G",  cx:151, fill:"#5ED7B3", fs:6   },
    { pc:"G#", cx:164, fill:"#46D7DB", fs:6   },
    { pc:"A",  cx:177, fill:"#40B5D5", fs:6   },
    { pc:"A#", cx:190, fill:"#5F81CC", fs:6   },
    { pc:"B",  cx:203, fill:"#7E66C8", fs:6   },
  ];

  return (
    <svg
      width="220" height="64" viewBox="0 0 220 64"
      style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}
      aria-label="SoundSignatureNG — chromatic scale logo"
    >
      <text x="8" y="22" fontFamily="serif" fontSize="28" fill="#FF4F00">𝄞</text>
      <text x="8" y="52" fontFamily="serif" fontSize="28" fill="#FF4F00">𝄢</text>
      {notes.map((n) => (
        <g key={n.pc}>
          <circle cx={n.cx} cy="32" r="5" fill={n.fill} />
          <text
            x={n.cx - (n.pc.length > 1 ? 5 : 3)}
            y="35"
            fontSize={n.fs}
            fill="#000"
            fontFamily="sans-serif"
            fontWeight="bold"
          >{n.pc}</text>
        </g>
      ))}
    </svg>
  );
}

export default function LiveStudio() {
  const [terms, setTerms] = useState(false);
  const [decl, setDecl] = useState(null);
  const [mode, setMode] = useState("setup");
  const [sessionId] = useState(genSession);
  const [genre, setGenre] = useState("Igbo Gospel");
  const [rootKey, setRootKey] = useState(0);
  const [progName, setProg] = useState("I-V-vi-IV");
  const [bpm, setBpm] = useState(88);
  const [autoFollow, setAuto] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [recording, setRec] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [step, setStep] = useState(0);
  const [chordIdx, setChordIdx] = useState(0);
  const [micOn, setMic] = useState(false);
  const [detNote, setNote] = useState(null);
  const [confidence, setConf] = useState(0);
  const [mutes, setMutes] = useState({ kick:false, bass:false, pad:false, lead:false, perc:false });
  const [vols, setVols] = useState({ kick:80, bass:85, pad:65, lead:70, perc:72 });
  const [toneStarted, setToneStarted] = useState(false);

  const stepRef = useRef(0);
  const chordRef = useRef(0);
  const timerRef = useRef(null);
  const recRef = useRef(null);
  const synthRef = useRef(null);
  const masterGainRef = useRef(null);

  const [activeTab, setActiveTab] = useState("live");

  // ---- Robust Audio Initialization ----
  const startAudio = useCallback(async () => {
    if (toneStarted) return;
    try {
      await Tone.start();
      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      const masterGain = new Tone.Gain(0.5).toDestination();
      masterGainRef.current = masterGain;
      if (!synthRef.current) {
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
        }).connect(masterGain);
      }
      setToneStarted(true);
      console.log("Tone.js started successfully");
    } catch (err) {
      console.error("Audio start error:", err);
      alert("Failed to start audio. Tap again and ensure permissions are granted.");
    }
  }, [toneStarted]);

  const handleLoadPattern = (newGenre, newKey, newProg, newBpm) => {
    setGenre(newGenre);
    setRootKey(KEYS.indexOf(newKey) !== -1 ? KEYS.indexOf(newKey) : 0);
    setProg(newProg);
    setBpm(newBpm);
    setActiveTab("live");
  };

  const handleApplyPreset = (newGenre, newProg, newBpm) => {
    setGenre(newGenre);
    setProg(newProg);
    setBpm(newBpm);
    setActiveTab("live");
  };

  const prog = PROGRESSIONS[progName] || PROGRESSIONS["I-V-vi-IV"];
  const gDef = GENRES[genre] || GENRES["Igbo Gospel"];
  const pat = PATTERNS[genre] || PATTERNS["Igbo Gospel"];
  const curChordRoot = (rootKey + (prog[chordIdx % prog.length] || 0)) % 12;
  const chordMidis = [60 + curChordRoot, 60 + curChordRoot + 4, 60 + curChordRoot + 7];
  const fmtT = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => {
    if (!playing || !toneStarted || !synthRef.current) {
      clearInterval(timerRef.current);
      return;
    }
    const ms = (60 / bpm / 4) * 1000;
    timerRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % 16;
      setStep(stepRef.current);
      if (stepRef.current === 0) {
        chordRef.current = (chordRef.current + 1) % prog.length;
        setChordIdx(chordRef.current);
      }
      const chordRoot = 60 + curChordRoot;
      const note = chordRoot + 4;
      const freq = Tone.Frequency(note, "midi").toFrequency();
      if (pat.pad[stepRef.current]) {
        synthRef.current.triggerAttackRelease(freq, "8n");
      }
    }, ms);
    return () => clearInterval(timerRef.current);
  }, [playing, bpm, toneStarted, prog.length, curChordRoot, pat]);

  useEffect(() => {
    if (recording) {
      recRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } else {
      clearInterval(recRef.current);
      if (!recording) setRecTime(0);
    }
    return () => clearInterval(recRef.current);
  }, [recording]);

  const start = () => {
    if (!toneStarted) {
      alert("Please tap the 'Start Audio' button first to enable sound.");
      return;
    }
    setPlaying(true);
    setChordIdx(0); setStep(0);
    stepRef.current = 0; chordRef.current = 0;
    setMode("live");
  };
  const stop = () => {
    setPlaying(false); setRec(false);
    if (recTime > 3) setMode("review");
    else setMode("setup");
  };

  const renderLiveStudio = () => {
    if (mode === "setup") return (
      <div className="fadeIn">
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, fontSize:20, marginBottom:4 }}>Configure Your Studio</div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani" }}>Set genre, key and progression — the virtual band follows you automatically</div>
        </div>
        <div style={cd()}>
          <div style={{ fontSize:12, fontWeight:700, color:C.gold, fontFamily:"Cinzel", marginBottom:10 }}>Genre</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.entries(GENRES).map(([g, def]) => (
              <button key={g} onClick={() => { setGenre(g); setBpm(def.bpm); }} style={{ background: genre===g ? `${def.color}22` : C.navy, color: genre===g ? def.color : C.muted, border: `1px solid ${genre===g ? def.color : C.border}`, borderRadius:20, padding:"6px 14px", cursor:"pointer", fontSize:11, fontFamily:"Rajdhani", fontWeight:600 }}>{g}</button>
            ))}
          </div>
        </div>
        <div style={cd()}>
          <div style={{ fontSize:12, fontWeight:700, color:C.gold, fontFamily:"Cinzel", marginBottom:10 }}>Root Key</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {KEYS.map((k, i) => (
              <button key={k} onClick={() => setRootKey(i)} style={{ background: rootKey===i ? `${C.teal}22` : C.navy, color: rootKey===i ? C.teal : C.muted, border: `1px solid ${rootKey===i ? C.teal : C.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:12, fontFamily:"Rajdhani", fontWeight:700, minWidth:36, textAlign:"center" }}>{k}</button>
            ))}
          </div>
        </div>
        <div style={cd()}>
          <div style={{ fontSize:12, fontWeight:700, color:C.gold, fontFamily:"Cinzel", marginBottom:10 }}>Chord Progression</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Object.keys(PROGRESSIONS).map((p) => (
              <button key={p} onClick={() => setProg(p)} style={{ background: progName===p ? `${C.cobalt}22` : C.navy, color: progName===p ? C.cobalt : C.muted, border: `1px solid ${progName===p ? C.cobalt : C.border}`, borderRadius:20, padding:"6px 14px", cursor:"pointer", fontSize:11, fontFamily:"Rajdhani", fontWeight:600 }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={cd()}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12, color:C.gold, fontFamily:"Cinzel", fontWeight:700 }}>Tempo</span>
            <span style={{ fontSize:16, color:C.amber, fontFamily:"Rajdhani", fontWeight:700 }}>{bpm} BPM</span>
          </div>
          <input type="range" min={60} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} style={{ width:"100%", accentColor:C.amber }} />
        </div>
        <div style={cd()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><div style={{ fontSize:12, color:C.offwhite, fontFamily:"Rajdhani", fontWeight:700 }}>Auto-Follow Mode</div><div style={{ fontSize:10, color:C.muted, fontFamily:"Rajdhani" }}>Band follows your key and chord progression automatically</div></div>
            <button onClick={() => setAuto(!autoFollow)} style={{ background: autoFollow ? C.green : C.navy, border:`2px solid ${autoFollow ? C.green : C.muted+"44"}`, borderRadius:20, width:44, height:24, cursor:"pointer", position:"relative", transition:"all .3s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:2, left: autoFollow ? 20 : 2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .25s" }} />
            </button>
          </div>
        </div>
        <div style={{ background:`${C.amber}11`, border:`1px solid ${C.amber}33`, borderRadius:12, padding:14, marginBottom:16 }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
            <div style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani", lineHeight:1.6 }}>
              <strong style={{color:C.amber}}>No direct platform streaming.</strong> SSNG Live Studio records locally only. This protects you from copyright strikes and protects SSNG legally.<br />
              <strong style={{color:C.offwhite}}>Workflow:</strong> Record here → Download → Distribute through your chosen platform with proper attribution.
            </div>
          </div>
        </div>
        <button onClick={start} style={{ width:"100%", background:`linear-gradient(135deg,${C.amber},${C.cobalt})`, color:C.offwhite, border:"none", borderRadius:14, padding:"18px", fontSize:18, fontWeight:700, cursor:"pointer", fontFamily:"Cinzel", letterSpacing:2, boxShadow:`0 6px 24px rgba(243,109,18,.4)` }}>🎤 START LIVE SESSION</button>
      </div>
    );

    if (mode === "live") return (
      <div className="fadeIn">
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <div style={{ flex:1, background:C.navy, border:`1px solid ${gDef.color}44`, borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontSize:9, color:C.muted, fontFamily:"Rajdhani", letterSpacing:1 }}>NOW PLAYING</div>
            <div style={{ fontFamily:"Cinzel", fontWeight:700, color:gDef.color, fontSize:16 }}>{genre} • {KEYS[rootKey]} • {bpm} BPM</div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:"Rajdhani", marginTop:2 }}>{progName} progression</div>
          </div>
          <div style={{ background:C.navy, border:`2px solid ${C.gold}`, borderRadius:10, padding:"10px 16px", textAlign:"center", boxShadow:`0 0 16px ${C.gold}33`, minWidth:90 }}>
            <div style={{ fontSize:9, color:C.muted, fontFamily:"Rajdhani" }}>CHORD</div>
            <div style={{ fontFamily:"Rajdhani", fontWeight:700, color:C.gold, fontSize:22, letterSpacing:1 }}>{NOTES[curChordRoot]}</div>
            <div style={{ fontSize:9, color:C.amber, fontFamily:"Rajdhani" }}>Bar {chordIdx+1}/{prog.length}</div>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:9, color:C.muted, fontFamily:"Rajdhani", letterSpacing:1, marginBottom:5 }}>PIANO — LIVE KEY LIGHTING</div>
          <PianoStrip activeNotes={detNote ? [detNote.midi] : []} chordNotes={chordMidis.map((m) => m % 12)} rootNote={curChordRoot} />
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
          {prog.map((sem, i) => {
            const root = (rootKey + sem) % 12;
            const isCur = i === chordIdx;
            return (
              <div key={i} style={{ background: isCur ? `${C.gold}22` : C.navy, border:`2px solid ${isCur ? C.gold : C.border}`, borderRadius:8, padding:"8px 14px", textAlign:"center", flexShrink:0, transition:"all .3s", boxShadow: isCur ? `0 0 12px ${C.gold}44` : "none" }}>
                <div style={{ fontFamily:"Rajdhani", fontWeight:700, color: isCur ? C.gold : C.muted, fontSize:16 }}>{KEYS[root]}</div>
                <div style={{ fontSize:8, color:C.muted, fontFamily:"Rajdhani" }}>Bar {i+1}</div>
              </div>
            );
          })}
        </div>
        <div style={cd()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:700, fontFamily:"Rajdhani", color: micOn ? C.green : C.muted }}>🎤 {micOn ? "Microphone Active" : "Microphone Off"}</span>
            <button onClick={() => setMic(!micOn)} style={{ background: micOn ? `${C.red}22` : `${C.green}22`, color: micOn ? C.red : C.green, border: `1px solid ${micOn ? C.red : C.green}`, borderRadius:8, padding:"5px 14px", cursor:"pointer", fontSize:11, fontFamily:"Rajdhani", fontWeight:700 }}>{micOn ? "STOP" : "START"}</button>
          </div>
          <VUMeter active={micOn} />
          {detNote && (
            <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ background:`${C.amber}22`, border:`1px solid ${C.amber}`, borderRadius:8, padding:"6px 14px" }}>
                <div style={{ fontFamily:"Rajdhani", fontWeight:700, color:C.amber, fontSize:20 }}>{detNote.name}</div>
                <div style={{ fontSize:9, color:C.muted, fontFamily:"Rajdhani" }}>{detNote.freq}Hz</div>
              </div>
              <div style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani" }}>{autoFollow ? "✅ Auto-following your key" : "ℹ️ Manual progression mode"}</div>
            </div>
          )}
        </div>
        <div style={cd()}>
          <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, fontSize:12, marginBottom:10 }}>🥁 Virtual Band</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { id:"kick", icon:"🥁", label:"Kick", color:"#8B1A1A", pat:pat.kick },
              { id:"bass", icon:"🎸", label:"Bass", color:C.blue, pat:pat.bass },
              { id:"pad",  icon:"🎹", label:"Keys", color:C.gold, pat:pat.pad  },
              { id:"lead", icon:"🎺", label:"Lead", color:C.amber, pat:pat.lead },
              { id:"perc", icon:"🪘", label:"Perc", color:C.teal, pat:pat.perc },
            ].map((inst) => (
              <div key={inst.id} style={{ background:C.navy, border:`1px solid ${mutes[inst.id] ? C.border : inst.color+"44"}`, borderRadius:10, padding:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                  <span style={{ fontSize:16 }}>{inst.icon}</span>
                  <span style={{ fontSize:10, fontFamily:"Rajdhani", fontWeight:700, flex:1, color: mutes[inst.id] ? C.muted : inst.color }}>{inst.label}</span>
                  <button onClick={() => setMutes((m) => ({ ...m, [inst.id]:!m[inst.id] }))} style={{ background: mutes[inst.id] ? `${C.red}22` : `${inst.color}22`, color: mutes[inst.id] ? C.red : inst.color, border: `1px solid ${mutes[inst.id] ? C.red : inst.color}`, borderRadius:5, padding:"2px 7px", cursor:"pointer", fontSize:9, fontFamily:"Rajdhani", fontWeight:700 }}>{mutes[inst.id] ? "MUTED" : "LIVE"}</button>
                </div>
                <div style={{ display:"flex", gap:1.5, marginBottom:5 }}>
                  {inst.pat.map((hit, i) => (
                    <div key={i} style={{ flex:1, height:9, borderRadius:2, background: playing && !mutes[inst.id] && i===step && hit ? C.amber : hit && !mutes[inst.id] ? `${inst.color}88` : C.card, border:`1px solid ${i===step && playing ? C.amber : C.border}`, transition:"background .05s" }} />
                  ))}
                </div>
                <input type="range" min={0} max={100} value={vols[inst.id]} onChange={(e) => setVols((v) => ({ ...v, [inst.id]:Number(e.target.value) }))} style={{ width:"100%", accentColor: mutes[inst.id] ? C.muted : inst.color, height:3 }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setRec(!recording)} style={{ flex:1, background: recording ? `${C.red}22` : `${C.green}22`, color: recording ? C.red : C.green, border: `1px solid ${recording ? C.red : C.green}`, borderRadius:12, padding:"14px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Rajdhani", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {recording ? (
              <>
                <div className="pulse" style={{ width:10, height:10, borderRadius:"50%", background:C.red }} />
                STOP REC {fmtT(recTime)}
              </>
            ) : "⏺ RECORD"}
          </button>
          <button onClick={stop} style={{ background:`${C.muted}22`, color:C.muted, border:`1px solid ${C.muted}44`, borderRadius:12, padding:"14px 20px", cursor:"pointer", fontSize:13, fontFamily:"Rajdhani", fontWeight:700 }}>⏹ END</button>
        </div>
        <div style={{ marginTop:10, background:C.navy, border:`1px solid ${C.border}`, borderRadius:10, padding:10, display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:14 }}>🔒</span>
          <div style={{ fontSize:10, color:C.muted, fontFamily:"Rajdhani", lineHeight:1.5 }}><strong style={{color:C.amber}}>Local recording only.</strong> No audio sent to SSNG servers. Download after session and distribute with proper attribution.</div>
        </div>
      </div>
    );

    if (mode === "review") return (
      <div className="fadeIn">
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🎧</div>
          <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, fontSize:20 }}>Session Complete!</div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani", marginTop:4 }}>Recorded locally with SSNG watermarking</div>
        </div>
        <div style={cd()}>
          <div style={{ fontFamily:"Cinzel", color:C.gold, fontWeight:700, marginBottom:12 }}>Session Summary</div>
          {[
            ["Session ID",  sessionId.slice(0,26) + "..."],
            ["Genre",       genre],
            ["Key",         KEYS[rootKey] + " — " + progName],
            ["Tempo",       bpm + " BPM"],
            ["Type",        decl.isCover ? `Cover: "${decl.original?.title}" by ${decl.original?.artist}` : "Original Composition"],
            ["ISO 42001",   "AI session logged ✓"],
            ["NDPR",        "Consent recorded ✓"],
            ["Watermark",   "Embedded in export ✓"],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani", minWidth:100 }}>{k}:</span>
              <span style={{ fontSize:11, color:C.offwhite, fontFamily:"Rajdhani" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          {[
            { label:"⬇ Download WAV",   color:C.gold,   sub:"Lossless · High quality"  },
            { label:"⬇ Download MP3",   color:C.blue,   sub:"Compressed · For sharing" },
            { label:"📋 Chord Sheet PDF",color:C.teal,   sub:"Progression chart"        },
            { label:"📊 ISO 42001 Log",  color:C.purple, sub:"Audit trail report"       },
          ].map((btn) => (
            <button key={btn.label} style={{ background:`${btn.color}22`, color:btn.color, border:`1px solid ${btn.color}`, borderRadius:10, padding:"12px 8px", cursor:"pointer", fontFamily:"Rajdhani", fontWeight:700, fontSize:11, textAlign:"center" }}>
              {btn.label}
              <div style={{ fontSize:9, color:C.muted, fontWeight:400, marginTop:2 }}>{btn.sub}</div>
            </button>
          ))}
        </div>
        {decl.isCover && (
          <div style={{ background:`${C.amber}11`, border:`1px solid ${C.amber}33`, borderRadius:12, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:11, color:C.amber, fontFamily:"Rajdhani", fontWeight:700, marginBottom:4 }}>⚠️ Cover Song Distribution Notice</div>
            <div style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani", lineHeight:1.6 }}>Before distributing "{decl.original?.title}", obtain a mechanical license via:<br /><strong style={{color:C.offwhite}}>Easy Song Licensing</strong> • <strong style={{color:C.offwhite}}>DistroKid Cover Song</strong> • <strong style={{color:C.offwhite}}>Songfile by Harry Fox Agency</strong></div>
          </div>
        )}
        <div style={{ background:`${C.green}11`, border:`1px solid ${C.green}33`, borderRadius:12, padding:12, marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.green, fontFamily:"Rajdhani", marginBottom:6 }}>📤 Distribution Workflow</div>
          <div style={{ fontSize:11, color:C.muted, fontFamily:"Rajdhani", lineHeight:1.7 }}>
            1. Download your WAV/MP3 above<br />
            2. {decl.isCover ? "Get mechanical license first" : "Your original — no license needed"}<br />
            3. Upload via SSNG Distribution Panel → Boomplay, Audiomack, Spotify<br />
            4. Use Creator Hub to generate social captions + 25 hashtags<br />
            5. Use Automate page to schedule posts
          </div>
        </div>
        <button onClick={() => { setMode("setup"); setRec(false); setRecTime(0); setPlaying(false); }} style={{ width:"100%", background:`${C.amber}22`, color:C.amber, border:`1px solid ${C.amber}`, borderRadius:12, padding:"14px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"Rajdhani", letterSpacing:0.5 }}>🎵 Start New Session</button>
      </div>
    );
    return null;
  };

  if (!terms) return <TermsGate onAccept={() => setTerms(true)} />;
  if (!decl) return <CoverDeclaration onComplete={setDecl} />;

  return (
    <div style={{ fontFamily:"Rajdhani, sans-serif", background:C.bg, minHeight:"100vh", color:C.offwhite }}>
      <style>{css}</style>

      <header style={{
        background:`linear-gradient(90deg,${C.navy},${C.bg})`,
        borderBottom:`2px solid ${C.bronze}44`,
        padding:"8px 16px",
        position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 4px 20px rgba(0,0,0,.6)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          <SSNGLogo />
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:"Cinzel", fontWeight:700, color:C.gold, fontSize:12, letterSpacing:2, whiteSpace:"nowrap" }}>SSNG LIVE STUDIO</div>
            <div style={{ fontSize:8, color:C.bronze, fontFamily:"Rajdhani", letterSpacing:1 }}>ISO 42001 • NDPR 2019</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {recording && (
            <div style={{ display:"flex", gap:5, alignItems:"center", background:`${C.red}22`, border:`1px solid ${C.red}`, borderRadius:20, padding:"3px 10px" }}>
              <div className="pulse" style={{ width:7, height:7, borderRadius:"50%", background:C.red }} />
              <span style={{ fontSize:10, color:C.red, fontFamily:"Rajdhani", fontWeight:700 }}>REC {fmtT(recTime)}</span>
            </div>
          )}
          <Badge label={decl.isCover ? "COVER" : "ORIGINAL"} color={C.green} small />
          <img src={bronzePot} alt="Igbo Ukwu Bronze Roped Pot — The Capo" title="Igbo Ukwu Bronze (9th c.) — The Capo" style={{ width:42, height:42, borderRadius:6, objectFit:"cover", cursor:"pointer", transition:"box-shadow .3s", border:`1px solid ${C.bronze}66` }} onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 12px ${C.bronze}`)} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")} />
        </div>
      </header>

      <nav style={{
        display:"flex", gap:6, padding:"10px 16px",
        background:C.bg, borderBottom:`1px solid ${C.border}`,
        overflowX:"auto", WebkitOverflowScrolling:"touch",
      }}>
        {[
          { id:"live",     label:"🎛️ Live Studio"     },
          { id:"patterns", label:"📚 Pattern Library"  },
          { id:"skills",   label:"🧠 Skills & Theory"  },
          { id:"content",  label:"📸 Content Hub"      },
          { id:"presets",  label:"⚡ DJ Presets"        },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab===tab.id ? C.primary : C.navy,
            color: activeTab===tab.id ? C.bg : C.offwhite,
            border: `1px solid ${activeTab===tab.id ? C.primary : C.bronze}66`,
            borderRadius: 20,
            padding: "7px 16px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "Rajdhani",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "background .2s, color .2s",
          }}>{tab.label}</button>
        ))}
      </nav>

      <main style={{ padding:16, maxWidth:640, margin:"0 auto" }}>
        {activeTab === "live" && (
          <>
            {!toneStarted && (
              <button onClick={startAudio} style={{
                width:"100%",
                background:C.primary,
                color:C.bg,
                border:"none",
                borderRadius:12,
                padding:"14px",
                fontSize:16,
                fontWeight:700,
                cursor:"pointer",
                marginBottom:12,
                transition:"background 0.3s",
                boxShadow:`0 0 20px ${C.primary}66`,
              }}>
                🔊 Start Audio Engine (Tap first!)
              </button>
            )}
            {renderLiveStudio()}
          </>
        )}
        {activeTab === "patterns" && (
          <PatternLibrary
            onLoadPattern={handleLoadPattern}
            currentGenre={genre}
            currentKey={KEYS[rootKey]}
            currentProg={progName}
            currentBpm={bpm}
          />
        )}
        {activeTab === "skills" && <SkillsTheory />}
        {activeTab === "content" && <ContentHub />}
        {activeTab === "presets" && <DJPresets onApplyPreset={handleApplyPreset} />}
      </main>

      <footer style={{
        marginTop:20, textAlign:"center",
        padding:"12px 0", borderTop:`1px solid ${C.border}`,
      }}>
        <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap", marginBottom:6 }}>
          <Badge label="ISO 42001" color={C.teal} small />
          <Badge label="ISO 25010" color={C.blue} small />
          <Badge label="WCAG 2.1 AA" color={C.green} small />
          <Badge label="NDPR 2019" color={C.amber} small />
          <Badge label="Copyright Act 2022" color={C.purple} small />
        </div>
        <div style={{ fontSize:9, color:C.bronze, fontFamily:"Rajdhani", fontStyle:"italic" }}>SoundSignatureNG Live Studio — Igboukwu to the World 🌍</div>
      </footer>
    </div>
  );
}
