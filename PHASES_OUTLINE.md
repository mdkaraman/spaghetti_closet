# Rough Outline of Phases

## Phase 1: 1 jont a day

- login page
- wtf is this page
  - has brief description of the site and a link to the login page
- user sign up page
  - has field for email address, user id, passcode, and confirm passcode; submit button
- user info page
- "jont of the day" page w/ link to buy
- dummy payments page
- leave email address page
  - it just says "I never meant to hurt you I never meant to make you cry But tonight I'm cleanin' out my closet (Ha)" in italics and then "lmk when we back up" with a field to leave email address
- high level: 
  - user can login, see "jont of the day", buy it, see user info page
  - 1 jont per day (day = US East Coast time)
  - jonts for the week are loaded on the backend ahead of time (one week of jonts at a time)
  - trial this one week at a time; site goes live for a week then goes dark for a while and has page to leave email address to be notified when next week starts
  - requires adding support for authentication and database storage for users and jonts

# Phase 2: The Chat
- if item has not been bought, "jont of the day" page still links to payment page
- if item has already been bought, then "jont of the day" links to similar page with a chat at the bottom and it says who copped the jont and the chat is there for people to hang out

# Phase 3: Bidding
- bid only: replaces buy-now (no buy-now option from Phase 1/2)
- "jont of the day" page links to a page with bidding field and a submit button
- once bid is entered, user lands in the chat with the other bidders

# Phase 4: Up/Down Vote comments
- comments in The Chat can be up/down voted

# Phase 5: Spaghetti Bucks
- when a comment is up/down voted, the user earns or loses spaghetti bucks (start with 1:1 ratio for up/down votes)
- if there are multiple bidders with same bid, then the user with the most spaghetti bucks wins
  - if spaghetti bucks are tied, then the user who entered the bid first wins
- user info page shows spaghetti bucks balance

# Phase 6: Blessing Spaghetti Bucks
- Spaghetti Bucks can be blessed (aka gifted) to other users
- user info page shows spaghetti bucks balance and a list of users who have blessed you with spaghetti bucks

# Phase 7: Preferences and multiple jonts per day
- user can select what they are interested
  - size
  - type of jont (e.g. shirt, pants, shoes, etc.)
- when a user selects preferences, they are shown jonts that match their preferences
- they still only see one jont per day, but on the back end the jonts are filtered to only show the ones that match the user's preferences

# Phase 8: Users can sell jonts
- users can put their jonts up for sale
