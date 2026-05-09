# Iron Vesper

Iron Vesper is a self-contained browser game. It does not need a server, installer, account, or downloaded art/audio assets.

## Send It To Someone

Use the zip in `release/Iron-Vesper-Playable.zip`.

1. Send the zip.
2. Ask the player to unzip it.
3. Have them open `index.html` in Chrome, Edge, Firefox, or Safari.
4. Click `New Game`.

Progress, audio settings, and sidebar scale are saved in that browser with `localStorage`.

## Host It Online

Upload these files to any static web host:

- `index.html`
- `style.css`
- `game.js`
- `favicon.svg`
- `manifest.webmanifest`
- `cover.png`

Good targets are itch.io HTML game uploads, GitHub Pages, Netlify, Cloudflare Pages, or a simple web server. No build command is required.

## GitHub Pages Release Flow

Use `master` as the source of truth for ongoing work. The public website is released from the `gh-pages` branch.

When you are ready to publish the current `master` version:

1. Make sure the game works locally.
2. Commit the finished changes on `master`.
3. Push `master` to GitHub so the source is backed up.
4. Update `gh-pages` from `master`.
5. Push `gh-pages` to publish the live site.

## Controls

- Move: `A` / `D` or arrow keys
- Jump: `Space` or `Up`
- Attack: `J`
- Interact: `F`
- Inventory: `V`
- Pause: `P` or `Esc`
- Mute: `O`

More controls appear in the in-game sidebar as abilities unlock.
