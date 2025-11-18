import { useEffect, useMemo, useState } from "react";

const typeOrder = ["CPU", "Motherboard", "RAM", "GPU", "Storage", "PSU", "Case", "Cooler"];

function SpecRow({ label, value, unit }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between text-xs text-blue-200/80">
      <span className="text-blue-300/90">{label}</span>
      <span className="ml-2 text-blue-100">{String(value)}{unit ? ` ${unit}` : ""}</span>
    </div>
  );
}

function useSpecsForItem(item, type) {
  return useMemo(() => {
    if (!item) return [];
    switch (type) {
      case "CPU":
        return [
          { label: "Socket", value: item.socket },
          { label: "TDP", value: item.tdp, unit: "W" },
        ];
      case "Motherboard":
        return [
          { label: "Socket", value: item.socket },
          { label: "RAM", value: item.ram_type },
          { label: "Max RAM Speed", value: item.ram_speed, unit: "MT/s" },
          { label: "Form Factor", value: item.form_factor },
        ];
      case "RAM":
        return [
          { label: "Type", value: item.ram_type },
          { label: "Speed", value: item.ram_speed, unit: "MT/s" },
        ];
      case "GPU":
        return [
          { label: "TDP", value: item.tdp, unit: "W" },
          { label: "Length", value: item.gpu_length_mm, unit: "mm" },
        ];
      case "Storage":
        return [
          { label: "Interface(s)", value: Array.isArray(item.storage_interfaces) ? item.storage_interfaces.join(", ") : item.storage_interfaces },
        ];
      case "PSU":
        return [
          { label: "Wattage", value: item.psu_wattage, unit: "W" },
          { label: "Type", value: item.psu_type },
        ];
      case "Case":
        return [
          { label: "Form Factor", value: item.form_factor },
          { label: "Max GPU", value: item.case_gpu_max_length_mm, unit: "mm" },
          { label: "Max Cooler", value: item.case_cooler_max_height_mm, unit: "mm" },
        ];
      case "Cooler":
        return [
          { label: "Height", value: item.cooler_height_mm, unit: "mm" },
          { label: "TDP Rating", value: item.cooler_tdp_rating, unit: "W" },
        ];
      default:
        return [];
    }
  }, [item, type]);
}

export default function ComponentPicker({ backendUrl, selections, onSelect }) {
  const [activeType, setActiveType] = useState(typeOrder[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${backendUrl}/api/components?type=${encodeURIComponent(activeType)}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setItems(d) : setItems([]))
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
            {items.map((it) => {
              const specs = useSpecsForItem(it, activeType);
              return (
                <div key={it._id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/60 flex flex-col">
                  <div className="font-semibold text-white leading-tight">{it.name}</div>
                  <div className="text-xs text-blue-200/70 mt-1">{it.brand} • {it.type}</div>

                  <div className="mt-3 space-y-1">
                    {specs.map((s, idx) => (
                      <SpecRow key={idx} label={s.label} value={s.value} unit={s.unit} />
                    ))}
                  </div>

                  <div className="mt-3 text-blue-100">${it.price?.toFixed ? it.price.toFixed(2) : it.price}</div>
                  <button
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2"
                    onClick={() => onSelect(activeType, it)}
                  >
                    Select
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
