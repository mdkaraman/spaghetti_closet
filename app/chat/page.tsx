import ChatRoom from './ChatRoom'

type Props = {
  searchParams: { jont?: string }
}

export default function ChatPage({ searchParams }: Props) {
  const jontId = searchParams?.jont ?? ''
  return (
    <div className="jont-page">
      <ChatRoom jontId={jontId} />
    </div>
  )
}
