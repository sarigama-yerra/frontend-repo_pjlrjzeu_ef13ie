import { useEffect, useMemo, useState } from "react";
import ComponentPicker from "./components/ComponentPicker.jsx";

function App() {
  // Try env first; if not set, fall back to common dev default (swap port 3000 -> 8000)
  const inferredBackend = (() => {
    const env = import.meta.env.VITE_BACKEND_URL;
    if (env && typeof env === "string" && env.trim().length > 0) return env.trim();
    try {
      const url = new URL(window.location.href);
      // If running on 3000, assume backend on 8000
      if (url.port === "3000") {
        url.port = "8000";
        return url.origin.replace(":3000", ":8000");
      }
      // Otherwise, attempt same origin
      return url.origin;
    } catch {
      return "";
    }
  })();

  const backendUrl = inferredBackend;

  const [selections, setSelections] = useState({}); // { type: component }
  const [evalResult, setEvalResult] = useState(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [catalogReady, setCatalogReady] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const totalPrice = useMemo(() => {
    return Object.values(selections).reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  }, [selections]);

  const checkCatalog = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/components`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (Array.isArray(data) && data.length === 0) {
        setCatalogReady(false);
      } else {
        setCatalogReady(true);
      }
    } catch (e) {
      // If backend isn't reachable or env not set, surface the seed button to guide the user
      setCatalogReady(false);
    }
  };

  useEffect(() => {
    checkCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  const onSelect = (type, item) => {
    setSelections((prev) => ({ ...prev, [type]: item }));
    setEvalResult(null);
  };

  const removeSelection = (type) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    setEvalResult(null);
  };

  const evaluate = async () => {
    setLoadingEval(true);
    try {
      const body = {
        selections: Object.fromEntries(
          Object.entries(selections).map(([t, c]) => [t, c._id])
        ),
      };
      const res = await fetch(`${backendUrl}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setEvalResult(data);
    } catch (e) {
      setEvalResult({ is_valid: false, issues: ["Could not contact backend."], estimated_power_w: 0, total_price: 0 });
    } finally {
      setLoadingEval(false);
    }
  };

  const seedCatalog = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${backendUrl}/api/seed`, { method: "POST" });
      if (!res.ok) throw new Error("seed failed");
      await checkCatalog();
    } catch (e) {
      // ignore; button remains visible so user can retry
    } finally {
      setSeeding(false);
    }
  };

  const typeOrder = ["CPU", "Motherboard", "RAM", "GPU", "Storage", "PSU", "Case", "Cooler"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-100">
      <div className="relative mx-auto max-w-7xl px-4 py-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">PC Builder Simulator</h1>
            <p className="text-blue-300/80 mt-1">Pick parts, check compatibility, and estimate power & cost.</p>
            {!import.meta.env.VITE_BACKEND_URL && (
              <p className="mt-2 text-xs text-amber-300/80">Tip: Backend URL inferred as {backendUrl}. You can set VITE_BACKEND_URL for explicit config.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!catalogReady && (
              <button
                onClick={seedCatalog}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg border border-emerald-400/30"
                disabled={seeding}
              >
                {seeding ? "Seeding..." : "Load Sample Parts"}
              </button>
            )}
            <button
              onClick={() => { setSelections({}); setEvalResult(null); }}
              className="bg-slate-800/60 hover:bg-slate-700/60 text-blue-100 px-4 py-2 rounded-lg border border-slate-700"
            >
              Reset
            </button>
            <button
              onClick={evaluate}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg border border-blue-400/30 disabled:opacity-50"
              disabled={Object.keys(selections).length === 0 || loadingEval}
            >
              {loadingEval ? "Evaluating..." : "Evaluate Build"}
            </button>
          </div>
        </header>

        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <ComponentPicker backendUrl={backendUrl} selections={Object.fromEntries(Object.entries(selections).map(([t,c]) => [t, !!c]))} onSelect={onSelect} />
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Your Selections</h2>
              {typeOrder.map((t) => (
                <div key={t} className="flex items-center justify-between py-2 border-t border-slate-700/50 first:border-t-0">
                  <div className="text-blue-300 w-40">{t}</div>
                  <div className="flex-1">
                    {selections[t] ? (
                      <div className="text-white">{selections[t].name}</div>
                    ) : (
                      <div className="text-blue-400/60">Not selected</div>
                    )}
                  </div>
                  <div className="w-40 text-right">
                    {selections[t] ? (
                      <span className="text-blue-100">${Number(selections[t].price).toFixed(2)}</span>
                    ) : null}
                  </div>
                  <div className="w-24 text-right">
                    {selections[t] ? (
                      <button className="text-red-300 hover:text-red-200" onClick={() => removeSelection(t)}>Remove</button>
                    ) : null}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700">
                <div className="text-white font-semibold">Total</div>
                <div className="text-white font-semibold">${totalPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-white mb-2">Compatibility</h2>
              {!evalResult ? (
                <p className="text-blue-200/80">Choose parts and click Evaluate to check compatibility and power needs.</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-sm ${evalResult.is_valid ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                      {evalResult.is_valid ? "No issues found" : "Issues detected"}
                    </div>
                  </div>
                  <div className="text-blue-100">
                    Estimated Power: <span className="font-semibold">{evalResult.estimated_power_w} W</span>
                  </div>
                  {Array.isArray(evalResult.issues) && evalResult.issues.length > 0 && (
                    <div>
                      <div className="text-blue-300/80 mb-1">Details</div>
                      <ul className="list-disc list-inside text-red-300/90 space-y-1">
                        {evalResult.issues.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </section>

        <footer className="mt-10 text-center text-sm text-blue-300/60">
          Tip: If parts list is empty, click "Load Sample Parts" to seed the catalog.
        </footer>
      </div>
    </div>
  );
}

export default App;
