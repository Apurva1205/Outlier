import React, { useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RefreshCw } from "lucide-react";

// --- helpers: robust statistics ---
function median(arr) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 !== 0 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function mad(arr, med) {
  if (!arr.length) return 0;
  const dev = arr.map((x) => Math.abs(x - med));
  return median(dev);
}
function robustZ(x, med, madVal) {
  if (madVal === 0) return 0;
  // 1.4826 scales MAD to be comparable to std for normal dist
  return (x - med) / (1.4826 * madVal);
}

// --- demo data ---
function seededRandom(seed) {
  // simple LCG for reproducibility
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function generateData(n = 300, seed = 42) {
  const rand = seededRandom(seed);
  const base = [];
  for (let i = 0; i < n; i++) {
    // normal-ish around 50 with sd ~10 (Box–Muller-lite)
    const u = rand() || 1e-6;
    const v = rand() || 1e-6;
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const val = 50 + 10 * z;
    base.push(val);
  }
  // inject a few outliers
  const outlierIdx = [12, 47, 88, 120, 201, 260];
  outlierIdx.forEach((i, k) => {
    if (i < base.length) base[i] = k % 2 === 0 ? 130 + 10 * k : -10 - 7 * k;
  });
  return base.map((x, i) => ({ id: i + 1, value: Math.round(x * 100) / 100 }));
}

export default function OutlierDetectorDemo() {
  const [seed, setSeed] = useState(42);
  const [threshold, setThreshold] = useState(3.5); // default robust threshold
  const rows = useMemo(() => generateData(320, seed), [seed]);

  const stats = useMemo(() => {
    const vals = rows.map((r) => r.value);
    const med = Math.round(median(vals) * 100) / 100;
    const m = mad(vals, med);
    const madScaled = Math.round((1.4826 * m) * 100) / 100;
    const enriched = rows.map((r) => {
      const z = robustZ(r.value, med, m);
      return { ...r, z: z, absZ: Math.abs(z), flag: Math.abs(z) >= threshold };
    });
    const flagged = enriched.filter((r) => r.flag);
    const clean = enriched.filter((r) => !r.flag);
    return { med, mad: Math.round(m * 100) / 100, madScaled, enriched, flagged, clean };
  }, [rows, threshold]);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Outlier Detector — Simple Demo</h1>
            <p className="mt-1 text-sm text-gray-600">Robust z-score via Median & MAD. Great for big data pipelines; this page shows a tiny, visual example.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-100"
            >
              <RefreshCw size={16} />
              Regenerate Data
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Median</div>
            <div className="text-2xl font-semibold">{stats.med}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">MAD (×1.4826 ≈ σ)</div>
            <div className="text-2xl font-semibold">{stats.mad} ({stats.madScaled})</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Flagged</div>
            <div className="text-2xl font-semibold">{stats.flagged.length} / {stats.enriched.length} ({((stats.flagged.length / stats.enriched.length) * 100).toFixed(1)}%)</div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Interactive chart</h2>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Threshold |z| ≥ {threshold.toFixed(1)}</label>
              <input
                type="range"
                min={2}
                max={6}
                step={0.1}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-48"
              />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="id" name="index" tick={{ fontSize: 12 }} />
                <YAxis type="number" dataKey="value" name="value" tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [v, n]} />
                <Legend />
                <Scatter name="Clean" data={stats.clean} fill="#4f46e5" opacity={0.8} />
                <Scatter name="Flagged" data={stats.flagged} fill="#ef4444" opacity={0.9} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-base font-semibold">Top flagged points</h3>
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="w-20">#</th>
                  <th>Value</th>
                  <th>|z|</th>
                </tr>
              </thead>
              <tbody>
                {stats.flagged
                  .slice()
                  .sort((a, b) => b.absZ - a.absZ)
                  .slice(0, 12)
                  .map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-1">{r.id}</td>
                      <td className="truncate py-1">{r.value}</td>
                      <td className="py-1">{Math.abs(r.absZ).toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm mb-6">
          <h3 className="mb-2 text-base font-semibold">How it works</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
            <li><b>Generate data:</b> this demo makes a normal-ish series around 50 and injects a few obvious outliers.</li>
            <li><b>Robust stats:</b> we compute the <b>median</b> and <b>MAD</b> (median absolute deviation), which are stable even if a few values are extreme.</li>
            <li><b>Score each point:</b> for every value <code>x</code> we compute a robust z-score: <code>(x − median) / (1.4826 × MAD)</code>.</li>
            <li><b>Flag outliers:</b> if <code>|z|</code> is above the slider threshold (default 3.5), it’s marked as “Flagged” and turns red on the chart.</li>
            <li><b>Why this scales:</b> in production you’d compute medians/quantiles with streaming sketches (e.g., t‑digest/KLL) in Spark/Flink and apply the same rule on billions of rows.</li>
          </ol>
          <p className="mt-3 text-xs text-gray-500">Tip: lowering the threshold flags more points; raising it keeps only the most extreme cases.</p>
        </section>

        <footer className="mt-8 text-center text-xs text-gray-500">
          Built for a quick demo. Swap in your real data & thresholds for production.
        </footer>
      </div>
    </div>
  );
}
