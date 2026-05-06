# Karaoke Request

A simple app to manage karaoke song requests. Designed to be deployed to Cloudflare. No auth on the admin side, would need Cloudflare access to protect it.

---

## Developing

1. Download the entire catelog: https://www.karafun.com/karaoke-song-list.html
2. Run `awk -F';' '$NF ~ /English/' karafuncatalog.csv > karafun-english.csv`
3. Run `node convert-songs.js karafun-english.csv`

Once you've installed dependencies with `pnpm install`, start the development server:

```sh
pnpm run dev
```

## Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.
