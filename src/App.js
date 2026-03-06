import { useState, useEffect, useRef } from "react";

const INIT_CARDS = [
  { id: 0, name: "MASTERCARD", color: "#EB001B", salesQty: 20,  salesVol: 109409.77, retQty: 0, retVol: 0, qtyRate: 0.30, specialRate: null,     revFee: 305.56 },
  { id: 1, name: "VISA",       color: "#1A1F71", salesQty: 50,  salesVol: 236018.50, retQty: 0, retVol: 0, qtyRate: 0.30, specialRate: null,     revFee: 442.69 },
  { id: 2, name: "DISCOVER",   color: "#FF6600", salesQty: 0,   salesVol: 0.00,      retQty: 0, retVol: 0, qtyRate: 0.30, specialRate: null,     revFee: 0.00   },
  { id: 3, name: "AMEX",       color: "#007BC1", salesQty: 32,  salesVol: 79911.46,  retQty: 0, retVol: 0, qtyRate: 0.30, specialRate: 0.000170, revFee: 23.18  },
];
const INIT_CURRENT_RATE = 0.002738;
const INIT_PROCESSING_FEES = 771.43;

function deriveRows(cards, volRate) {
  return cards.map((c) => {
    const netVol = c.salesVol - c.retVol;
    const netQty = c.salesQty - c.retQty;
    const usedRate = c.specialRate !== null && c.specialRate !== undefined ? c.specialRate : volRate;
    const qtyFee = netQty * c.qtyRate;
    const volFee = netVol * usedRate;
    return { ...c, netVol, netQty, usedRate, qtyFee, volFee, calcFee: qtyFee + volFee };
  });
}

function computeOptimal(cards, processingFees) {
  const volSum = cards
    .filter((c) => c.specialRate === null || c.specialRate === undefined)
    .reduce((s, c) => s + (c.salesVol - c.retVol), 0);
  const fixed =
    cards.reduce((s, c) => s + (c.salesQty - c.retQty) * c.qtyRate, 0) +
    cards
      .filter((c) => c.specialRate !== null && c.specialRate !== undefined)
      .reduce((s, c) => s + (c.salesVol - c.retVol) * c.specialRate, 0);
  return volSum === 0 ? 0 : (processingFees - fixed) / volSum;
}

function fmtNum(n, dec) {
  const d = dec !== undefined ? dec : 2;
  if (isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtRate(r) {
  if (r === null || r === undefined || isNaN(r)) return "—";
  return Number(r).toFixed(6);
}
function parseCellNum(s) {
  const n = parseFloat(String(s).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function EditableCell({ value, display, onSave, accentColor }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select();
  }, [editing]);

  function startEdit() {
    setDraft(String(value !== null && value !== undefined ? value : ""));
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    onSave(parseCellNum(draft));
  }
  function handleKey(e) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <td style={{ padding: "2px 8px", textAlign: "right" }}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          style={{
            width: 88,
            background: "#0d2137",
            border: "1px solid #4fc3f7",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: 11,
            padding: "3px 6px",
            borderRadius: 4,
            textAlign: "right",
            outline: "none",
          }}
        />
      </td>
    );
  }

  return (
    <td
      onClick={startEdit}
      title="Click to edit"
      style={{
        padding: "8px 10px",
        textAlign: "right",
        color: accentColor || "#ffd54f",
        cursor: "pointer",
        fontVariantNumeric: "tabular-nums",
        fontSize: 11,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1a2a3a"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {display}
    </td>
  );
}

function ReadOnlyCell({ display, color }) {
  return (
    <td
      style={{
        padding: "8px 10px",
        textAlign: "right",
        color: color || "#78909c",
        fontVariantNumeric: "tabular-nums",
        fontSize: 11,
      }}
    >
      {display}
    </td>
  );
}

function HeaderCell({ children, accentColor }) {
  return (
    <th
      style={{
        padding: "9px 10px",
        color: accentColor || "#4fc3f7",
        fontWeight: 600,
        letterSpacing: 1,
        fontSize: 9,
        textAlign: "right",
        borderBottom: "1px solid #1e3a5f",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function InlineRateEdit({ value, color, onSave, asCurrency }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select();
  }, [editing]);

  function startEdit() {
    setDraft(String(value !== null && value !== undefined ? value : ""));
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    onSave(parseCellNum(draft));
  }
  function handleKey(e) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  const displayVal = asCurrency ? "$" + fmtNum(value) : fmtRate(value);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        style={{
          width: 90,
          background: "#0d2137",
          border: "1px solid #4fc3f7",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: 20,
          padding: "2px 6px",
          borderRadius: 4,
          textAlign: "center",
          outline: "none",
        }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Click to edit"
      style={{
        fontSize: 22,
        fontWeight: 700,
        color,
        cursor: "pointer",
        fontVariantNumeric: "tabular-nums",
        borderBottom: "1px dashed " + color + "66",
      }}
    >
      {displayVal}
    </span>
  );
}

export default function App() {
  const [cards, setCards] = useState(INIT_CARDS);
  const [currentRate, setCurrentRate] = useState(INIT_CURRENT_RATE);
  const [processingFees, setProcessingFees] = useState(INIT_PROCESSING_FEES);
  const [liveRate, setLiveRate] = useState(INIT_CURRENT_RATE);
  const [animating, setAnimating] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const optimalRate = computeOptimal(cards, processingFees);
  const rows = deriveRows(cards, liveRate);
  const optRows = deriveRows(cards, optimalRate);
  const calcTotal = rows.reduce((s, r) => s + r.calcFee, 0);
  const variance = calcTotal - processingFees;
  const initTotal = deriveRows(cards, currentRate).reduce((s, r) => s + r.calcFee, 0);
  const initVar = Math.abs(initTotal - processingFees);
  const varPct = initVar > 0 ? Math.abs(variance) / initVar : 0;
  const varColor = done
    ? "#00c853"
    : animating
    ? "hsl(" + (1 - varPct) * 120 + ", 80%, 45%)"
    : "#e53935";

  function eio(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function startAnim() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDone(false);
    setAnimating(true);
    setLiveRate(currentRate);
    setProgress(0);
    startRef.current = null;
    const from = currentRate;
    const to = optimalRate;
    function step(ts) {
      if (!startRef.current) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / 2800, 1);
      const e = eio(t);
      setLiveRate(from + (to - from) * e);
      setProgress(e * 100);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setLiveRate(to);
        setProgress(100);
        setAnimating(false);
        setDone(true);
      }
    }
    rafRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  function resetAnim() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setLiveRate(currentRate);
    setAnimating(false);
    setDone(false);
    setProgress(0);
  }

  function updateCard(id, field, val) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
    setDone(false);
    setLiveRate(currentRate);
    setProgress(0);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0e1a",
        fontFamily: "'Courier New', monospace",
        color: "#e8eaf0",
        padding: "22px 14px",
        boxSizing: "border-box",
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: "#4fc3f7", marginBottom: 3 }}>
          PAYMENT PROCESSING
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#fff",
            textShadow: "0 0 30px rgba(79,195,247,0.4)",
          }}
        >
          RATE OPTIMIZER
        </div>
        <div style={{ fontSize: 9, color: "#546e7a", letterSpacing: 3, marginTop: 3 }}>
          2/1/2026 · YELLOW = EDITABLE · GREEN = OPTIMAL
        </div>
      </div>

      {/* Top metric cards */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: "CURRENT RATE",
            node: (
              <InlineRateEdit
                value={currentRate}
                color="#ef5350"
                onSave={(v) => { setCurrentRate(v); setLiveRate(v); setDone(false); setProgress(0); }}
              />
            ),
          },
          {
            label: "LIVE RATE",
            node: (
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: animating ? "#ffd54f" : done ? "#69f0ae" : "#4fc3f7",
                }}
              >
                {fmtRate(liveRate)}
              </span>
            ),
          },
          {
            label: "OPTIMAL RATE",
            node: (
              <span style={{ fontSize: 22, fontWeight: 700, color: "#69f0ae", fontVariantNumeric: "tabular-nums" }}>
                {fmtRate(optimalRate)}
              </span>
            ),
          },
          {
            label: "TARGET FEES",
            node: (
              <InlineRateEdit
                value={processingFees}
                color="#ffd54f"
                asCurrency
                onSave={(v) => { setProcessingFees(v); setDone(false); setProgress(0); }}
              />
            ),
          },
        ].map(({ label, node }) => (
          <div
            key={label}
            style={{
              background: "#111827",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              padding: "10px 18px",
              textAlign: "center",
              minWidth: 140,
            }}
          >
            <div style={{ fontSize: 8, color: "#607d8b", letterSpacing: 3, marginBottom: 5 }}>{label}</div>
            {node}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: "#1a2035",
          borderRadius: 3,
          height: 4,
          margin: "0 auto 14px",
          maxWidth: 900,
          overflow: "hidden",
          border: "1px solid #1e3a5f",
        }}
      >
        <div
          style={{
            height: "100%",
            width: progress + "%",
            borderRadius: 3,
            background: done ? "#69f0ae" : "linear-gradient(90deg,#4fc3f7,#ffd54f)",
            boxShadow: animating ? "0 0 10px #4fc3f7" : "none",
            transition: animating ? "none" : "width 0.3s",
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 14px",
          overflowX: "auto",
          background: "#111827",
          borderRadius: 10,
          border: "1px solid #1e3a5f",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#0d1b2e" }}>
              <th
                style={{
                  padding: "9px 10px",
                  color: "#4fc3f7",
                  fontWeight: 600,
                  letterSpacing: 1,
                  fontSize: 9,
                  textAlign: "left",
                  borderBottom: "1px solid #1e3a5f",
                }}
              >
                Card
              </th>
              <HeaderCell accentColor="#ffd54f">Sales Qty ✎</HeaderCell>
              <HeaderCell accentColor="#ffd54f">Sales Volume ✎</HeaderCell>
              <HeaderCell accentColor="#ffd54f">Returns Qty ✎</HeaderCell>
              <HeaderCell accentColor="#ffd54f">Returns Volume ✎</HeaderCell>
              <HeaderCell>Net Volume</HeaderCell>
              <HeaderCell accentColor="#ffd54f">Qty Rate ✎</HeaderCell>
              <HeaderCell>Qty Fee</HeaderCell>
              <HeaderCell accentColor="#ffd54f">Vol Rate ✎</HeaderCell>
              <HeaderCell>Vol Fee</HeaderCell>
              <HeaderCell>Calc Fee</HeaderCell>
              <HeaderCell accentColor="#ffd54f">Rev Fee ✎</HeaderCell>
              <HeaderCell accentColor="#69f0ae">Opt Vol Fee</HeaderCell>
              <HeaderCell accentColor="#69f0ae">Opt Calc Fee</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const opt = optRows[i];
              const bg = i % 2 === 0 ? "#0f1624" : "#111827";
              const hasSpecial = r.specialRate !== null && r.specialRate !== undefined;
              return (
                <tr key={r.id} style={{ background: bg }}>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ color: r.color, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
                      {r.name}
                    </span>
                    {hasSpecial && (
                      <span style={{ fontSize: 8, color: "#ffd54f", marginLeft: 4 }}>FIXED</span>
                    )}
                  </td>

                  <EditableCell
                    value={r.salesQty}
                    display={fmtNum(r.salesQty, 0)}
                    onSave={(v) => updateCard(r.id, "salesQty", v)}
                  />
                  <EditableCell
                    value={r.salesVol}
                    display={"$" + fmtNum(r.salesVol)}
                    onSave={(v) => updateCard(r.id, "salesVol", v)}
                  />
                  <EditableCell
                    value={r.retQty}
                    display={fmtNum(r.retQty, 0)}
                    onSave={(v) => updateCard(r.id, "retQty", v)}
                  />
                  <EditableCell
                    value={r.retVol}
                    display={"$" + fmtNum(r.retVol)}
                    onSave={(v) => updateCard(r.id, "retVol", v)}
                  />

                  <ReadOnlyCell display={"$" + fmtNum(r.netVol)} color="#b0bec5" />

                  <EditableCell
                    value={r.qtyRate}
                    display={fmtRate(r.qtyRate)}
                    onSave={(v) => updateCard(r.id, "qtyRate", v)}
                  />

                  <ReadOnlyCell display={"$" + fmtNum(r.qtyFee)} color="#b0bec5" />

                  {hasSpecial ? (
                    <EditableCell
                      value={r.specialRate}
                      display={fmtRate(r.specialRate)}
                      onSave={(v) => updateCard(r.id, "specialRate", v)}
                      accentColor="#ffd54f"
                    />
                  ) : (
                    <ReadOnlyCell display={fmtRate(liveRate)} color="#4fc3f7" />
                  )}

                  <ReadOnlyCell display={"$" + fmtNum(r.volFee)} color="#cfd8dc" />
                  <ReadOnlyCell display={"$" + fmtNum(r.calcFee)} color="#e0e0e0" />

                  <EditableCell
                    value={r.revFee}
                    display={"$" + fmtNum(r.revFee)}
                    onSave={(v) => updateCard(r.id, "revFee", v)}
                  />

                  <ReadOnlyCell display={"$" + fmtNum(opt.volFee)} color="#69f0ae" />
                  <ReadOnlyCell display={"$" + fmtNum(opt.calcFee)} color="#69f0ae" />
                </tr>
              );
            })}

            {/* Totals row */}
            <tr style={{ background: "#0d1b2e", borderTop: "2px solid #1e3a5f" }}>
              <td style={{ padding: "9px 10px", fontWeight: 700, color: "#4fc3f7", fontSize: 11, letterSpacing: 1 }}>
                TOTAL
              </td>
              <ReadOnlyCell display={fmtNum(rows.reduce((s, r) => s + r.salesQty, 0), 0)} color="#78909c" />
              <ReadOnlyCell display={"$" + fmtNum(rows.reduce((s, r) => s + r.salesVol, 0))} color="#78909c" />
              <ReadOnlyCell display={fmtNum(rows.reduce((s, r) => s + r.retQty, 0), 0)} color="#78909c" />
              <ReadOnlyCell display={"$" + fmtNum(rows.reduce((s, r) => s + r.retVol, 0))} color="#78909c" />
              <ReadOnlyCell display={"$" + fmtNum(rows.reduce((s, r) => s + r.netVol, 0))} color="#78909c" />
              <td />
              <ReadOnlyCell display={"$" + fmtNum(rows.reduce((s, r) => s + r.qtyFee, 0))} color="#cfd8dc" />
              <td />
              <ReadOnlyCell display={"$" + fmtNum(rows.reduce((s, r) => s + r.volFee, 0))} color="#cfd8dc" />
              <td style={{ padding: "9px 10px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                {"$" + fmtNum(calcTotal)}
              </td>
              <ReadOnlyCell display={"$" + fmtNum(processingFees)} color="#546e7a" />
              <ReadOnlyCell display={"$" + fmtNum(optRows.reduce((s, r) => s + r.volFee, 0))} color="#69f0ae" />
              <td style={{ padding: "9px 10px", textAlign: "right", color: "#69f0ae", fontWeight: 700, fontSize: 13 }}>
                {"$" + fmtNum(optRows.reduce((s, r) => s + r.calcFee, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom summary + buttons */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
          {[
            { label: "CALC TOTAL",   val: "$" + fmtNum(calcTotal),                                         color: "#fff"     },
            { label: "TARGET FEES",  val: "$" + fmtNum(processingFees),                                    color: "#ffd54f"  },
            { label: "VARIANCE",     val: (variance >= 0 ? "+" : "") + "$" + fmtNum(Math.abs(variance)),   color: varColor   },
            { label: "OPTIMAL RATE", val: fmtRate(optimalRate),                                             color: "#69f0ae" },
            { label: "RATE SAVED",   val: fmtRate(Math.max(0, currentRate - liveRate)),                    color: "#4fc3f7"  },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              style={{
                background: "#111827",
                border: "1px solid #1e3a5f",
                borderRadius: 7,
                padding: "8px 12px",
                minWidth: 100,
                flex: 1,
              }}
            >
              <div style={{ fontSize: 8, color: "#546e7a", letterSpacing: 2, marginBottom: 3 }}>{label}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color,
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 0.3s",
                }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={startAnim}
            disabled={animating}
            style={{
              background: animating ? "#1a2a1a" : "linear-gradient(135deg,#1b5e20,#2e7d32)",
              border: "1px solid #4caf50",
              borderRadius: 7,
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 11,
              letterSpacing: 2,
              padding: "11px 22px",
              cursor: animating ? "not-allowed" : "pointer",
              fontWeight: 700,
              boxShadow: animating ? "none" : "0 0 16px #4caf5033",
              opacity: animating ? 0.6 : 1,
            }}
          >
            {animating ? "OPTIMIZING..." : done ? "▶ RUN AGAIN" : "▶ OPTIMIZE RATE"}
          </button>
          <button
            onClick={resetAnim}
            disabled={animating}
            style={{
              background: "transparent",
              border: "1px solid #37474f",
              borderRadius: 7,
              color: "#78909c",
              fontFamily: "inherit",
              fontSize: 10,
              letterSpacing: 2,
              padding: "9px 22px",
              cursor: animating ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            ↺ RESET
          </button>
        </div>
      </div>

      {done && (
        <div
          style={{
            maxWidth: 1200,
            margin: "12px auto 0",
            background: "#0a1f0a",
            border: "1px solid #4caf50",
            borderRadius: 7,
            padding: "11px 20px",
            textAlign: "center",
            color: "#69f0ae",
            fontSize: 12,
            letterSpacing: 2,
          }}
        >
          ✓ OPTIMAL RATE FOUND — {fmtRate(optimalRate)} — VARIANCE ELIMINATED
        </div>
      )}
    </div>
  );
}
