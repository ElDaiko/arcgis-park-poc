import type { PoiCategory } from '../domain/PoiCategory'
import { POI_CATEGORIES, POI_CATEGORY_META } from '../domain/PoiCategory'

interface CategoryFilterPanelProps {
  selected: readonly PoiCategory[]
  onChange: (categories: PoiCategory[]) => void
}

export function CategoryFilterPanel({
  selected,
  onChange,
}: CategoryFilterPanelProps) {
  const selectedSet = new Set(selected)
  const allSelected = selected.length === POI_CATEGORIES.length

  const toggle = (category: PoiCategory) => {
    if (selectedSet.has(category)) {
      onChange(selected.filter((item) => item !== category))
      return
    }

    onChange([...selected, category])
  }

  const selectAll = () => {
    onChange([...POI_CATEGORIES])
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <aside className="category-filter" aria-label="Filtro por categoría">
      <div className="category-filter__heading">
        <span className="category-filter__eyebrow">Explorar</span>
        <h2>Categorías</h2>
      </div>

      <ul className="category-filter__list">
        {POI_CATEGORIES.map((category) => {
          const meta = POI_CATEGORY_META[category]
          const checked = selectedSet.has(category)

          return (
            <li key={category}>
              <label className="category-filter__item">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(category)}
                />
                <span
                  className="category-filter__swatch"
                  style={{ background: meta.swatch }}
                  aria-hidden="true"
                />
                <span className="category-filter__label">{meta.label}</span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="category-filter__actions">
        <button
          type="button"
          className="category-filter__button"
          onClick={selectAll}
          disabled={allSelected}
        >
          Todas
        </button>
        <button
          type="button"
          className="category-filter__button category-filter__button--ghost"
          onClick={clearAll}
          disabled={selected.length === 0}
        >
          Ninguna
        </button>
      </div>
    </aside>
  )
}
