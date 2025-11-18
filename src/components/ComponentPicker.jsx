import { useEffect, useState } from "react";

const typeOrder = ["CPU", "Motherboard", "RAM", "GPU", "Storage", "PSU", "Case", "Cooler"];

export default function ComponentPicker({ backendUrl, selections, onSelect }) {
  const [activeType, setActiveType] = useState(typeOrder[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${backendUrl}/api/components?type=${encodeURIComponent(activeType)}`)
      .then((r) => r.json())
      .then((d) => setItems(d))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeType, backendUrl]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-2">
        {typeOrder.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`w-full text-left px-4 py-2 rounded-lg border transition ${
              activeType === t ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800/60 text-blue-100 border-slate-700 hover:bg-slate-700/60"
            }`}
          >
            {t}
            {selections[t] ? (
              <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">selected</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="lg:col-span-3">
        {loading ? (
          <div className="text-blue-200">Loading {activeType}...</div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((it) => (
              <div key={it._id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/60">
                <div className="font-semibold text-white">{it.name}</div>
                <div className="text-xs text-blue-200/70 mt-1">{it.brand} • {it.type}</div>
                <div className="text-blue-100 mt-3">${it.price?.toFixed ? it.price.toFixed(2) : it.price}</div>
                <button
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2"
                  onClick={() => onSelect(activeType, it)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
