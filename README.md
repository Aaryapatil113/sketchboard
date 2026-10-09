# Sketch Celebrate Hub

Build a web app called "SketchBoard" for a university design class where students
post weekly design sketches and vote for the best ones.

USERS & AUTH
- Sign up / log in with email (Supabase Auth). Only allow @northeastern.edu emails.
- Two roles: "student" and "admin" (the instructor/TA).

WEEKS
- Admin creates a "Week" with: week number, title, prompt/theme, submission
  deadline, and voting deadline.
- Home page shows the current week at the top, with past weeks listed below as
  an archive.

SUBMISSIONS
- Students upload one sketch per week (image upload to Supabase Storage,
  PNG/JPG, max 5MB) with a title and a short description (max 300 chars).
- Students can edit or replace their sketch until the submission deadline.

LIKES & RANKING
- Each student can like any number of sketches, but only once per sketch,
  and cannot like their own sketch.
- Clicking like again removes the like.
- Sketches within a week are sorted by like count (highest first). Ties go to
  whichever was submitted earlier.
- The top sketch gets a "Top Design" badge, and the top 3 get gold/silver/bronze
  markers.
- After the voting deadline, likes are locked and the week's winner is shown
  permanently in the archive.

UI
- Clean, minimal gallery layout: responsive grid of sketch cards (image,
  title, author name, like count, like button).
- Clicking a card opens a larger view with the description.
- A "Hall of Fame" page showing each week's winning design.
- Accessible: alt text field on upload, keyboard-navigable cards, visible
  focus states, WCAG AA color contrast.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sketch-celebrate-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3a8bde70-98f5-4fe4-9b25-73f0ae8df822).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
