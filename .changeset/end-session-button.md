---
"open-fit": minor
---

Add "End Session" button to active workout page

- Added a red "End Session" button at the bottom of the current session page
- Clicking the button sets the session's `endTime` to the current timestamp
- Automatically navigates back to the workout logs list after ending
- Uses the existing `sessions.update` mutation for consistency
