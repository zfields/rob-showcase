R.O.B. Showcase
===============

Source for the Nintendo R.O.B Showcase project.

Local Development
-----------------

```none
$ docker run --interactive --net=host --rm --tty --volume $(pwd):/node-app/ node:alpine sh
# cd node-app/
# npm install

up to date, audited 101 packages in 1s

found 0 vulnerabilities
npm notice
npm notice New minor version of npm available! 7.4.3 -> 7.6.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v7.6.0
npm notice Run npm install -g npm@7.6.0 to update!
npm notice
# npm run dev

> rob-showcase@0.1.0 dev
> rollup -c -w

rollup v2.38.4
bundles src/main.js → public/build/bundle.js...

  Your application is ready~! 🚀

  - Local:      http://localhost:5000
  - Network:    Add `--host` to expose

────────────────── LOGS ──────────────────


```

Navigate to http://localhost:5000 in your web browser.

Program Notes
-------------

The entry-point is located in [./src/App.svelte](./src/App.svelte).
