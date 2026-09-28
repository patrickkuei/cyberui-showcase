# Nexus AI monitoring dashboard (demo)

A live AI-platform monitoring dashboard (requests, latency percentiles, token usage, endpoints, alerts) built with [cyberui-2045](https://www.npmjs.com/package/cyberui-2045) and [Recharts](https://recharts.org/).

All data is simulated in the browser; there's no backend and no network calls. The nav tabs are real navigation between the four pages, but a few controls are mock and don't change or produce anything: the chart time-range buttons, the "Acknowledge" button in the "What needs attention" panel, and the "Export CSV" and "Download" buttons on the Reports page.

```bash
npm install && npm run dev   # start the dev server
npm run build                # type-check and build to dist/
npm test                     # run the test suite
```

Requires Node 20.19 or newer.
