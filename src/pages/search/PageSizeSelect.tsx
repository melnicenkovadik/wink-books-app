import { PAGE_SIZES, type PageSize } from './useSearchUrlState'

type Props = {
  value: PageSize
  onChange: (value: PageSize) => void
}

export function PageSizeSelect({ value, onChange }: Props) {
  return (
    <div>
      <label htmlFor="page-size" className="form-label fw-semibold">
        Per page
      </label>
      <select
        id="page-size"
        className="form-select form-select-lg"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as PageSize)}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  )
}
