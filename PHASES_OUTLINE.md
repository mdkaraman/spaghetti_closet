# Phases Outline

## Phase 1: 1 jont a day

- [x] login page
- [x] wtf is this page
  - [x] has brief description of the site and a link to the login page (intro text + "click here to blow" → signup)
- [x] user sign up page
  - [x] has field for email address, user id, passcode, and confirm passcode; submit button ("send it")
- [ ] user info page
- [x] "jont of the day" page w/ link to buy
- [ ] dummy payments page
- [ ] leave email address page
  - [ ] italic text: "I never meant to hurt you I never meant to make you cry But tonight I'm cleanin' out my closet (Ha)"
  - [ ] "lmk when we back up" with a field to leave email address
- [ ] high level
  - [ ] user can login, see "jont of the day", buy it, see user info page
  - [ ] 1 jont per day (day = US East Coast time)
  - [ ] jonts for the week are loaded on the backend ahead of time (one week of jonts at a time)
  - [ ] trial this one week at a time; site goes live for a week then goes dark and has page to leave email to be notified when next week starts
  - [ ] authentication and database storage for users and jonts

## Phase 2: The Chat

- [ ] if item has not been bought, "jont of the day" page still links to payment page
- [ ] if item has already been bought, "jont of the day" links to similar page with chat at the bottom and shows who copped the jont; chat for people to hang out

## Phase 3: Bidding

- [ ] bid only: replaces buy-now (no buy-now option from Phase 1/2)
- [ ] "jont of the day" page links to a page with bidding field and a submit button
- [ ] once bid is entered, user lands in the chat with the other bidders

## Phase 4: Up/Down Vote comments

- [ ] comments in The Chat can be up/down voted

## Phase 5: Spaghetti Bucks

- [ ] when a comment is up/down voted, the user earns or loses spaghetti bucks (1:1 ratio for up/down votes)
- [ ] if there are multiple bidders with same bid, the user with the most spaghetti bucks wins
  - [ ] if spaghetti bucks are tied, the user who entered the bid first wins
- [ ] user info page shows spaghetti bucks balance

## Phase 6: Blessing Spaghetti Bucks

- [ ] Spaghetti Bucks can be blessed (aka gifted) to other users
- [ ] user info page shows spaghetti bucks balance and a list of users who have blessed you with spaghetti bucks

## Phase 7: Preferences and multiple jonts per day

- [ ] user can select what they are interested in
  - [ ] size
  - [ ] type of jont (e.g. shirt, pants, shoes, etc.)
- [ ] when a user selects preferences, they are shown jonts that match their preferences
- [ ] still one jont per day; backend filters jonts to match user preferences

## Phase 8: Users can sell jonts

- [ ] users can put their jonts up for sale
