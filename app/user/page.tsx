import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BlessingsSection from './BlessingsSection'
import BucksSection from './BucksSection'
import CoppedSection from './CoppedSection'
import PreferencesSection from './PreferencesSection'
import SellSection from './SellSection'

export default async function UserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, email')
    .eq('id', user.id)
    .single()

  return (
    <>
      <div className="user-page">
        <h2 className="user-heading">my ish</h2>
        <dl className="user-info">
          <dt>user id</dt>
          <dd>{profile?.user_id ?? '—'}</dd>
          <dt>email</dt>
          <dd>{profile?.email ?? user.email ?? '—'}</dd>
        </dl>
        {await CoppedSection({ userId: user.id })}
        {await BucksSection()}
        {await BlessingsSection()}
        {await PreferencesSection()}
        {await SellSection()}
        <p className="user-back">
          <Link href="/jont" className="jont-link">back to the jont</Link>
        </p>
      </div>
    </>
  )
}
