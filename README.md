# Tudengibaar digital pass

The phone-first web app for **Tudengibaar: Börsibaar X Kosmos**. Guests open it on their own phones during the party for three activities:

| Activity | Route | What it is |
|---|---|---|
| Music bingo | `/bingo` | A 4×4 card of songs. Mark songs as they play; a row, a column, a diagonal, the four corners or a full card is bingo. |
| Outfit contest | `/contest` | Vote for your favourite costume by contestant number. Admins run the vote from `/admin`. |
| Planet chase | `/chase` | 8 planets, one after another. Find each planet's riddle at the venue and type in the answer to unlock the next. |

The home page (`/`) links to all three, each with an icon (placeholders in `react/src/components/home/icons.jsx`). While bingo's or the contest's time slot is running, its button gets a **Nüüd** chip. The chase button's *n/8 leitud* fills green from left to right like a progress bar as planets are found. A button turns dark green with a ✓ once that activity is done for you.

Estonian is the default language; English is one tap away (ET/EN in the corner).

## How it is built

```
react/    Frontend: React 19, Vite, Tailwind CSS 4, react-router 7
server/   Backend for the outfit contest: Node 22+, Hono, SQLite (better-sqlite3)
```

- **Bingo and the planet chase run entirely on the phone.** Progress is saved in the browser (`localStorage`), so they work even if the Wi-Fi drops. Planet answers are stored only as SHA-256 hashes, so they can't be read from the page source.
- **The outfit contest needs the server**, because votes have to be counted in one place. Each phone gets an anonymous `voter_id` cookie; one vote per phone, and it can be changed until voting is locked.

## Requirements

- **Node.js 22 or newer** (the server's SQLite driver needs it).
- npm.

## Running locally

**1. Install** (once):

```sh
cd react && npm install
cd ../server && npm install
```

**2. Set an admin password** for local testing. In `server/`:

```sh
npm run admin-password
```

It prints a random password and its SHA-256 hash. Copy `server/.env.example` to `server/.env` and paste the **hash**:

```
ADMIN_PASSWORD_SHA256=<the hash>
```

Keep the **password** for logging in. The server refuses to start without a valid hash.

**3. Start both** (two terminals):

```sh
cd server && npm run dev    # API on http://localhost:8787, restarts on file changes
cd react && npm run dev     # app on http://localhost:5173
```

Open http://localhost:5173. Vite forwards every `/api` request to the server, so there is nothing else to configure. Vite also prints a QR code and a network address for opening the app on a phone on the same Wi-Fi.

**Testing on a phone:** that network address is plain `http://`, and browsers only allow Web Crypto on HTTPS or `localhost`. Over it, planet answers can't be checked (the sheet says so). Test the chase on `localhost` (e.g. the browser's phone view) or over HTTPS. Production is HTTPS, so it works there.

The contest database is created at `server/tudengibaar.db`. To start over with an empty contest, stop the server and delete that file together with `tudengibaar.db-wal` and `tudengibaar.db-shm`. On Windows the delete fails while anything has the file open, including an IDE's database viewer (e.g. IntelliJ's Database panel): disconnect it first. A fresh file is also needed after a schema change such as the description limit, because the schema is only applied when the file is created.

## Tests and checks

```sh
cd react && npm test        # bingo lines, card data, planet chase rules, answer normalising, event times
cd react && npm run lint
cd server && npm test       # database, validation, contest and admin API, rate limits, cheat detection
```

## Configuration (server)

Set these in `server/.env` for local development, or as environment variables on the host.

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `ADMIN_PASSWORD_SHA256` | yes | – | SHA-256 hash of the admin password (from `npm run admin-password`) |
| `DB_PATH` | in production | `tudengibaar.db` | SQLite file. In production keep it **outside** the public web folder. |
| `PORT` | no | `8787` | Port when run directly (hosting panels usually set it themselves) |
| `BASE_PATH` | no | `/` | Subpath if the app is not at the domain root, e.g. `/tudengibaar/` |
| `NODE_ENV` | in production | – | `production` makes cookies HTTPS-only and requires `DB_PATH` |

`BASE_PATH` must also be set when building the frontend (`BASE_PATH=/tudengibaar/ npm run build` in `react/`), so links, routes and API calls use the same prefix.

## Running in production

1. Build the frontend: in `react/`, run `npm run build` (output in `react/build/`).
2. Copy the contents of `react/build/` into `server/public/`. When that folder exists, the server serves the app too, including deep links like `/bingo`.
3. In `server/`, run `npm install --omit=dev`, set the environment variables above (`NODE_ENV=production`, `ADMIN_PASSWORD_SHA256`, `DB_PATH`), and start with `npm start`.
4. Serve it over **HTTPS**. In production the admin login cookie only works over HTTPS.

Detailed hosting steps (cPanel / Passenger, backups) are still to be written.

## Admin page (`/admin`)

Not linked from the app; open the address directly and log in with the admin password (the eye button shows what you typed). A login lasts 12 hours. The page refreshes every 5 seconds. If the server can't be reached when the page opens, it says so with **Proovi uuesti** instead of showing the login form; only a real "not logged in" answer shows the login. It's laid out for a laptop (two columns from 1024 px) and works on a phone.

**Status bar** (stays at the top while you scroll). Shows the state, the total votes and when the numbers were last refreshed. If refreshing has failed for 15 s it turns red: *Pole uuendatud n s*, the reason, and **Proovi uuesti**. The state shows as a word plus an icon: **Suletud** (not open yet, grey ring), **Avatud** (open, pulsing dot) or **Lukus** (locked, padlock). The button does the one allowed next step:

| State | Button | Effect |
|---|---|---|
| Suletud | Ava hääletus | Opens voting. Phones see the vote form within about 10 seconds. |
| Avatud | Lukusta hääletus | Asks "Kindel? Vajuta uuesti" with a bar that empties over 4 s; tap again before it runs out. Voting stops; votes are final. |
| Lukus | Ava uuesti | Re-opens voting, in case it was locked by mistake. |

Below it are two tabs. The page starts on **Osalejad** while there are no contestants, otherwise on **Hääletus**. Switching tabs keeps what you typed.

**Hääletus tab.**
- *Tulemused*: read-only. Place, number, description with a bar, votes, and share of all votes (the share is hidden on a phone). Ties share a place (1, 1, 3). First place is tinted and marked **Juhib**; if several are tied for first, each is marked **Viik**.
- *Kahtlased hääled*: the server flags *bursts*: 10 or more votes for one contestant from one network, each within a minute of the last, which is what a voting script looks like. Each entry shows the vote count, how long the burst took, when it started, the network, and how many votes that network gave *other* contestants at the same time. While there are any, the tab shows a red count, so you see them from the other tab too.

  The party Wi-Fi puts everyone behind one network, so a real crowd can look similar. **Nothing is deleted automatically.** A burst where the others got votes too is probably real people; a one-sided burst is probably a script. To remove one, tap **Kustuta need N häält** and tap again before the bar runs out (4 s). Only the votes of that burst are deleted; other votes from the same Wi-Fi stay. This works after voting is locked too, which is the usual time to clean up.

**Osalejad tab.**
- The list of contestants by number, with their votes. Contestants with no votes have an **×**: it deletes at once, and **Võta tagasi** in the bar at the bottom brings them back (same number and description) for 6 s. Contestants with votes can't be deleted.
- *Lisa osaleja*: a number (1–99) and a short description (up to 67 characters). After adding, it confirms "Lisatud #7 – …" and puts the cursor back in the number box for the next one.
- *Lisa mitu korraga*: one contestant per line, `number, description`, e.g.

  ```
  7, punane tulnukas
  12, hõbedane robot
  ```

  Valid lines are added. Lines with problems (missing comma, bad number, duplicate) stay in the box with the reason shown, so you can fix them and send again.

**See seade** (this device), below the tabs, resets the guest progress *of the browser the admin page is open in*: the bingo card, the planet chase and this browser's contest vote. The language stays. It shows what's there (marked squares, planets found, vote), resets at once, and **Võta tagasi** puts everything back for 6 s, re-casting the vote. Removing or restoring a vote only works while voting is open; otherwise the vote is kept and the card says so. Bingo and the chase never reach the server, so there is no way to reset another phone from here: to help a guest, log in to `/admin` on their phone, reset, and log out again.

**Log out** is at the bottom.

### Contest night checklist

1. Before the party: add all contestants (Osalejad tab); leave voting **Suletud**.
2. When the contest starts: **Ava hääletus**.
3. When voting ends: **Lukusta hääletus** (two taps).
4. Check *Kahtlased hääled* and delete obvious script bursts.
5. Read the winner from *Tulemused* (marked **Juhib**, or **Viik** on a tie).

## Guest features in short

**Music bingo.** Each phone gets one of 5 cards at random. Tap a song to mark it (the square fills green, the name stays readable); tap again to undo. A row, a column, a diagonal or all four corners shows a bingo toast; wins completed by the same tap play together (one beam and saucer per line, "TOPELTBINGO!" / "BINGO ×3!"); a full card shows a full-screen celebration. A square that is the last one missing for a new bingo gets a pulsing dashed outline. *Alusta otsast* clears the card (two taps within 6 s), and *Võta tagasi* in the bar that appears brings it back for 6 s (both times are in `constants.js`). The home button counts as done after a full card, or once the bingo time has passed.

**Outfit contest.** Type a number or pick a contestant from the list (10 per page, the list filters as you type), then tap **Kinnita** in the bar at the bottom. After voting, *Muuda häält* lets you pick someone else; your old vote stays until you confirm the new one. While the contest is closed or locked, the page says so and shows your vote.

**Info boxes.** *Kuidas mängida?* (bingo, chase) and the ⓘ buttons (contest) open a short bulleted box under the button; the rest of the page dims. The ✕, a tap on the dimmed page, Esc or the phone's Back closes it.

**Planet chase.** Planets are numbered; only the next one (glowing) can be opened, locked ones show a lock. On opening, the page glides slowly down to the next planet (a touch, scroll or key stops it), and tapping a locked one scrolls there too. The answer sheet shows that planet's hint (where its riddle is). Letter case, extra spaces and accents don't matter: õ ä ö š ž count as o a o s z, and ü, y and u are the same letter. A correct answer turns the next stretch of the winding route from grey to green; all 8 shows a full-screen celebration. The phone's Back closes the answer sheet and the info boxes instead of leaving the page.

## Editing content

| What | Where |
|---|---|
| Bingo cards (5 cards × 16 songs) | `react/src/data/bingo-cards.json` |
| Event times (start and end of bingo and the contest) | `react/src/data/events.js` |
| Planet positions, images and answer hashes. Each planet must sit lower than the one before it, or the winding route loops back. | `react/src/data/planets.js` |
| All texts, Estonian and English (incl. the 8 planet hints, `planetHints`) | `react/src/i18n/et.js` and `en.js` (a test checks both have the same keys) |
| Look-and-feel knobs: starfield, toast and undo times, confirm windows, progress fill, route wobble, chase glide, contest page size. CSS animation lengths are in `react/src/index.css` (`@theme`); `ROUTE_DRAW_MS` must match `--animate-draw` there. | `react/src/constants.js` |
| Footer logos | `react/src/components/Footer.jsx` |
| Home button icons (placeholders until custom button art) | `react/src/components/home/icons.jsx` |

**Planet answers.** Store only the hash. In `react/`:

```sh
npm run hash -- "the answer"
```

Paste the printed `hash` into that planet's entry in `planets.js`. The hash is made from the forgiving form of the answer (see `react/src/lib/normalize.js`), so make it with this script, never by hand. **Before the event:** every planet currently accepts the test answer `win`, uses a placeholder image and a placeholder hint ("See on vihje 1."). Replace all three.

## Project layout

```
react/src/
  pages/          one file per route (Home, Bingo, Contest, Chase, Admin, NotFound)
  components/     shared by several pages (Layout, Header, Footer, Starfield, InfoTip, Celebration, …)
    home/ bingo/ chase/ contest/ admin/   used only by that page
  hooks/          state: useBingo, useChase, useContest, useLang, usePolling; useBackToClose (phone Back closes an overlay)
  lib/            api client, storage, hashing, bingo/chase rules
  data/           cards, planets, event times
  constants.js    look-and-feel knobs
react/test/       frontend tests (vitest), one file per module
server/src/
  index.js        reads env, opens the DB, starts the server
  app.js          routes, static files, error mapping
  routes/         contest.js (public voting), admin.js (login + admin API)
  db.js           SQLite schema access and transactions
  bursts.js       suspicious-vote detection
server/test/      server tests (vitest)
```

## License

MIT, see [LICENSE](LICENSE).
