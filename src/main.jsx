import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const JUDGMENT = {
  perfect: 55,
  good: 120,
  earlyLate: 210,
};

const ACTIONS = {
  attack: {
    label: "Attack",
    short: "N",
    key: "J / Mouse L",
    gamepad: "B / O",
    lane: "attack",
  },
  holdAttack: {
    label: "Hold Attack",
    short: "CA",
    key: "Hold J / Mouse L",
    gamepad: "Hold B / O",
    lane: "charged",
  },
  skill: {
    label: "Skill",
    short: "E",
    key: "E",
    gamepad: "RT / R2",
    lane: "skill",
  },
  holdSkill: {
    label: "Hold Skill",
    short: "Hold E",
    key: "Hold E",
    gamepad: "Hold RT / R2",
    lane: "skill",
  },
  burst: {
    label: "Burst",
    short: "Q",
    key: "Q",
    gamepad: "Y / Triangle",
    lane: "burst",
  },
  dash: {
    label: "Dash",
    short: "D",
    key: "Shift / Mouse R",
    gamepad: "RB / R1",
    lane: "dash",
  },
  setup: {
    label: "Setup Hit",
    short: "SET",
    key: "A",
    gamepad: "X / Square",
    lane: "setup",
  },
};

const combos = [
  {
    id: "extinction-n5-n3",
    name: "Extinction Driver",
    notation: "E > Q > N5 > N3",
    difficulty: "Core",
    recommendedUse: "Post-Extinction normal-hit rhythm for All Shall Wither practice.",
    durationMs: 7200,
    sourceNotes:
      "Trainer timing. Based on Skirk entering Seven-Phase Flash with Havoc: Warp, converting Burst to Havoc: Extinction, then cashing normal hits during the mode.",
    events: [
      ["skill", 0, "Warp"],
      ["burst", 760, "Extinction"],
      ["attack", 1540, "N1"],
      ["attack", 2020, "N2"],
      ["attack", 2520, "N3"],
      ["attack", 3100, "N4"],
      ["attack", 3740, "N5"],
      ["attack", 4620, "N1"],
      ["attack", 5100, "N2"],
      ["attack", 5620, "N3"],
    ],
  },
  {
    id: "n5-n5",
    name: "Twin Serpent String",
    notation: "E > N5 > N5",
    difficulty: "Core",
    recommendedUse: "Sustained Seven-Phase Flash normal string with no burst interruption.",
    durationMs: 7350,
    sourceNotes:
      "Trainer timing. Practices full five-hit sequences during the 12.5s Seven-Phase Flash window.",
    events: [
      ["skill", 0, "Warp"],
      ["attack", 720, "N1"],
      ["attack", 1200, "N2"],
      ["attack", 1700, "N3"],
      ["attack", 2280, "N4"],
      ["attack", 2920, "N5"],
      ["attack", 3900, "N1"],
      ["attack", 4380, "N2"],
      ["attack", 4880, "N3"],
      ["attack", 5460, "N4"],
      ["attack", 6100, "N5"],
    ],
  },
  {
    id: "n3c",
    name: "Rift Hook",
    notation: "E > N3C",
    difficulty: "Practical",
    recommendedUse: "Charged attack timing for Void Rift absorption practice.",
    durationMs: 4300,
    sourceNotes:
      "Trainer timing. Skirk can absorb nearby Void Rifts when a Charged Attack hits in Seven-Phase Flash.",
    events: [
      ["skill", 0, "Warp"],
      ["attack", 700, "N1"],
      ["attack", 1180, "N2"],
      ["attack", 1690, "N3"],
      ["holdAttack", 2240, "CA hold"],
      ["holdAttack", 2860, "CA release"],
    ],
  },
  {
    id: "ca-extinction-n5-n3",
    name: "Rift Into Extinction",
    notation: "E > CA > Q > N5 > N3",
    difficulty: "Advanced",
    recommendedUse: "Rift absorption into Havoc: Extinction, then normal-hit follow-through.",
    durationMs: 7900,
    sourceNotes:
      "Trainer timing. Combines Void Rift pickup timing with the special Burst available during Seven-Phase Flash.",
    events: [
      ["skill", 0, "Warp"],
      ["holdAttack", 760, "CA hold"],
      ["holdAttack", 1380, "CA release"],
      ["burst", 2080, "Extinction"],
      ["attack", 2920, "N1"],
      ["attack", 3400, "N2"],
      ["attack", 3900, "N3"],
      ["attack", 4480, "N4"],
      ["attack", 5120, "N5"],
      ["attack", 6020, "N1"],
      ["attack", 6500, "N2"],
      ["attack", 7020, "N3"],
    ],
  },
  {
    id: "hold-e-rift",
    name: "Void Step Pickup",
    notation: "Hold E > CA / Q",
    difficulty: "Utility",
    recommendedUse: "Rapid movement pickup practice for scattered Void Rifts.",
    durationMs: 5200,
    sourceNotes:
      "Trainer timing. Skirk can absorb Void Rifts by holding Havoc: Warp for rapid movement, then confirm with Charged Attack or Extinction.",
    events: [
      ["holdSkill", 0, "Hold Warp"],
      ["dash", 780, "Drift"],
      ["holdSkill", 1320, "Release"],
      ["holdAttack", 2060, "CA hold"],
      ["holdAttack", 2640, "CA release"],
      ["burst", 3600, "Optional Q"],
    ],
  },
  {
    id: "team-freeze-entry",
    name: "Cryo-Hydro Entry",
    notation: "SET > SET > E > Q > N5",
    difficulty: "Team",
    recommendedUse: "Short team pre-roll for Frozen or Cryo/Hydro setup before Skirk takes field.",
    durationMs: 7600,
    sourceNotes:
      "Trainer timing. Skirk gains value from Hydro/Cryo teammates creating reactions and Death's Crossing stacks before her field time.",
    events: [
      ["setup", 0, "Hydro hit"],
      ["setup", 900, "Cryo hit"],
      ["skill", 1840, "Warp"],
      ["burst", 2600, "Extinction"],
      ["attack", 3420, "N1"],
      ["attack", 3900, "N2"],
      ["attack", 4400, "N3"],
      ["attack", 4980, "N4"],
      ["attack", 5620, "N5"],
    ],
  },
].map((combo) => ({
  ...combo,
  events: combo.events.map(([action, t, label], index) => ({
    id: `${combo.id}-${index}`,
    action,
    t,
    label,
  })),
}));

const laneNames = [
  ["setup", "Setup"],
  ["skill", "Skill"],
  ["burst", "Burst"],
  ["attack", "Normal"],
  ["charged", "Charged"],
  ["dash", "Dash"],
];

function classify(delta) {
  const abs = Math.abs(delta);
  if (abs <= JUDGMENT.perfect) return "perfect";
  if (abs <= JUDGMENT.good) return "good";
  if (abs <= JUDGMENT.earlyLate) return delta < 0 ? "early" : "late";
  return "miss";
}

function eventToBar(event) {
  const action = ACTIONS[event.action];
  return {
    ...event,
    lane: action.lane,
    actionLabel: action.label,
    short: action.short,
  };
}

function formatMs(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function playTone(kind) {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = kind === "perfect" ? 740 : kind === "good" ? 520 : kind === "miss" ? 150 : 290;
  osc.frequency.value = freq;
  osc.type = kind === "miss" ? "sawtooth" : "triangle";
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.13);
}

function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let raf = 0;
    const particles = Array.from({ length: 78 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 0.8 + 0.2,
      drift: (i % 2 === 0 ? 1 : -1) * (0.00008 + Math.random() * 0.00012),
    }));

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.clientWidth * ratio);
      canvas.height = Math.floor(canvas.clientHeight * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      frame += 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(7, 12, 24, 0.82)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(122, 218, 255, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i += 1) {
        const y = ((frame * 0.08 + i * 96) % (h + 120)) - 80;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y - 80);
        ctx.stroke();
      }
      particles.forEach((p, index) => {
        p.x = (p.x + p.drift + 1) % 1;
        const px = p.x * w;
        const py = ((p.y + frame * 0.00012 * p.z) % 1) * h;
        const size = 1 + p.z * 2.2;
        ctx.fillStyle = index % 5 === 0 ? "rgba(207, 235, 255, 0.78)" : "rgba(99, 190, 255, 0.48)";
        ctx.fillRect(px, py, size, size);
      });
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

function App() {
  const [comboId, setComboId] = useState(combos[0].id);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [practiceMode, setPracticeMode] = useState("kbm");
  const [audioOn, setAudioOn] = useState(true);
  const [freestyle, setFreestyle] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [results, setResults] = useState({});
  const [feedback, setFeedback] = useState("Awaiting first input");
  const [streak, setStreak] = useState(0);
  const [topStreak, setTopStreak] = useState(() => Number(localStorage.getItem("skirkTopStreak") || 0));
  const [connectedPad, setConnectedPad] = useState("No gamepad");
  const [pressed, setPressed] = useState({});
  const canvasRef = useRef(null);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const resultsRef = useRef(results);
  const runningRef = useRef(running);
  const combo = useMemo(() => combos.find((item) => item.id === comboId) || combos[0], [comboId]);
  const bars = useMemo(() => combo.events.map(eventToBar), [combo]);
  const progress = Math.min(1, timeMs / combo.durationMs);

  useParticles(canvasRef);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const reset = useCallback(
    (nextRunning = false) => {
      cancelAnimationFrame(rafRef.current);
      setTimeMs(0);
      setResults({});
      setFeedback(nextRunning ? "Listen for the opening Warp" : "Awaiting first input");
      if (nextRunning) {
        startRef.current = performance.now();
      }
      setRunning(nextRunning);
    },
    []
  );

  useEffect(() => {
    reset(false);
  }, [comboId, reset]);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) * speed;
      setTimeMs(elapsed);
      const updated = {};
      let changed = false;
      combo.events.forEach((event) => {
        const existing = resultsRef.current[event.id];
        if (!existing && elapsed - event.t > JUDGMENT.earlyLate) {
          updated[event.id] = { status: "miss", delta: elapsed - event.t };
          changed = true;
        }
      });
      if (changed) {
        setResults((prev) => ({ ...prev, ...updated }));
        setStreak(0);
        setFeedback("Missed window");
        if (audioOn) playTone("miss");
      }
      if (elapsed >= combo.durationMs + 300) {
        setRunning(false);
        setFeedback("Loop complete. Restart when ready.");
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [audioOn, combo, running, speed]);

  const registerAction = useCallback(
    (action) => {
      setPressed((prev) => ({ ...prev, [action]: true }));
      window.setTimeout(() => setPressed((prev) => ({ ...prev, [action]: false })), 120);

      if (!runningRef.current && !freestyle) {
        reset(true);
        window.setTimeout(() => registerAction(action), 20);
        return;
      }

      if (freestyle) {
        setFeedback(`${ACTIONS[action].label} captured`);
        if (audioOn) playTone("good");
        return;
      }

      const currentTime = (performance.now() - startRef.current) * speed;
      const candidates = combo.events
        .filter((event) => event.action === action && !resultsRef.current[event.id])
        .map((event) => ({ event, delta: currentTime - event.t, abs: Math.abs(currentTime - event.t) }))
        .filter((item) => item.abs <= JUDGMENT.earlyLate)
        .sort((a, b) => a.abs - b.abs);

      if (!candidates.length) {
        setFeedback(`${ACTIONS[action].label}: wrong input`);
        setStreak(0);
        if (audioOn) playTone("miss");
        return;
      }

      const { event, delta } = candidates[0];
      const status = classify(delta);
      setResults((prev) => ({
        ...prev,
        [event.id]: { status, delta },
      }));
      setStreak((prev) => {
        const next = status === "miss" ? 0 : prev + 1;
        if (next > topStreak) {
          setTopStreak(next);
          localStorage.setItem("skirkTopStreak", String(next));
        }
        return next;
      });
      setFeedback(`${event.label}: ${status} ${delta >= 0 ? "+" : ""}${Math.round(delta)}ms`);
      if (audioOn) playTone(status);
    },
    [audioOn, combo, freestyle, reset, speed, topStreak]
  );

  useEffect(() => {
    const down = (event) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === "j") registerAction("attack");
      if (key === "e") registerAction(event.shiftKey ? "holdSkill" : "skill");
      if (key === "q") registerAction("burst");
      if (key === "shift") registerAction("dash");
      if (key === "a") registerAction("setup");
      if (key === "k") registerAction("holdAttack");
      if (key === " ") {
        event.preventDefault();
        reset(!runningRef.current);
      }
    };
    const mouse = (event) => {
      if (event.target.closest?.("button, a, input, label")) return;
      if (event.button === 0) registerAction("attack");
      if (event.button === 2) registerAction("dash");
    };
    const context = (event) => event.preventDefault();
    window.addEventListener("keydown", down);
    window.addEventListener("mousedown", mouse);
    window.addEventListener("contextmenu", context);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("mousedown", mouse);
      window.removeEventListener("contextmenu", context);
    };
  }, [registerAction, reset]);

  useEffect(() => {
    const previous = new Set();
    let raf = 0;
    const poll = () => {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      const pad = pads[0];
      setConnectedPad(pad ? pad.id.replace(/\s+/g, " ").slice(0, 34) : "No gamepad");
      if (pad) {
        const map = [
          [1, "attack"],
          [2, "setup"],
          [3, "burst"],
          [5, "dash"],
          [7, "skill"],
        ];
        map.forEach(([buttonIndex, action]) => {
          const isDown = pad.buttons[buttonIndex]?.pressed;
          const token = `${buttonIndex}:${action}`;
          if (isDown && !previous.has(token)) registerAction(action);
          if (isDown) previous.add(token);
          else previous.delete(token);
        });
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [registerAction]);

  const currentTarget = combo.events.find((event) => !results[event.id]);
  const completed = Object.keys(results).length;
  const score = combo.events.reduce((sum, event) => {
    const status = results[event.id]?.status;
    if (status === "perfect") return sum + 1000;
    if (status === "good") return sum + 650;
    if (status === "early" || status === "late") return sum + 300;
    return sum;
  }, 0);

  return (
    <main className="app-shell">
      <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
      <section className="trainer">
        <header className="topbar">
          <div className="brand">
            <span className="sigil">Void Star</span>
            <h1>Skirk Combo Trainer</h1>
          </div>
          <div className="top-actions">
            <a href="https://vulcanizer.netlify.app/" target="_blank" rel="noreferrer">
              Reference
            </a>
            <a href="https://genshin-impact.fandom.com/wiki/Skirk" target="_blank" rel="noreferrer">
              Skirk Source
            </a>
          </div>
        </header>

        <section className="combo-strip" aria-label="Combo selection">
          {combos.map((item) => (
            <button
              key={item.id}
              className={item.id === combo.id ? "combo-card active" : "combo-card"}
              onClick={() => setComboId(item.id)}
            >
              <span>{item.difficulty}</span>
              <strong>{item.name}</strong>
              <small>{item.notation}</small>
            </button>
          ))}
        </section>

        <section className="workbench">
          <div className="timeline-panel">
            <div className="combo-heading">
              <div>
                <p className="eyebrow">Input Timeline</p>
                <h2>{combo.notation}</h2>
              </div>
              <div className="timer">
                <span>{formatMs(timeMs)}</span>
                <small>{formatMs(combo.durationMs)}</small>
              </div>
            </div>

            <div className="timeline" style={{ "--progress": progress }}>
              <div className="now-line">
                <span>NOW</span>
              </div>
              {laneNames.map(([lane, label]) => (
                <div className="lane" key={lane}>
                  <div className="lane-label">{label}</div>
                  <div className="lane-track">
                    {bars
                      .filter((bar) => bar.lane === lane)
                      .map((bar) => {
                        const left = `${(bar.t / combo.durationMs) * 100}%`;
                        const result = results[bar.id]?.status || "";
                        return (
                          <button
                            type="button"
                            key={bar.id}
                            className={`event-mark ${bar.lane} ${result}`}
                            style={{ left }}
                            title={`${bar.label} at ${formatMs(bar.t)}`}
                          >
                            <span>{bar.short}</span>
                            <em>{bar.label}</em>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            <div className="status-row">
              <div>
                <p>{feedback}</p>
                <span>
                  Next: {currentTarget ? `${ACTIONS[currentTarget.action].label} (${currentTarget.label})` : "Complete"}
                </span>
              </div>
              <div className="meter">
                <span>{completed}/{combo.events.length}</span>
                <strong>{score}</strong>
              </div>
            </div>
          </div>

          <aside className="control-panel">
            <div className="stats-grid">
              <div>
                <span>Streak</span>
                <strong>x{streak}</strong>
              </div>
              <div>
                <span>Top</span>
                <strong>x{topStreak}</strong>
              </div>
            </div>

            <div className="control-row">
              <button className="primary" onClick={() => reset(!running)}>
                {running ? "Stop" : "Start"}
              </button>
              <button onClick={() => reset(false)}>Reset</button>
              <button className={audioOn ? "toggle on" : "toggle"} onClick={() => setAudioOn((value) => !value)}>
                Audio
              </button>
            </div>

            <label className="slider-label">
              <span>Game Speed</span>
              <strong>{Math.round(speed * 100)}%</strong>
              <input
                type="range"
                min="0.55"
                max="1.2"
                step="0.05"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
            </label>

            <div className="segmented" role="tablist" aria-label="Input mode">
              {["kbm", "mobile", "gamepad"].map((mode) => (
                <button
                  key={mode}
                  className={practiceMode === mode ? "selected" : ""}
                  onClick={() => setPracticeMode(mode)}
                >
                  {mode === "kbm" ? "KBM" : mode === "mobile" ? "Touch" : "Gamepad"}
                </button>
              ))}
            </div>

            <div className="input-map">
              {practiceMode === "gamepad" && <p className="pad-name">{connectedPad}</p>}
              {Object.entries(ACTIONS)
                .filter(([id]) => id !== "setup" || combo.events.some((event) => event.action === "setup"))
                .map(([id, action]) => (
                  <button
                    key={id}
                    className={pressed[id] ? "input-button pressed" : "input-button"}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture?.(event.pointerId);
                      registerAction(id);
                    }}
                  >
                    <span>{action.label}</span>
                    <strong>{practiceMode === "gamepad" ? action.gamepad : action.key}</strong>
                  </button>
                ))}
            </div>

            <button className={freestyle ? "freestyle on" : "freestyle"} onClick={() => setFreestyle((value) => !value)}>
              Freestyle: {freestyle ? "ON" : "OFF"}
            </button>
          </aside>
        </section>

        <section className="notes">
          <div>
            <p className="eyebrow">Recommended Use</p>
            <p>{combo.recommendedUse}</p>
          </div>
          <div>
            <p className="eyebrow">Timing Notes</p>
            <p>{combo.sourceNotes}</p>
          </div>
          <div>
            <p className="eyebrow">Kit Baseline</p>
            <p>
              Skirk practices here assume Seven-Phase Flash from Havoc: Warp, a 12.5s field window, Cryo-infused
              normal and charged attacks, Void Rift absorption, and Havoc: Extinction inside the mode.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
