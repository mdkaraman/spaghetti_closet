import { payNow } from '@/app/actions/pay'

export default function PayPage() {
  return (
    <div className="pay-page">
      <form action={payNow}>
        <button type="submit" className="pay-button">pay now</button>
      </form>
    </div>
  )
}
