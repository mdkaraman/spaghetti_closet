'use client'

import { PREFERENCE_SIZES, PREFERENCE_TYPES } from '@/app/actions/preference-choices'
import { savePreferences } from '@/app/actions/preferences'
import { useSearchParams } from 'next/navigation'
import './preferences.css'

export default function PreferencesForm({
  size,
  jontType,
}: {
  size: string
  jontType: string
}) {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null

  return (
    <form className="preferences-form" action={savePreferences}>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="form-row">
        <label htmlFor="size">size:</label>
        <select id="size" name="size" defaultValue={size}>
          <option value="">none</option>
          {PREFERENCE_SIZES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label htmlFor="jont_type">type:</label>
        <select id="jont_type" name="jont_type" defaultValue={jontType}>
          <option value="">none</option>
          {PREFERENCE_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">save</button>
    </form>
  )
}
