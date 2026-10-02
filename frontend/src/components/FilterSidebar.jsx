const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "GOOD", label: "Good" },
  { value: "POOR", label: "Poor" },
];

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-100 py-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function FilterSidebar({
  categories,
  filters,
  onChange,
  onReset,
}) {
  const activeCategory = categories.find((c) => c.name === filters.category);

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-gray-200 px-4">
        <Section title="Category">
          <ul className="space-y-1 text-sm">
            <li>
              <button
                onClick={() =>
                  onChange({
                    category: "",
                    subcategory: "",
                    gender: "",
                    size: "",
                  })
                }
                className={`w-full rounded-lg px-2 py-1.5 text-left ${
                  !filters.category ? "bg-black text-white" : "hover:bg-gray-50"
                }`}
              >
                All categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.name}>
                <button
                  onClick={() =>
                    onChange({
                      category: cat.name,
                      subcategory: "",
                      gender: "",
                      size: "",
                    })
                  }
                  className={`w-full rounded-lg px-2 py-1.5 text-left font-medium ${
                    filters.category === cat.name
                      ? "bg-black text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>

                {filters.category === cat.name &&
                  cat.subcategories?.length > 0 && (
                    <ul className="ml-3 mt-1 space-y-0.5 border-l border-gray-200 pl-2">
                      {cat.subcategories.map((sub) => (
                        <li key={sub}>
                          <button
                            onClick={() =>
                              onChange({
                                subcategory:
                                  filters.subcategory === sub ? "" : sub,
                              })
                            }
                            className={`w-full rounded px-2 py-1 text-left text-xs ${
                              filters.subcategory === sub
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {sub}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </li>
            ))}
          </ul>
        </Section>

        {activeCategory?.genders?.length > 0 && (
          <Section title="Department">
            <div className="flex flex-wrap gap-2">
              {activeCategory.genders.map((g) => (
                <button
                  key={g}
                  onClick={() =>
                    onChange({ gender: filters.gender === g ? "" : g })
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    filters.gender === g
                      ? "border-black bg-black text-white"
                      : "border-gray-300 text-gray-600 hover:border-black"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Section>
        )}

        {activeCategory?.sizes?.length > 0 && (
          <Section title="Size">
            <div className="flex flex-wrap gap-2">
              {activeCategory.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    onChange({ size: filters.size === s ? "" : s })
                  }
                  className={`min-w-9 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    filters.size === s
                      ? "border-black bg-black text-white"
                      : "border-gray-300 text-gray-600 hover:border-black"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Condition">
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                onClick={() =>
                  onChange({
                    condition: filters.condition === c.value ? "" : c.value,
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  filters.condition === c.value
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-gray-600 hover:border-black"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Price">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-black focus:outline-none"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-black focus:outline-none"
            />
          </div>
        </Section>

        <div className="py-4">
          <button
            onClick={onReset}
            className="w-full rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:border-black hover:text-black"
          >
            Clear filters
          </button>
        </div>
      </div>
    </aside>
  );
}
