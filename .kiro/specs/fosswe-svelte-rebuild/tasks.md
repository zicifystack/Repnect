# Implementation Plan: FOSSwe SvelteKit Rebuild

## Overview

Full reimplementation of Repnect.dev replacing Next.js/React with SvelteKit (Svelte 5), shadcn-svelte, TypeScript (strict), Tailwind CSS, and pnpm. The platform is a Git-powered, database-free directory for Nigeria-focused open-source projects. Tasks are arranged in 8 phases that build on each other: project scaffolding → CI scripts → core library modules → SvelteKit route infrastructure → UI components → full pages → SEO/accessibility polish → integration tests.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3] },
    { "wave": 4, "tasks": [4, 7] },
    { "wave": 5, "tasks": [5, 6, 8] },
    { "wave": 6, "tasks": [9, 13, 17, 21, 23, 25, 26, 27] },
    { "wave": 7, "tasks": [10, 14, 18, 19, 22, 24, 28] },
    { "wave": 8, "tasks": [11, 12, 16, 20] },
    { "wave": 9, "tasks": [15, 29, 30, 32, 33, 34, 36, 37, 40, 43] },
    { "wave": 10, "tasks": [16, 31, 35, 38, 39, 41, 42] },
    { "wave": 11, "tasks": [44, 46, 47, 48, 50, 51, 52, 53, 55, 56] },
    { "wave": 12, "tasks": [45, 54] },
    { "wave": 13, "tasks": [49, 57] },
    { "wave": 14, "tasks": [58, 59, 60, 61, 62, 63] },
    { "wave": 15, "tasks": [64] },
    { "wave": 16, "tasks": [65] },
    { "wave": 17, "tasks": [66] },
    { "wave": 18, "tasks": [67] },
    { "wave": 19, "tasks": [68, 69] },
    { "wave": 20, "tasks": [70] }
  ]
}
```

## Tasks

### Phase 1: Project Scaffolding and Data Foundation

- [x] 1. Initialize SvelteKit project with TypeScript strict mode, Tailwind CSS, shadcn-svelte, and pnpm
  - Run `pnpm create svelte@latest` with TypeScript strict, Tailwind, ESLint, Prettier, Vitest
  - Install shadcn-svelte CLI and initialize it
  - Install core runtime dependencies: `zod`, `fuse.js`, `smol-toml`, `satori`, `@resvg/resvg-js`
  - Install dev dependencies: `fast-check`, `tsx`, `@testing-library/svelte`
  - Configure `tsconfig.json` with `"moduleResolution": "bundler"` and strict mode
  - Configure `vite.config.ts` with Vitest `jsdom` environment and `src/**/*.{test,spec}.{js,ts}` include pattern
  - Set up `.env.example` file with all variables from the design doc
  - Verify `pnpm dev` starts without errors
  - **Requirement**: 22.6, 22.7, 24.1

- [x] 2. Create data directory structure and seed data files
  - Create `data/projects/` directory with at least one sample `.toml` file for `repnect`
  - Create `data/categories.json` with initial category entries (id, label, description, icon)
  - Create `data/tags.toml` with initial tag allowlist
  - Create `data/licenses-osi.json` with OSI SPDX identifiers
  - Create `public/logos/` directory with a placeholder `.gitkeep`
  - **Requirement**: 1.1, 3.1

- [x] 3. Implement core schema and types in `src/lib/schema.ts` and `src/lib/types.ts`
  - Define `ProjectSchema` (Zod) with all required and optional fields per the design's data model
  - Export `Project` and `SearchIndexItem` types inferred from Zod schemas
  - Export `ProjectSubmissionSchema` and `ProjectSubmission` type
  - Define `Category`, `Contributor`, `InstallationInfo`, `RepoStats`, `CacheData`, `GitHubSession`, `AuthUser` interfaces in `src/lib/types.ts`
  - Export the `RESERVED_SLUGS` constant array
  - **Requirement**: 1.1, 1.2, 1.3, 1.5

- [x] 4. Write unit tests for schema validation
  - Test that all required fields are enforced
  - Test boundary values: `slug` length 2 and 60, `name` length 2 and 80, `short_desc` length 10 and 160
  - Test that reserved slugs are rejected
  - Test that optional fields accept `undefined` gracefully
  - Test that `logo` only accepts valid path patterns and rejects others
  - Test that `repo` only accepts valid HTTPS GitHub URLs
  - **Requirement**: 1.1, 1.2, 1.3, 1.5

- [x] 5. Write property-based test P1: Schema rejects invalid field values
  - File: `src/lib/__tests__/schema.property.test.ts`
  - Tag: `// Feature: fosswe-svelte-rebuild` and `// Tests: Property 1 — Schema validation rejects invalid field values`
  - Use `fast-check` with `fc.record` generating arbitrary values for each required field that violates its constraint
  - Assert `ProjectSchema.parse()` throws `ZodError` when any required field violates its constraint
  - **Validates: Requirements 1.1, 1.3**

- [x] 6. Write property-based test P2: Logo path pattern enforcement
  - File: `src/lib/__tests__/schema.property.test.ts`
  - Tag: `// Tests: Property 2 — Logo path pattern enforcement`
  - Use `fc.string()` as arbitrary logo values
  - Assert `ProjectSchema.safeParse()` accepts if and only if the value matches `/^\/logos\/[^/]+\.(svg|png|jpg|jpeg|webp)$/`
  - **Validates: Requirements 1.5**

- [x] 7. Implement `src/lib/projects.ts` — TOML loading and parsing utilities
  - Implement `parseProjectFile(content: string, filename: string): Project` — parses TOML, validates against schema, throws descriptive error on failure
  - Implement `loadAllProjects(): Project[]` — reads all `.toml` files from `data/projects/`, calls `parseProjectFile`, throws on schema failure
  - Implement `getProjectBySlug(slug: string): Project | null`
  - Detect and throw on filename–slug mismatch (filename without `.toml` must equal `slug` field)
  - **Requirement**: 1.3, 1.4

- [x] 8. Write property-based test P3: TOML round-trip preserves project data
  - File: `src/lib/__tests__/schema.property.test.ts`
  - Tag: `// Tests: Property 3 — TOML round-trip preserves project data`
  - Build a `validProjectArbitrary` using fast-check constrained to valid field values for all required fields
  - Serialise a generated `Project` to TOML string, re-parse it, assert deep equality with original
  - **Validates: Requirements 1.6**

### Phase 2: CI Scripts

- [x] 9. Implement `scripts/build-index.ts`
  - Import `loadAllProjects` from `../src/lib/projects.js`
  - Map each `Project` to a `SearchIndexItem` with exactly the 12 required fields
  - Sort: item with `slug === "repnect"` at index 0; remaining items sorted alphabetically by `name`
  - Write the resulting JSON array to `public/index.json`
  - Print a warning (not error) when output exceeds 300 KB
  - Exit with non-zero status on any fatal parse/write error
  - Add `"build:index": "tsx scripts/build-index.ts"` to `package.json`
  - **Requirement**: 2.1–2.6, 24.1, 24.3, 24.4

- [x] 10. Write unit tests for build-index logic
  - Export a pure `buildIndex(projects: Project[]): SearchIndexItem[]` function
  - Test it produces the correct `SearchIndexItem` fields from sample projects
  - Test sort order: `repnect` slug first, rest alphabetical by name
  - Test deterministic output: two calls on identical input produce identical output
  - **Requirement**: 2.2, 2.3, 2.6

- [x] 11. Write property-based test P4: SearchIndexItem contains exactly the required fields
  - File: `src/lib/__tests__/build-index.property.test.ts`
  - Tag: `// Tests: Property 4 — Search index contains exactly the required fields per item`
  - Use `fc.array(validProjectArbitrary)` as input to `buildIndex()`
  - Assert every element of the output contains exactly the 12 required fields and no others
  - **Validates: Requirements 2.2**

- [x] 12. Write property-based test P5: Build index sort order is deterministic and stable
  - File: `src/lib/__tests__/build-index.property.test.ts`
  - Tag: `// Tests: Property 5 — Build index sort order is deterministic and stable`
  - Use `fc.array(validProjectArbitrary)` with a `repnect`-slug item always injected
  - Assert index 0 is always the repnect item and remaining are alphabetically sorted by `name`
  - Assert two calls on the same input produce byte-identical output
  - **Validates: Requirements 2.3, 2.6**

- [x] 13. Implement `scripts/validate.ts`
  - Load all projects via `loadAllProjects()`
  - Check each project's `category` against `data/categories.json` allowlist
  - Check each project's `tags` against `data/tags.toml` allowlist
  - Check each project's `license` against `data/licenses-osi.json`
  - Enforce slug uniqueness; report duplicates
  - Check GitHub repo accessibility via GitHub API (uses `GITHUB_TOKEN`)
  - Check `repnect` topic presence on each repo
  - Warn if referenced logo file is absent from `public/logos/`
  - Warn if logo file exceeds 200 KB
  - Exit non-zero if any errors found; exit 0 if only warnings
  - Add `"validate": "tsx scripts/validate.ts"` to `package.json`
  - **Requirement**: 1.4, 3.1–3.10, 24.1, 24.3

- [x] 14. Write property-based test P6: Validate script correctly identifies allowlist violations
  - File: `src/lib/__tests__/validate.property.test.ts`
  - Tag: `// Tests: Property 6 — Validate script correctly identifies allowlist violations`
  - Extract `checkAllowlists(project, categories, tags, licenses)` as a pure function
  - Use `fc.array(fc.string())` for tag/category/license values outside the allowlists
  - Assert the function returns a non-empty error array for any violation
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 15. Implement `scripts/enrich.ts`
  - Exit non-zero with stderr message when `GITHUB_TOKEN` is absent
  - For each project, fetch from GitHub API: stars, forks, watchers, open issues, repo size, dates, wiki/pages/discussions flags, top 10 contributors (exclude bots), language byte breakdown, good-first-issues count
  - Determine `verified` = `repnect` topic present AND repnect badge in README
  - Write `stars`, `good_first_issues`, `verified` back into each TOML file, preserving all other fields
  - Write `public/cache/[slug].json` for each project with the full `CacheData` shape
  - Log warning per project and continue on network/404 errors
  - Pause ≥ 1000 ms between consecutive GitHub API calls
  - Add `"enrich": "tsx scripts/enrich.ts"` to `package.json`
  - **Requirement**: 4.1–4.6, 24.1, 24.3, 24.5

- [x] 16. Write property-based test P7: Enrich script preserves non-target TOML fields
  - File: `src/lib/__tests__/enrich.property.test.ts`
  - Tag: `// Tests: Property 7 — Enrich script preserves non-target TOML fields`
  - Use `fc.record` to generate arbitrary `Project` objects
  - Mock the TOML write logic; run the field-update step
  - Assert all fields other than `stars`, `good_first_issues`, `verified` are byte-identical after enrichment
  - **Validates: Requirements 4.2, 24.5**

### Phase 3: Core Library Modules

- [x] 17. Implement `src/lib/search.ts` — Fuse.js factory
  - Implement `createFuse(items: SearchIndexItem[]): Fuse<SearchIndexItem>` with threshold 0.3 and weighted keys: `name` (0.4), `short_desc` (0.3), `tags` (0.2), `category` (0.1)
  - **Requirement**: 6.1

- [x] 18. Write property-based test P8: Search results are always a subset of the full project list
  - File: `src/lib/__tests__/search.property.test.ts`
  - Tag: `// Tests: Property 8 — Search results are always a subset of the full project list`
  - Use `fc.array(searchItemArbitrary)` and `fc.string()` for query
  - Assert every result slug is present in the original items array
  - **Validates: Requirements 6.4, 6.8**

- [x] 19. Write property-based test P9: Empty query returns all projects
  - File: `src/lib/__tests__/search.property.test.ts`
  - Tag: `// Tests: Property 9 — Empty query returns all projects`
  - Use `fc.array(searchItemArbitrary)` with empty string or whitespace-only query
  - Assert the full items array is returned unchanged (no filtering applied)
  - **Validates: Requirements 6.2**

- [x] 20. Implement `src/lib/filters.ts` and write property-based tests P10 and P11
  - Export pure functions: `filterByCategory(items, category)` and `sortItems(items, order)`
  - File: `src/lib/__tests__/filters.property.test.ts`
  - P10 tag: `// Tests: Property 10 — Category filter invariant — all results match selected category`
    - Use `fc.array(searchItemArbitrary)` + `fc.string()` for category
    - Assert every result satisfies `item.category === selectedCategory`
  - P11 tag: `// Tests: Property 11 — Filter+sort results are always a subset of the full search index`
    - Use `fc.array(searchItemArbitrary)` + `fc.constantFrom('recent', 'stars', 'alpha')` for sort order
    - Assert the resulting set is a subset of the original `SearchIndexItem[]`
  - **Validates: Requirements 7.3, 7.6, 7.7**

- [x] 21. Implement `src/lib/similar.ts` — similarity scoring
  - Implement `findSimilarProjects(current: Project, all: Project[], limit: number): Project[]`
  - Score each project by: +1 per shared tag, +1 for same category
  - Exclude the current project's slug from results
  - Return top `limit` results sorted by score descending
  - **Requirement**: 10.1, 10.2

- [x] 22. Write property-based tests P12 and P13: Similar projects invariants
  - File: `src/lib/__tests__/similar.property.test.ts`
  - P12 tag: `// Tests: Property 12 — Similar projects never include the current project`
    - Assert `findSimilarProjects(P, all, 4)` never contains an item with `slug === P.slug`
  - P13 tag: `// Tests: Property 13 — Similar projects count never exceeds 4`
    - Use `fc.array(projectArbitrary, { maxLength: 1000 })` — assert length ≤ 4 regardless of list size
  - **Validates: Requirements 10.1–10.4**

- [x] 23. Implement `src/lib/theme.svelte.ts` — Svelte 5 theme state module
  - Module-level `$state` holding `'dark' | 'light'`
  - Export `getTheme()`, `setTheme(t)`, `toggleTheme()` per the design spec
  - `setTheme` updates `document.documentElement.classList` and `localStorage`
  - **Requirement**: 17.1, 17.3

- [x] 24. Write property-based test P16: Theme toggle round-trip
  - File: `src/lib/__tests__/theme.property.test.ts`
  - Tag: `// Tests: Property 16 — Theme toggle round-trip returns to original`
  - Use `fc.constantFrom('dark', 'light')` as initial theme value
  - Call `toggleTheme()` twice; assert theme equals initial value
  - **Validates: Requirements 17.5**

- [x] 25. Implement `src/lib/github.ts` — Octokit wrappers
  - Wrap `@octokit/rest` calls for: repo metadata, contributors list, language breakdown, topics, README content
  - Export typed helpers reused by both the enrich script and the submission form auto-fetch
  - Use `GITHUB_TOKEN` from environment when present
  - **Requirement**: 4.1, 12.2, 13.1

- [x] 26. Implement `src/lib/upvote.ts` — CounterAPI client
  - Export `getUpvoteCount(slug: string): Promise<number>`
  - Export `incrementUpvoteCount(slug: string): Promise<number>`
  - Export `decrementUpvoteCount(slug: string): Promise<number>`
  - Use CounterAPI HTTP endpoints as backend
  - **Requirement**: 14.1

- [x] 27. Implement `src/lib/og.ts` — satori OG image helpers
  - Export `renderOgImage(element: object, width: number, height: number): Promise<Buffer>`
  - Load Inter font server-side with a module-level cache (fetch once, reuse)
  - Use `satori` for SVG generation and `@resvg/resvg-js` `Resvg` for SVG → PNG
  - **Requirement**: 18.1, 18.2, 18.6

- [x] 28. Implement `src/lib/seo.ts` and write property-based test P17: Canonical URL pattern
  - Export `canonicalUrl(slug: string): string` returning `https://repnect.dev/projects/${slug}`
  - File: `src/lib/__tests__/seo.property.test.ts`
  - Tag: `// Tests: Property 17 — Canonical URL matches expected pattern for all project slugs`
  - Use `fc.stringMatching(/^[a-z0-9-]{2,60}$/).filter(s => !RESERVED_SLUGS.includes(s))` as slug arbitrary
  - Assert `canonicalUrl(slug) === 'https://repnect.dev/projects/' + slug`
  - **Validates: Requirements 19.6**

### Phase 4: SvelteKit Route Infrastructure

- [x] 29. Configure `src/app.html` with FOUC-prevention inline script
  - Add inline `<script>` in `<head>` that reads `localStorage.getItem('theme')`, falls back to `prefers-color-scheme`, and sets/removes `class="dark"` on `<html>` before first paint
  - Ensure `%sveltekit.head%` and `%sveltekit.body%` placeholders are correct
  - **Requirement**: 17.4

- [x] 30. Implement `src/routes/+layout.server.ts` — session data for all pages
  - Read and verify the `gh_session` cookie (HMAC-SHA256 signed with `SESSION_SECRET`)
  - Return `{ user: AuthUser | null }` — all pages receive user data via `$page.data`
  - Return `{ user: null }` on missing, expired, or invalid cookie without throwing
  - **Requirement**: 13.3, 13.4

- [x] 31. Implement `src/routes/+layout.svelte` — root layout
  - Import and render `<Header />` component
  - On mount via `$effect`, apply persisted theme using `setTheme()` from `theme.svelte.ts`
  - Inject global JSON-LD (Organisation + WebSite structured data) via `<svelte:head>`
  - Conditionally inject Vercel Analytics script when `PUBLIC_VERCEL_ANALYTICS === 'true'`
  - Conditionally inject Vercel Speed Insights when `PUBLIC_VERCEL_SPEED_INSIGHTS === 'true'`
  - Conditionally inject GA4 `<script>` tag when `PUBLIC_GA_MEASUREMENT_ID` is set
  - All analytics scripts loaded asynchronously (no `async` attribute omission)
  - **Requirement**: 5.7, 17.2, 20.1, 23.1–23.4

- [x] 32. Install required shadcn-svelte components via CLI
  - Run `pnpm dlx shadcn-svelte@latest add button card badge input select tabs dialog tooltip skeleton`
  - Verify all components exist in `src/lib/components/ui/`
  - **Requirement**: 21.5

- [x] 33. Implement `src/routes/+page.server.ts` — homepage load function
  - Read `public/index.json` with `readFileSync`; return `{ searchIndex: [] }` if file is absent
  - Read `data/categories.json` and map to `{ id: string; label: string }[]`
  - Return `{ searchIndex, categories }`
  - **Requirement**: 5.1, 5.3, 5.8

- [x] 34. Implement `src/routes/projects/[slug]/+page.server.ts` — project detail load
  - Call `getProjectBySlug(params.slug)`; throw `error(404, 'Project not found')` if null
  - Read `public/cache/[slug].json` if it exists; set `cache: null` on parse failure or absence
  - Call `findSimilarProjects(project, loadAllProjects(), 4)` from `$lib/similar`
  - Export `prerender = true` and `entries(): EntryGenerator` that maps all projects to `{ slug }`
  - Return `{ project, cache, similarProjects }`
  - **Requirement**: 9.1, 9.2, 9.4, 9.8, 10.1, 10.2

- [x] 35. Implement `src/routes/radar/+page.server.ts` — radar page load
  - Load all projects via `loadAllProjects()` and all cache files from `public/cache/`
  - Compute and return aggregated stats: total projects, total stars, states count, cities count, unique contributors, total forks, total commits, top-10 languages by byte count, per-state breakdown
  - Throw server error (no client-side fallback) if loading fails
  - **Requirement**: 15.1–15.4

- [x] 36. Implement `src/lib/radar.ts` and write property-based test P15
  - Export `groupByState(projects: Project[]): Record<string, Project[]>` as a pure function
  - File: `src/lib/__tests__/radar.property.test.ts`
  - Tag: `// Tests: Property 15 — Geographic state project counts sum to total`
  - Use `fc.array(projectArbitrary)` as input
  - Assert `sum of all group lengths === projects.length`
  - **Validates: Requirements 15.9**

- [x] 37. Implement `src/routes/api/upvote/+server.ts` — upvote proxy endpoint
  - `GET ?slug=`: return 400 if slug is empty or > 100 chars; proxy to `getUpvoteCount(slug)`; return `json({ slug, count })`
  - `POST { slug, action }`: validate slug (same 400 rules) and action (`"upvote"` | `"unvote"`); proxy to `incrementUpvoteCount` or `decrementUpvoteCount`; return `json({ slug, count, action })`
  - Return 500 with JSON error body on CounterAPI failure
  - **Requirement**: 14.1, 14.8

- [x] 38. Write property-based test P14: Upvote API slug validation returns 400
  - File: `src/lib/__tests__/upvote.property.test.ts`
  - Tag: `// Tests: Property 14 — Upvote API slug validation`
  - Extract `validateSlug(slug: string): boolean` as a pure function
  - Use `fc.oneof(fc.constant(''), fc.string({ minLength: 101 }))` as invalid slug values
  - Assert `validateSlug(slug) === false` for all generated values
  - **Validates: Requirements 14.8**

- [x] 39. Implement GitHub OAuth API routes
  - `src/routes/api/auth/login/+server.ts`: generate CSRF UUID, set `oauth_state` cookie (httpOnly, 10 min), redirect to GitHub authorize with `client_id`, `redirect_uri`, `scope=public_repo`, `state`
  - `src/routes/api/auth/callback/+server.ts`: verify CSRF state matches cookie; exchange code for token via GitHub API; fetch user (`/user`); set signed `gh_session` HttpOnly SameSite=Lax Secure cookie; redirect to referrer or `/`; on CSRF mismatch or token failure redirect to `/?error=auth_failed`
  - `src/routes/api/auth/logout/+server.ts`: clear `gh_session` and `oauth_state` cookies, redirect to `/`
  - **Requirement**: 13.1–13.5

- [x] 40. Implement `src/routes/sitemap.xml/+server.ts` — dynamic sitemap
  - Return XML with `Content-Type: application/xml`
  - Entries: homepage (priority 1.0, changefreq daily), `/radar` (0.9, daily), `/submit` (0.8, monthly), `/about` (0.7, monthly), one entry per project (0.8, weekly, `lastmod` = `added_at`)
  - **Requirement**: 19.1

- [x] 41. Implement `src/routes/api/og/+server.ts` — homepage OG image endpoint
  - Render a 1200×630 PNG via `renderOgImage()` containing: brand wordmark, tricolour accent bar (saffron/white/green), site headline, brief description
  - Return `Content-Type: image/png`
  - **Requirement**: 18.1, 18.3, 18.6

- [x] 42. Implement `src/routes/projects/[slug]/og/+server.ts` — per-project OG image endpoint
  - Look up project by `params.slug`; return `error(404)` if not found or slug format is invalid
  - Render 1200×630 PNG including: brand name, tricolour accent bar, project name (large bold), short description (2-line clamp), primary language badge, location city
  - Return `Content-Type: image/png`
  - **Requirement**: 18.2, 18.3, 18.4, 18.6, 27.1–27.4

- [x] 43. Create `static/robots.txt`
  - `User-agent: *` / `Allow: /`
  - `Disallow: /api/`
  - `Sitemap: https://repnect.dev/sitemap.xml`
  - **Requirement**: 19.2

### Phase 5: Svelte 5 UI Components

- [x] 44. Implement `src/lib/components/ThemeToggle.svelte`
  - Read current theme from `theme.svelte.ts`; call `toggleTheme()` on button click
  - Display Sun icon when theme is `'dark'`, Moon icon when theme is `'light'`
  - Include `aria-label="Toggle theme"` on the button
  - **Requirement**: 17.1, 17.3, 20.5, 21.3

- [x] 45. Implement `src/lib/components/Header.svelte`
  - `let mobileOpen = $state(false)`
  - `$effect` that tracks `page.url.pathname` from `$app/state` and sets `mobileOpen = false`
  - Sticky header with brand logo linking to `/`
  - Desktop nav links: `/radar`, `/about`, Feedback (GitHub issues link, hidden on mobile viewports), Submit CTA button (`/submit`)
  - Mobile: hamburger `<button aria-label="Open menu">` toggling a dropdown containing all nav links
  - When `$page.data.user` is set: show avatar, username, sign-out link; otherwise show sign-in button
  - Use `<ThemeToggle />` in the header
  - **Requirement**: 20.1–20.5, 13.4

- [x] 46. Implement `src/lib/components/SearchBar.svelte`
  - Accept `value: string` prop and `onchange: (q: string) => void` callback prop
  - Use shadcn-svelte `Input` primitive
  - Show clear button (×) when query is non-empty; clear button has `aria-label="Clear search"`
  - **Requirement**: 6.3, 6.7, 21.3

- [x] 47. Implement `src/lib/components/Filters.svelte`
  - Accept `categories: { id: string; label: string }[]`, `activeCategory: string`, `sortOrder: string`, and callback props `onCategoryChange`, `onSortChange`
  - Render a horizontally scrollable tab bar: "All" tab + one tab per category
  - Render a sort `Select` dropdown with options: "Recently Added", "Most Stars", "Alphabetical"
  - Use shadcn-svelte `Tabs` and `Select` primitives
  - **Requirement**: 7.1–7.5

- [x] 48. Implement `src/lib/components/ProjectCard.svelte`
  - Accept `project: SearchIndexItem` prop
  - Display: name, short description (CSS 2-line clamp), primary language badge, city, up to 3 tags with `+N` overflow indicator, GitHub stars badge (only if `stars > 0`), verified badge (only if `verified`), "Seeking Contributors" badge (only if `looking_for_contributors`)
  - Logo logic: custom logo → GitHub OG preview (`https://opengraph.githubassets.com/1/[owner]/[repo]`) → text-based fallback (name + language + GitHub icon)
  - Entire card is clickable and navigates to `/projects/[slug]`
  - Use shadcn-svelte `Card`, `Badge` primitives
  - **Requirement**: 8.1–8.7

- [x] 49. Implement `src/lib/components/ProjectGrid.svelte`
  - Accept `initialProjects: SearchIndexItem[]` and `categories: { id: string; label: string }[]` as props
  - `$state`: `query`, `activeCategory = 'all'`, `sortOrder: 'recent' | 'stars' | 'alpha' = 'recent'`, `debouncedQuery`
  - `$effect`: 300 ms debounce timer updating `debouncedQuery`; return cleanup `clearTimeout`
  - `$derived`: `fuse = createFuse(initialProjects)`, `searchResults`, `filteredProjects`, `sortedProjects`
  - Render `<SearchBar>`, `<Filters>`, result count `"X of Y projects"`, grid of `<ProjectCard>`, empty state when results are empty
  - Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - **Requirement**: 5.3, 6.1–6.7, 7.1–7.5, 8.1, 22.1–22.3

- [x] 50. Implement `src/lib/components/VerifiedBadge.svelte`
  - Accept `slug: string` and `verified: boolean` props
  - Render badge UI and Markdown snippet section only when `verified === true`
  - Show badge Markdown in a `<code>` monospace block with a "Copy Badge" button
  - Copy button uses `navigator.clipboard.writeText()`; fallback: auto-select the text element
  - Badge Markdown must link to `https://repnect.dev/projects/[slug]`
  - **Requirement**: 25.1–25.4

- [x] 51. Implement `src/lib/components/SocialShare.svelte`
  - Accept `project: { name: string; short_desc: string; slug: string }` prop
  - Buttons: Twitter/X, LinkedIn, Facebook, WhatsApp, native share, Copy Link
  - Each button pre-populates share text with `${name} — ${short_desc} ${url}`
  - Copy Link: uses `navigator.clipboard.writeText()`; show "✓ Copied!" for ≥ 2 s then revert
  - Native share: use `navigator.share()` when available; gracefully degrade when unavailable
  - **Requirement**: 26.1–26.5

- [x] 52. Implement `src/lib/components/ProjectUpvote.svelte`
  - Accept `slug: string` and `initialCount: number` props
  - `$state`: `count`, `hasVoted` (initialised from `localStorage.getItem('upvote-' + slug) === 'true'`), `loading`
  - On mount (`$effect`): fetch current count from `GET /api/upvote?slug=`
  - On click: optimistic update (mutate `count` and `hasVoted`), call `POST /api/upvote`; on error revert both to previous values
  - Persist `hasVoted` to `localStorage` on change
  - Show loading indicator while fetching; `aria-label="Upvote"` on button
  - **Requirement**: 14.2–14.7, 21.3

- [x] 53. Implement `src/lib/components/ContributorAvatars.svelte`
  - Accept `contributors: Contributor[]` prop
  - Render overlapping avatar stack; show max 7 avatars with a `+N` overflow badge for the rest
  - Each avatar is a link to `contributor.html_url`
  - **Requirement**: 9.3

- [x] 54. Implement `src/lib/components/SimilarProjects.svelte`
  - Accept `projects: Project[]` prop (up to 4 items)
  - Render a grid/row of `<ProjectCard>` components
  - Render nothing (or a placeholder) when the array is empty
  - **Requirement**: 10.1, 10.2

- [x] 55. Implement `src/lib/components/RadarChart.svelte`
  - Accept top-6-states data (name + project count) as prop
  - Render a pure SVG hexagonal radar chart
  - Include accessible `<title>` and `role="img"` on the `<svg>` element
  - **Requirement**: 15.5

- [x] 56. Implement `src/lib/components/BreadcrumbSchema.svelte`
  - Accept `crumbs: { name: string; url: string }[]` prop
  - Inject `BreadcrumbList` JSON-LD into `<svelte:head>` from the crumbs array
  - **Requirement**: 9.7

- [x] 57. Write component tests
  - `ProjectCard`: renders name, description, language badge, and navigates to correct `/projects/[slug]`
  - `ProjectUpvote`: displays loading state on initial fetch and reverts count + localStorage on API error
  - `ThemeToggle`: shows Sun icon when theme is dark, Moon icon when light
  - `SocialShare`: constructs correct share URLs for Twitter, LinkedIn, Facebook, WhatsApp
  - Use `@testing-library/svelte` with `jsdom`
  - **Requirement**: 22.1–22.3

### Phase 6: Full Page Implementations

- [x] 58. Implement `src/routes/+page.svelte` — homepage
  - Receive `{ searchIndex, categories }` from load function
  - Hero section: headline, subtitle, animated badge/CTA linking to `/submit`
  - Render `<ProjectGrid {searchIndex} {categories} />`
  - Empty state (when `searchIndex.length === 0`): display "Be the first to submit a project" prompt with link to `/submit`
  - Developer CTA section below grid
  - SEO content section: city discovery links, technology browse links, popular category links, descriptive paragraph
  - `<svelte:head>`: `<title>`, `<meta name="description">`, canonical URL, `og:image` referencing `/api/og`, Twitter meta tags, Organisation + WebSite JSON-LD
  - **Requirement**: 5.1–5.8, 19.3, 19.4

- [x] 59. Implement `src/routes/projects/[slug]/+page.svelte` — project detail page
  - Receive `{ project, cache, similarProjects }` from load
  - Render full detail layout per requirement 9.3: name, primary language, verified badge, short description, GitHub star CTA, quick links (GitHub + website), social share, upvote widget, repo stats, contributor avatars, documentation links, tags (each linking to `/?tag=[tag]`), language breakdown bar chart, contributor welcome message if `looking_for_contributors`
  - When `cache` is null: show reduced stats (stars, good_first_issues, license from TOML only)
  - Render `<VerifiedBadge>`, `<SocialShare>`, `<ProjectUpvote>`, `<ContributorAvatars>`, `<SimilarProjects>`, `<BreadcrumbSchema>`
  - `<svelte:head>`: `<title>`, `<meta name="description">`, canonical URL (using `canonicalUrl(slug)`), `og:image` referencing `/projects/[slug]/og`, Twitter meta tags, `SoftwareSourceCode` JSON-LD, `FAQPage` JSON-LD
  - **Requirement**: 9.1–9.8, 18.5, 19.4–19.6

- [x] 60. Implement `src/routes/radar/+page.svelte` — geographic radar page
  - Receive aggregated data from load
  - Four primary stat cards: total projects, total GitHub stars, number of states, number of cities
  - Four secondary stat cards: unique contributors, total forks, total commits, languages used
  - Language distribution section: top 10 languages with percentage bar for each
  - `<RadarChart />` component showing top 6 states
  - State-by-state breakdown sorted by project count descending: rank, name, project count, city count, % of total, city sub-breakdown with progress bars and project links (`/projects/[slug]`)
  - `<svelte:head>`: SEO metadata, BreadcrumbList JSON-LD (generated even for zero-project state)
  - **Requirement**: 15.1–15.8

- [x] 61. Implement `src/routes/submit/+page.svelte` — submission guide page
  - Four eligibility criteria: founded in Nigeria, Nigeria core contributors, Nigerian organisation, serves Nigerian community
  - Six-step submission workflow explanation
  - FAQ section with `FAQPage` JSON-LD in `<svelte:head>`
  - Links to GitHub repo and `/submit/form`
  - `<svelte:head>`: SEO metadata, BreadcrumbList JSON-LD
  - **Requirement**: 11.1–11.5

- [x] 62. Implement `src/routes/submit/form/+page.svelte` — 5-step guided submission form
  - `$state`: `currentStep: 1 | 2 | 3 | 4 | 5`, `formData: Partial<ProjectSubmission>`, `validationErrors: Record<string, string>`, `githubFetchStatus`, `prCreationStatus`
  - Step 1: GitHub repository URL input + "Fetch" button calling `src/lib/github.ts`; on success pre-populate `formData` with name, description, language, license, topics
  - Step 2: name, description, primary language, license (all pre-filled from Step 1 fetch, editable)
  - Step 3: category dropdown, tags multi-select; auto-suggest tags from GitHub topics
  - Step 4: `location_city`, `location_nigerian_state`, `nigeria_connection` enum, `nigeria_connection_details`
  - Step 5: TOML preview of generated file, optional logo upload (SVG/PNG/JPG/JPEG/WEBP ≤ 200 KB), duplicate detection against `searchIndex`, submit button
  - Validate each step with Zod before advancing; display inline field-level errors
  - On submit (authenticated): create fork branch, commit TOML (+ logo), open PR via GitHub API
  - On submit (unauthenticated or OAuth not configured): display manual git workflow instructions
  - **Requirement**: 12.1–12.9, 13.5, 13.6

- [x] 63. Implement `src/routes/about/+page.svelte` — about page
  - Content: platform mission, how the Git-based data layer works, eligibility for listing, how to contribute to the platform
  - `<svelte:head>`: SEO metadata, BreadcrumbList JSON-LD
  - **Requirement**: 16.1, 16.2

### Phase 7: SEO, Accessibility, and Polish

- [x] 64. Audit and complete SEO meta tags across all pages
  - Verify every page has: `<title>`, `<meta name="description">`, canonical URL `<link rel="canonical">`, `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:image`
  - Project pages: `og:image` = `/projects/[slug]/og`; homepage: `og:image` = `/api/og`
  - Fix any pages with missing or incorrect tags
  - **Requirement**: 9.5, 18.5, 19.3, 19.4

- [x] 65. Audit and complete JSON-LD structured data across all pages
  - Layout: Organisation + WebSite on every page
  - Project detail: SoftwareSourceCode + FAQPage
  - Submit page: FAQPage
  - Every page: BreadcrumbList (via `<BreadcrumbSchema />`)
  - Radar page: metadata with zero-project safe placeholder values
  - **Requirement**: 5.7, 9.6, 9.7, 11.4, 15.8

- [x] 66. Accessibility audit and fixes
  - Verify `aria-label` on all icon-only buttons: search clear, hamburger menu, theme toggle, upvote, each share button
  - Verify semantic HTML: `<header>`, `<main>`, `<nav>`, `<footer>`, `<article>`, `<section>` used correctly
  - Verify minimum 44×44 px touch targets for all interactive elements on mobile
  - Verify shadcn-svelte components are used for all buttons, inputs, dropdowns, dialogs
  - **Requirement**: 21.1–21.5

- [x] 67. Verify end-to-end build succeeds
  - Confirm `"build": "pnpm run build:index && vite build"` in `package.json`
  - Run `pnpm run build:index` and verify `public/index.json` is written
  - Run `pnpm build` and verify no TypeScript errors and all project pages are statically pre-rendered
  - Run `pnpm run validate` on seed data and verify exit code 0
  - Run `pnpm test` and verify all tests pass
  - **Requirement**: 2.1, 9.8, 22.6, 24.4

### Phase 8: Integration and Final Tests

- [x] 68. Write integration tests for API endpoints
  - Upvote GET with valid slug returns `{ slug, count }` (200)
  - Upvote GET/POST with empty slug or slug > 100 chars returns 400
  - OG image endpoint `/api/og` returns 200 with `Content-Type: image/png`
  - Per-project OG `/projects/[slug]/og` returns 200 PNG for known slug, 404 for unknown slug
  - Sitemap XML contains entries for `/`, `/radar`, `/submit`, `/about`, and all project slugs
  - OAuth callback with mismatched CSRF state redirects to `/?error=auth_failed`
  - **Requirement**: 13.3, 14.1, 18.4, 19.1

- [x] 69. Write integration test for build pipeline
  - Run `buildIndex()` over the seed `data/projects/` directory
  - Assert `public/index.json` is written and parses as valid `SearchIndexItem[]`
  - Assert the `repnect` entry is at index 0
  - Assert all items contain only the 12 required fields
  - **Requirement**: 2.1–2.3

- [x] 70. Final property-test coverage review and CI smoke test
  - Cross-reference all 17 design properties against test files; confirm each has a passing test
  - Run `pnpm test` with verbose output; confirm ≥ 100 iterations per PBT test
  - Run `pnpm build` one final time from a clean state to confirm the full pipeline is green
  - **Requirement**: All

## Notes

- All Svelte components must use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) exclusively — no legacy stores (`writable`, `readable`, `derived` from `svelte/store`).
- Property-based tests use `fast-check` (minimum 100 iterations per test). Each property test file must be tagged at the top with `// Feature: fosswe-svelte-rebuild` and `// Tests: Property N — [title]`.
- The `build` script must always run `build:index` before `vite build` so `public/index.json` is current before the SvelteKit build.
- All three CI scripts (`validate.ts`, `build-index.ts`, `enrich.ts`) are standalone `tsx`-runnable files that import from `src/lib/` via relative paths — they must not require a full SvelteKit build to execute.
- GitHub OAuth is entirely optional. When `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are absent, the app operates in unauthenticated mode: the PR creation button is hidden and the manual git workflow is shown instead.
- shadcn-svelte components are installed via CLI (`pnpm dlx shadcn-svelte@latest add ...`) and live in `src/lib/components/ui/`.
- Deployment target is Vercel via `@sveltejs/adapter-auto`.
