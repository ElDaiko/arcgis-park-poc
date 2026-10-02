import type { PoiCategory } from '../domain/PoiCategory'
import { POI_CATEGORIES, POI_CATEGORY_META } from '../domain/PoiCategory'
import styles from './CategoryFilterPanel.module.scss'

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
    <aside className={styles.panel} aria-label="Filtro por categoría">
      <div className={styles.heading}>
        <span className={styles.eyebrow}>Explorar</span>
        <h2 className={styles.title}>Categorías</h2>
      </div>

      <ul className={styles.list}>
        {POI_CATEGORIES.map((category) => {
          const meta = POI_CATEGORY_META[category]
          const checked = selectedSet.has(category)

          return (
            <li key={category}>
              <label className={styles.item}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(category)}
                />
                <span
                  className={styles.swatch}
                  style={{ background: meta.color }}
                  aria-hidden="true"
                />
                <span className={styles.label}>{meta.label}</span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={selectAll}
          disabled={allSelected}
        >
          Todas
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={clearAll}
          disabled={selected.length === 0}
        >
          Ninguna
        </button>
      </div>
    </aside>
  )
}
