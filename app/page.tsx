export default function Home() {
  return (
    <>
      <h1>
        <img src="/title.png" alt="Spaghetti closet." className="title-image" />
      </h1>

      <div className="login-container">
        <form className="login-form" action="/jont" method="get">
          <div className="form-row">
            <label htmlFor="userid">user id:</label>
            <input type="text" id="userid" name="userid" />
          </div>
          <div className="form-row">
            <label htmlFor="passcode">passcode:</label>
            <input type="password" id="passcode" name="passcode" />
          </div>
          <div className="enter-link">
            <button type="submit">enter</button>
          </div>
        </form>
      </div>

      <div className="footer-link">
        <a href="/wtf-is-this">wtf is this??</a>
      </div>
    </>
  )
}
