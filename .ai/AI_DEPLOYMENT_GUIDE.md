# AI Deployment Guide

**This project needs no deploy pipeline.** It is a static prototype: `prototype/index.html` +
`prototype/app.js`, opened directly in a browser (file://) or dropped on any static host
(GitHub Pages, Netlify, cPanel public_html — just upload the two files).

- No build step, no dependencies, no server requirements.
- Nothing sensitive ships in the files (sample data only).
- Previous bridge-based (Tantua Deploy Bridge) instructions were removed — this
  project has no backend and no hosting contract. Re-add a deploy section only if
  the user asks for a specific host.
