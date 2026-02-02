export default function Signup() {
  return (
    <div className="signup-page">
      <form className="signup-form" action="/jont" method="get">
        <div className="form-row">
          <label htmlFor="userid">user id:</label>
          <input type="text" id="userid" name="userid" />
        </div>
        <div className="form-row">
          <label htmlFor="email">email:</label>
          <input type="email" id="email" name="email" />
        </div>
        <div className="form-row">
          <label htmlFor="passcode">passcode:</label>
          <input type="password" id="passcode" name="passcode" />
        </div>
        <div className="form-row">
          <label htmlFor="confirm">confirm:</label>
          <input type="password" id="confirm" name="confirm" />
        </div>
        <div className="signup-submit">
          <button type="submit">send it</button>
        </div>
      </form>
    </div>
  )
}
