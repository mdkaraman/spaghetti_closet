import { placeBid } from '@/app/actions/bid'
import styles from './bid.module.css'

type Props = {
  jontId: string
  error?: string | null
}

export default function BidForm({ jontId, error = null }: Props) {
  return (
    <form action={placeBid} className={styles.form}>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <input type="hidden" name="jont" value={jontId} />
      <div className="form-row">
        <label htmlFor="amount">dollars:</label>
        <input
          id="amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          className={styles.amount}
        />
      </div>
      <button type="submit" className="pay-button">
        bid
      </button>
    </form>
  )
}
