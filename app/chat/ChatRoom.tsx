import BidderList from './BidderList'
import CommentList from './CommentList'
import CoppedList from './CoppedList'
import WinnerSlot from './WinnerSlot'

export default function ChatRoom({ jontId }: { jontId: string }) {
  return (
    <>
      <WinnerSlot jontId={jontId} />
      <CoppedList jontId={jontId} />
      <BidderList jontId={jontId} />
      <CommentList jontId={jontId} />
    </>
  )
}
