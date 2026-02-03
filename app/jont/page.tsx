import { getJontOfTheDay } from '@/lib/jont'
import JontPageContent from './JontPageContent'

export default async function JontPage() {
  const jont = await getJontOfTheDay()
  return <JontPageContent jont={jont} />
}
