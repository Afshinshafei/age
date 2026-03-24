# age

Small Astro page that messes with life expectancy tables: you pick age, region, sex, a few rough lifestyle sliders, and it spits out remaining time in whatever units (years down to seconds). It is a toy, not a prognosis.

Stack is mostly Astro + React for the interactive bit, Tailwind, and the usual shadcn-style components. Motion on the hero because why not.

**Running it**

```
npm install
npm run dev
```

With the current `base` config the dev server expects paths under `/age/`; Astro will tell you the exact URL.

**If you actually deploy this**

`astro.config.mjs` still has a placeholder username in `site` unless you have set `SITE_URL` at build time. Fix that. If the repo is not called `age`, update `base` so it matches the GitHub Pages path (`/<repo>/`).

For a build that behaves like Pages: `npm run build`, then serve the output from a parent folder with the `dist` contents in a subfolder named like your repo, or use `npm run preview` and read Astro’s docs for `base` if things look wrong.

There is a workflow in `.github/workflows/deploy.yml` for GitHub Actions; turn on Pages with “GitHub Actions” as the source.

**Fine print**

Numbers are from population-style tables plus hand-wavy adjustments. Not medical advice, not for insurance, not serious.
