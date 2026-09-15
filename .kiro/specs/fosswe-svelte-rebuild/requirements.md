# Requirements Document

## Introduction

FOSSwe is a complete reimplementation of the Repnect.dev open-source directory platform, replacing the existing Next.js 16 / React 19 stack with SvelteKit (Svelte 5), shadcn-svelte, TypeScript, Tailwind CSS, and pnpm. The platform is a Git-powered, database-free directory for showcasing open-source projects (initially Nigeria-focused). All project data is stored as TOML files in the repository; a JSON search index is generated at build time. Features include full-text fuzzy search, category/tag filtering, geographic visualization, a guided project submission form with GitHub OAuth, project upvoting, dark/light mode, auto-generated social card images, SEO, and automated CI scripts for validation and metadata enrichment.

The rebuild must achieve strict 1:1 feature parity with the existing application. All new code must be idiomatic Svelte 5 (runes API: `$state`, `$derived`, `$effect`) rather than legacy Svelte stores where possible.

---

## Glossary

- **App**: The FOSSwe SvelteKit application as a whole.
- **Project**: A single open-source entry described by a TOML file in `data/projects/`, conforming to the Project Schema.
- **Project Schema**: The Zod schema defining all required and optional fields of a Project entry (slug, name, short_desc, repo, license, tags, category, location, etc.).
- **Search_Index**: The file `public/index.json`, a JSON array of `SearchIndexItem` objects built from all Project TOML files at build time.
- **SearchIndexItem**: A minimal subset of Project fields used for client-side fuzzy search and rendering project cards.
- **Slug**: A unique URL-safe identifier for a Project, matching `/^[a-z0-9-]+$/`, 2–60 characters, not in the reserved-slug list.
- **Category**: A single primary classification for a Project, drawn from the `data/categories.json` allowlist.
- **Tag**: A secondary attribute of a Project, drawn from the `data/tags.toml` allowlist; each Project has 1–10 tags.
- **Cache**: Per-project JSON files in `public/cache/[slug].json` containing enriched GitHub metadata (contributors, stats, languages, installation, documentation links).
- **Enrich_Script**: The TypeScript CI script `scripts/enrich.ts` that fetches live GitHub metadata and writes it into TOML files and Cache files.
- **Validate_Script**: The TypeScript CI script `scripts/validate.ts` that checks all Project TOML files against the schema, allowlists, and GitHub accessibility.
- **Build_Index_Script**: The TypeScript CI script `scripts/build-index.ts` that reads all Project TOML files and writes the Search_Index to `public/index.json`.
- **Fuse**: The Fuse.js library used for client-side fuzzy search over the Search_Index.
- **GitHub_OAuth**: The GitHub OAuth 2.0 flow used to authenticate users for starring repositories and creating pull requests via the submission form.
- **OG_Image**: An auto-generated 1200×630 PNG social card image rendered server-side for each Project detail page and the homepage.
- **Upvote_API**: The SvelteKit API endpoint (`/api/upvote`) that proxies read/write calls to CounterAPI for per-project upvote counts.
- **Radar_Page**: The `/radar` route displaying geographic analytics of the project directory, visualising distribution by Nigerian state and city.
- **Submit_Form**: The multi-step guided form at `/submit/form` that auto-fetches GitHub metadata and creates a pull request via GitHub OAuth.
- **Theme_Store**: The Svelte 5 `$state`-based mechanism for persisting and toggling the user's preferred colour scheme (dark/light).
- **shadcn_svelte**: The shadcn-svelte component library providing accessible, unstyled-by-default UI primitives (Button, Card, Input, Dialog, Badge, etc.).
- **Reserved_Slug**: Any slug in the list `["new", "admin", "api", "auth", "projects", "tags", "search", "submit", "about", "privacy", "terms"]` that may not be used as a Project slug.

---

## Requirements

### Requirement 1: Project Data Layer and Schema

**User Story:** As a directory maintainer, I want all project data stored as TOML files validated against a strict schema, so that data integrity is guaranteed without a database.

#### Acceptance Criteria

1. THE App SHALL define a Project Schema using Zod that enforces: `slug` (lowercase alphanumeric and hyphens, 2–60 chars, not a Reserved_Slug), `name` (2–80 chars), `short_desc` (10–160 chars), `repo` (valid HTTPS GitHub URL), `license` (OSI-approved SPDX identifier), `added_at` (YYYY-MM-DD format), `primary_lang` (non-empty string), `category` (non-empty string), `tags` (array of 1–10 strings), `looking_for_contributors` (boolean), `location_city` (2–100 chars), `location_nigerian_state` (2–100 chars).
2. THE App SHALL treat `website`, `logo`, `good_first_issues`, `stars`, `verified`, `nigeria_connection`, and `nigeria_connection_details` as optional fields in the Project Schema with specified types and constraints.
3. WHEN a TOML file is parsed, THE App SHALL validate the parsed object against the Project Schema and reject files that fail validation with a descriptive error message identifying the failing field and constraint.
4. THE App SHALL enforce slug uniqueness: IF two Project TOML files share the same slug value, THEN THE Validate_Script SHALL exit with a non-zero status code and report the duplicate.
5. THE App SHALL enforce that a logo path, when present, matches the pattern `/logos/[filename].[svg|png|jpg|jpeg|webp]`.
6. FOR ALL valid Project objects, parsing a TOML file into a Project then serialising back to TOML and re-parsing SHALL produce an equivalent Project object (round-trip property).

---

### Requirement 2: Build-Index Script

**User Story:** As a maintainer, I want a build script that compiles all Project TOML files into a single JSON search index, so that the frontend can perform fast client-side search without a database query.

#### Acceptance Criteria

1. WHEN `scripts/build-index.ts` is executed, THE Build_Index_Script SHALL read all `*.toml` files from `data/projects/`, parse and validate each, and write a JSON array to `public/index.json`.
2. THE Build_Index_Script SHALL produce a Search_Index containing exactly one `SearchIndexItem` per valid Project TOML file, with the fields: `slug`, `name`, `short_desc`, `category`, `tags`, `stars`, `primary_lang`, `verified`, `added_at`, `looking_for_contributors`, `location_city`, `location_nigerian_state`.
3. THE Build_Index_Script SHALL sort the Search_Index such that the project with slug `"repnect"` appears first, with remaining entries sorted alphabetically by `name`.
4. WHEN the generated `index.json` exceeds 300 KB, THE Build_Index_Script SHALL print a warning recommending sharding but SHALL NOT exit with an error.
5. IF `scripts/build-index.ts` encounters a fatal parsing error, THEN THE Build_Index_Script SHALL exit with a non-zero status code and print a descriptive error message.
6. FOR ALL runs over the same set of TOML files, THE Build_Index_Script SHALL produce identical output (deterministic property).

---

### Requirement 3: Validate Script

**User Story:** As a CI maintainer, I want an automated validation script that checks every project TOML file for schema compliance, allowlist compliance, and repository accessibility, so that invalid submissions are rejected before merging.

#### Acceptance Criteria

1. WHEN `scripts/validate.ts` is executed, THE Validate_Script SHALL check every TOML file in `data/projects/` against the Project Schema, the Category allowlist (`data/categories.json`), the Tag allowlist (`data/tags.toml`), and the OSI license list (`data/licenses-osi.json`); the requirement is satisfied as long as the checking process runs regardless of whether errors are found.
2. WHEN a project has tags not present in the Tag allowlist, THE Validate_Script SHALL report an error listing the invalid tags.
3. WHEN a project has a category not present in the Category allowlist, THE Validate_Script SHALL report an error identifying the invalid category.
4. WHEN a project has a license identifier not found in the OSI allowlist, THE Validate_Script SHALL report an error identifying the invalid license.
5. WHEN a project's `repo` URL is not publicly accessible via the GitHub API, THE Validate_Script SHALL report an error for that project.
6. WHEN a project's GitHub repository does not have the `repnect` topic (case-insensitive), THE Validate_Script SHALL report an error for that project.
7. WHEN a logo file is referenced but not present in `public/logos/`, THE Validate_Script SHALL report a warning.
8. WHEN a logo file is present but exceeds 200 KB in size, THE Validate_Script SHALL report a warning.
9. IF any errors (not warnings) are found, THEN THE Validate_Script SHALL exit with a non-zero status code after reporting all errors and warnings.
10. WHEN only warnings are found, THE Validate_Script SHALL exit with status code 0 after reporting the warnings.

---

### Requirement 4: Enrich Script

**User Story:** As a maintainer, I want a nightly CI script that fetches live GitHub metadata for each project, so that star counts, contributors, and language data stay current without manual updates.

#### Acceptance Criteria

1. WHEN `scripts/enrich.ts` is executed with a valid `GITHUB_TOKEN` environment variable, THE Enrich_Script SHALL fetch metadata for each Project from the GitHub API including: star count, fork count, watcher count, open issue count, repository size, creation date, last push date, wiki/pages/discussions flags, top contributors (up to 10, excluding bots), language byte breakdown, good-first-issue count, and verification status (repnect topic present AND repnect badge in README).
2. THE Enrich_Script SHALL write updated `stars`, `good_first_issues`, and `verified` values back into each project's TOML file.
3. THE Enrich_Script SHALL write a Cache JSON file to `public/cache/[slug].json` for each project containing: contributors array, installation detection result, documentation links, repository stats object, languages map, and an `updated_at` ISO timestamp.
4. IF `GITHUB_TOKEN` is not set, THEN THE Enrich_Script SHALL print a descriptive error message to stderr and exit with a non-zero status code; both the message and the non-zero exit are required.
5. WHEN a project's repository metadata cannot be fetched (network error or 404), THE Enrich_Script SHALL log a warning for that project, skip it, and continue processing remaining projects.
6. THE Enrich_Script SHALL pause for at least 1000 ms between consecutive GitHub API calls to respect rate limits.

---

### Requirement 5: Homepage

**User Story:** As a visitor, I want a compelling homepage that immediately shows the project directory with search and filtering, so that I can discover open-source projects quickly.

#### Acceptance Criteria

1. WHEN the homepage (`/`) is actively being loaded, THE App SHALL server-render the page with the full Search_Index preloaded from `public/index.json` and the category list from `data/categories.json`.
2. THE App SHALL display a hero section with a headline, subtitle, and a call-to-action badge linking to `/submit`.
3. THE App SHALL render the project grid component with all projects from the Search_Index as the initial state.
4. THE App SHALL display a footer with links to GitHub, About, and Radar pages, and attribution to wbfoss.
5. THE App SHALL render a Developer CTA section below the project grid encouraging project submission.
6. THE App SHALL render an SEO content section containing city discovery links, technology browse links, popular category links, and a descriptive paragraph.
7. THE App SHALL include JSON-LD Organisation and WebSite structured data schemas in the `<head>` of every page.
8. WHEN the Search_Index is empty, THE App SHALL display a special empty state prompt with a message such as "Be the first to submit a project" and a link to `/submit`, replacing the empty project grid.

---

### Requirement 6: Fuzzy Search

**User Story:** As a visitor, I want to search across project names, descriptions, and tags using fuzzy matching, so that I can find relevant projects even with imprecise queries.

#### Acceptance Criteria

1. THE App SHALL initialise a Fuse.js instance with the Search_Index, searching over the fields `name`, `short_desc`, `tags`, and `category` with a threshold of 0.3.
2. WHEN the search input is empty, THE App SHALL display all projects (subject to active category filter and sort).
3. WHEN the user types a query, THE App SHALL debounce the search by 300 ms before updating the results.
4. WHEN a non-empty query is submitted, THE App SHALL display only projects whose Fuse score matches the query, in descending relevance order.
5. THE App SHALL display a result count below the filter bar indicating the number of projects shown versus the total count.
6. WHEN no projects match the query and active filters, THE App SHALL display an empty state with a message and icon.
7. THE App SHALL provide a clear button in the search input that resets the query to empty when clicked.
8. FOR ALL non-empty queries, THE App SHALL produce a results set that is a subset of or equal to the unfiltered project set (metamorphic property).

---

### Requirement 7: Category Filtering and Sorting

**User Story:** As a visitor, I want to filter projects by category and sort them by different criteria, so that I can browse the directory in a way that suits my intent.

#### Acceptance Criteria

1. THE App SHALL render a scrollable horizontal tab bar showing "All" plus one tab per entry in `data/categories.json`.
2. WHEN the "All" tab is active, THE App SHALL display projects from all categories (subject to search and sort).
3. WHEN a category tab is clicked, THE App SHALL filter the project list to show only projects with `category` equal to the selected category ID.
4. THE App SHALL provide a sort dropdown with options: "Recently Added" (sort by `added_at` descending), "Most Stars" (sort by `stars` descending), "Alphabetical" (sort by `name` ascending).
5. WHEN a sort option is selected, THE App SHALL re-sort the currently filtered results without resetting the active category or search query.
6. FOR ALL filter and sort combinations, THE App SHALL display a result set that is a subset of the full Search_Index (invariant property).
7. FOR ALL category filter selections, EVERY project in the displayed results SHALL have `category` equal to the selected category (invariant property).

---

### Requirement 8: Project Cards

**User Story:** As a visitor, I want to see project cards in a responsive grid with key metadata at a glance, so that I can quickly evaluate projects without clicking through.

#### Acceptance Criteria

1. THE App SHALL render a responsive grid of Project Cards: one column on mobile, two columns on tablet, three columns on desktop.
2. EACH Project Card SHALL display: project name, short description (truncated to 2 lines), primary language badge, city location, up to 3 tags (with a `+N` overflow indicator), GitHub stars badge (if stars > 0), verified badge (if `verified` is true), and "Seeking Contributors" badge (if `looking_for_contributors` is true).
3. WHEN a Project Card has a custom logo that loads successfully, THE App SHALL display the custom logo in the card image area.
4. WHEN a Project Card has no custom logo or the custom logo fails to load AND the project has a GitHub repository, THE App SHALL display the GitHub OpenGraph preview image (`https://opengraph.githubassets.com/1/[owner]/[repo]`).
5. WHEN a Project Card has no logo and no detectable GitHub repo, THE App SHALL display a text-based fallback showing the project name, language indicator, and GitHub icon.
6. WHEN a Project Card is clicked, THE App SHALL navigate to `/projects/[slug]`.
7. THE App SHALL render Project Cards using shadcn_svelte Card primitives styled with Tailwind CSS.

---

### Requirement 9: Project Detail Page

**User Story:** As a visitor, I want a detailed project page with rich metadata, contributor info, and share actions, so that I can fully evaluate a project and share it with others.

#### Acceptance Criteria

1. WHEN `/projects/[slug]` is actively being loaded for a valid slug, THE App SHALL server-render the page with the full Project data loaded from its TOML file and the corresponding Cache file (if present).
2. WHEN `/projects/[slug]` is loaded for an unknown slug, THE App SHALL return a 404 response and render a not-found page.
3. THE App SHALL display: project name, primary language, verified badge, short description, GitHub star CTA (linking to repo), quick links (GitHub and website), social share buttons, upvote widget, repository stats (stars, forks, watchers, open issues, good-first-issues, last-pushed, license), contributor avatars (from Cache), documentation links (from Cache), tags (each linking to `/?tag=[tag]`), language breakdown bar chart (from Cache), contributor welcome message (if `looking_for_contributors`), similar projects (up to 4), and verified badge markdown snippet (if `verified`).
4. WHEN Cache data is not available, THE App SHALL display a reduced stats view showing only `stars`, `good_first_issues`, and `license` from TOML data.
5. THE App SHALL generate SEO-optimised `<title>`, `<meta description>`, canonical URL, OpenGraph tags, and Twitter card tags for each project page.
6. THE App SHALL include `SoftwareSourceCode` and `FAQPage` JSON-LD structured data in the `<head>` of each project detail page.
7. THE App SHALL include `BreadcrumbList` JSON-LD structured data on every page.
8. THE App SHALL statically pre-render all known project detail pages at build time using `entries()` in SvelteKit.

---

### Requirement 10: Similar Projects

**User Story:** As a visitor reading a project detail page, I want to see similar projects suggested below, so that I can discover related work without returning to the directory.

#### Acceptance Criteria

1. THE App SHALL compute similar projects by finding Projects that share at least one tag or the same category as the current project, preventing the current project from being placed in any similar project slot.
2. THE App SHALL display up to 4 similar projects below the main project detail content.
3. FOR ALL project detail pages, THE App SHALL ensure the current project does not appear in the similar projects list (invariant property).
4. FOR ALL project detail pages, THE App SHALL ensure at most 4 similar projects are shown (invariant property).

---

### Requirement 11: Submit Page

**User Story:** As an open-source developer, I want a clear submission guide page explaining how to add my project to the directory, so that I can contribute without confusion.

#### Acceptance Criteria

1. THE App SHALL serve a `/submit` page that explains the eligibility criteria, step-by-step submission workflow, and what happens after submission.
2. THE App SHALL display four eligibility criteria: founded in Nigeria, core contributors from Nigeria, maintained by Nigerian organisation, serves Nigerian community.
3. THE App SHALL display a six-step process: fork repository, create TOML file, add logo (optional), validate locally, create pull request, get verified (optional).
4. THE App SHALL include a FAQ section with `FAQPage` JSON-LD structured data covering: how to submit, eligibility, verified badge process, review timeline.
5. THE App SHALL link to the GitHub repository and the `/submit/form` guided form.

---

### Requirement 12: Guided Submission Form

**User Story:** As a developer, I want a guided 5-step form that auto-fills GitHub metadata and creates a pull request, so that I can submit my project without manually writing TOML or using git.

#### Acceptance Criteria

1. THE App SHALL serve a guided submission form at `/submit/form` composed of 5 sequential steps: (1) GitHub repository URL input with auto-fetch, (2) project details (name, description, language, license), (3) categorisation (category, tags), (4) location and Nigeria connection, (5) review and submit.
2. WHEN a valid GitHub repository URL is entered in step 1, THE App SHALL auto-fetch repository metadata (name, description, primary language, topics, license) from the GitHub API and pre-populate form fields in subsequent steps.
3. WHEN the user completes all steps and submits, THE App SHALL authenticate with GitHub OAuth, create a branch in the user's fork (or the main repo), commit the generated TOML file (and logo if uploaded), and open a pull request.
4. THE App SHALL validate each step's fields using the Project Schema (via Zod) and display inline validation errors before allowing progression to the next step.
5. THE App SHALL detect if a project with the same slug or GitHub URL already exists in `public/index.json` and display a duplicate warning.
6. THE App SHALL display a TOML preview of the entry that will be created before final submission.
7. WHEN logo upload is provided, THE App SHALL accept SVG, PNG, JPG, JPEG, and WEBP files up to 200 KB.
8. THE App SHALL suggest tags automatically based on the GitHub repository's topics.
9. WHEN GitHub OAuth is not configured (env vars absent), THE App SHALL disable the one-click PR flow and direct users to the manual git workflow instead.

---

### Requirement 13: GitHub OAuth Authentication

**User Story:** As a user, I want to log in with my GitHub account, so that I can create pull requests and star repositories from within the application.

#### Acceptance Criteria

1. THE App SHALL implement a GitHub OAuth 2.0 flow using the environment variables `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
2. WHEN a user initiates GitHub OAuth, THE App SHALL redirect to GitHub's authorisation endpoint with the minimum required scopes (`public_repo` for PR creation).
3. WHEN GitHub redirects back with a valid authorisation code, THE App SHALL exchange it for an access token and store the session securely (server-side session or signed cookie); session creation SHALL only occur after successfully receiving and validating the authorisation code.
4. WHEN a user is authenticated and all session data (avatar, username, sign-out action) loads successfully, THE App SHALL display the user's GitHub avatar and username in the header and provide a sign-out action; IF any of these elements fail to load, THE App SHALL treat the user as unauthenticated and hide all authenticated-only UI.
5. WHEN a user is not authenticated, THE App SHALL not show authenticated-only UI elements such as the PR creation button.
6. IF `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` is not set, THEN THE App SHALL operate in unauthenticated mode: the GitHub star button SHALL link directly to the repository, and the form SHALL show the manual workflow instead of auto-PR.

---

### Requirement 14: Project Upvote System

**User Story:** As a visitor, I want to upvote projects I find valuable, so that popular projects gain more visibility.

#### Acceptance Criteria

1. THE App SHALL expose a SvelteKit API endpoint at `/api/upvote` that accepts `GET ?slug=[slug]` to retrieve the current upvote count and `POST { slug, action }` (action: `"upvote"` or `"unvote"`) to increment or decrement the count via CounterAPI.
2. WHEN the upvote widget is loaded on a project detail page, THE App SHALL fetch the current upvote count from `/api/upvote?slug=[slug]` and display it.
3. THE App SHALL persist the user's voted state in `localStorage` using the key `upvote-[slug]`.
4. WHEN the user clicks the upvote button and has not previously voted, THE App SHALL optimistically update the displayed count, call `POST /api/upvote` with action `"upvote"`, and set the localStorage flag; users who have already voted may click the button again and the resulting action SHALL be processed by the API.
5. WHEN the user clicks the upvote button and has already voted, THE App SHALL call `POST /api/upvote` with action `"unvote"` and remove the localStorage flag; the API SHALL also accept `"upvote"` actions from already-voted users.
6. WHEN the API call fails, THE App SHALL restore the previous count and voted state without crashing.
7. WHEN the upvote count is loading, THE App SHALL display a loading indicator in place of the count.
8. THE App SHALL validate the `slug` parameter in the API: IF the slug is empty or exceeds 100 characters, THEN THE App SHALL return HTTP 400 with an error message.

---

### Requirement 15: Geographic Radar Page

**User Story:** As a visitor, I want to explore the geographic distribution of projects across Nigeria, so that I can understand regional contributions to the open-source ecosystem.

#### Acceptance Criteria

1. WHEN `/radar` is actively being loaded, THE App SHALL server-render the page with all Project data and all Cache data aggregated; IF server-rendering fails, THE App SHALL return an error page rather than falling back to client-side rendering.
2. THE App SHALL display four primary stat cards: total projects, total GitHub stars, number of states represented, number of unique cities represented.
3. THE App SHALL display four secondary stat cards (from Cache data): unique contributors, total forks, total commits, number of languages used.
4. THE App SHALL display a language distribution section listing the top 10 languages by aggregate byte count, with a percentage bar for each.
5. THE App SHALL display a hexagonal radar chart (using a canvas or SVG visualisation) showing the top 6 states by project count.
6. THE App SHALL display a detailed state-by-state breakdown sorted by project count descending, showing for each state: rank, name, project count, city count, percentage of total, and a city-level breakdown with progress bars and project links.
7. WITHIN each city section, THE App SHALL list all projects from that city as clickable links navigating to `/projects/[slug]`.
8. THE App SHALL generate SEO-optimised metadata and JSON-LD BreadcrumbList for the Radar page; WHEN there are zero projects, THE App SHALL generate the metadata with empty or placeholder values for numeric statistics rather than omitting it.
9. FOR ALL Radar page loads, THE sum of project counts across all states SHALL equal the total project count (invariant property).

---

### Requirement 16: About Page

**User Story:** As a visitor, I want to read about the FOSSwe platform and its mission, so that I can understand the project's purpose and how to contribute.

#### Acceptance Criteria

1. THE App SHALL serve an `/about` page explaining the platform's mission, how the Git-based data layer works, eligibility for listing, and how to contribute to the platform itself.
2. THE App SHALL include SEO metadata and `BreadcrumbList` JSON-LD structured data on the About page.

---

### Requirement 17: Dark Mode / Light Mode Toggle

**User Story:** As a visitor, I want to switch between dark and light themes, so that I can use the directory comfortably in any lighting environment.

#### Acceptance Criteria

1. THE App SHALL implement theme switching using a Svelte 5 `$state`-based Theme_Store that persists the chosen theme to `localStorage`.
2. WHEN the page is first loaded, THE App SHALL read the persisted theme from `localStorage`, falling back to the system `prefers-color-scheme` media query.
3. WHEN the theme toggle button is explicitly clicked by the user, THE App SHALL switch between `"dark"` and `"light"` themes, update the `class` attribute on the `<html>` element, and persist the new value to `localStorage`; partial updates are permitted if one action fails while others succeed.
4. THE App SHALL prevent flash-of-unstyled-content by applying the theme class on the `<html>` element before the page paints (inline script in `<head>`).
5. WHEN the theme toggle is clicked twice in succession, THE App SHALL return to the original theme (round-trip property).

---

### Requirement 18: OpenGraph and Social Card Images

**User Story:** As a marketer sharing projects on social media, I want auto-generated visual cards for every project page, so that shared links display rich previews.

#### Acceptance Criteria

1. THE App SHALL generate a 1200×630 PNG OG image for the homepage via a SvelteKit endpoint at `/api/og` using server-side image generation (e.g., `@vercel/og` or `satori`).
2. THE App SHALL generate a per-project 1200×630 PNG OG image for each project detail page via an endpoint at `/projects/[slug]/opengraph-image` (or equivalent SvelteKit image endpoint convention).
3. EACH generated OG image SHALL include: the Repnect brand name and logo, a tricolour accent bar (Nigeria flag-inspired: saffron / white / green), the project name (homepage OG) or site title (homepage OG), and a brief description.
4. WHEN a slug is provided for which no Project exists, THE App SHALL return a 404 response from the image endpoint.
5. THE App SHALL reference the correct OG image URL in the `og:image` meta tag and Twitter `twitter:image` meta tag of each page.
6. THE OG image endpoint SHALL return images with `Content-Type: image/png`.

---

### Requirement 19: SEO Infrastructure

**User Story:** As a maintainer, I want comprehensive SEO infrastructure including sitemaps, robots.txt, and structured data, so that the directory is fully indexed by search engines.

#### Acceptance Criteria

1. THE App SHALL generate a dynamic `sitemap.xml` via a SvelteKit endpoint that includes: the homepage (priority 1.0, daily), `/radar` (priority 0.9, daily), `/submit` (priority 0.8, monthly), `/about` (priority 0.7, monthly), and one entry per Project (priority 0.8, weekly, `lastmod` = project `added_at`).
2. THE App SHALL serve a `robots.txt` that allows all crawlers on all paths except `/api/*` and includes the sitemap URL.
3. THE App SHALL include `<meta name="canonical">` tags on every page pointing to the canonical URL.
4. THE App SHALL include `<meta name="description">` and `<title>` tags optimised for SEO on every page.
5. FOR ALL project detail pages, THE App SHALL include a JSON-LD `SoftwareSourceCode` schema and a `FAQPage` schema in the page `<head>`.
6. FOR ALL project detail pages, THE canonical URL SHALL match the pattern `https://repnect.dev/projects/[slug]` (invariant property).

---

### Requirement 20: Navigation and Header

**User Story:** As a visitor, I want a persistent, accessible header with site navigation, so that I can move between pages from any location in the app.

#### Acceptance Criteria

1. THE App SHALL render a sticky header at the top of every page containing: the Repnect brand logo (linking to `/`), desktop navigation links to `/radar` and `/about`, a "Feedback" link opening the GitHub issues page (hidden on mobile), a "Submit" CTA button linking to `/submit`, and a mobile hamburger menu.
2. WHEN the viewport is below the `md` breakpoint, THE App SHALL hide the desktop navigation links and show the hamburger menu button; individual navigation links may be selectively hidden on desktop viewports as appropriate.
3. WHEN the hamburger menu button is clicked, THE App SHALL toggle a mobile dropdown menu containing all navigation links.
4. THE App SHALL implement the Header as a Svelte 5 component using `$state` for the mobile menu open/close state.
5. WHEN the theme toggle is present in the header, THE App SHALL display a Sun icon when the current theme is dark mode and a Moon icon when the current theme is light mode (icon represents current theme state, not the action).

---

### Requirement 21: Responsive Design and Accessibility

**User Story:** As a visitor on any device, I want a fully responsive and accessible experience, so that the directory works well on mobile, tablet, and desktop.

#### Acceptance Criteria

1. THE App SHALL render all pages responsively using Tailwind CSS breakpoints: `sm` (640px), `md` (768px), `lg` (1024px).
2. THE App SHALL ensure all interactive elements have a minimum touch target size of 44×44 px on mobile viewports.
3. THE App SHALL include `aria-label` attributes on all icon-only buttons (search, clear, menu toggle, theme toggle, upvote).
4. THE App SHALL use semantic HTML elements (`<header>`, `<main>`, `<nav>`, `<footer>`, `<article>`, `<section>`) throughout the page structure.
5. THE App SHALL use shadcn_svelte components for all interactive UI elements (buttons, inputs, dropdowns, dialogs) to ensure consistent accessible behaviour.

---

### Requirement 22: Svelte 5 Runes and SvelteKit Conventions

**User Story:** As a developer maintaining the codebase, I want all UI logic written in idiomatic Svelte 5 runes, so that the code is readable, type-safe, and leverages the latest framework capabilities.

#### Acceptance Criteria

1. THE App SHALL use `$state` rune for all local mutable component state in place of `let` declarations that would require reactive stores in Svelte 4.
2. THE App SHALL use `$derived` rune for all values that are computed from `$state` (e.g., filtered project list, active filter count, sort order application).
3. THE App SHALL use `$effect` rune for all side effects that depend on `$state` or `$derived` values (e.g., debounced search, localStorage persistence, DOM class updates).
4. THE App SHALL use SvelteKit `load` functions in `+page.server.ts` files for all server-side data fetching (TOML loading, index loading, cache loading).
5. THE App SHALL use SvelteKit form actions in `+page.server.ts` for all mutation operations where appropriate (e.g., upvote if server-rendered).
6. THE App SHALL use TypeScript with strict mode enabled throughout all source files.
7. THE App SHALL be structured following SvelteKit file-based routing conventions: `src/routes/` for pages, `src/lib/` for shared utilities and components, `src/lib/components/ui/` for shadcn_svelte components.

---

### Requirement 23: Analytics and Performance Monitoring

**User Story:** As a maintainer, I want analytics and performance tracking integrated, so that I can monitor traffic and identify performance issues.

#### Acceptance Criteria

1. WHERE the `PUBLIC_VERCEL_ANALYTICS` environment variable is set to `"true"`, THE App SHALL inject Vercel Analytics tracking into every page; IF the injection process fails, THE App SHALL surface a warning rather than silently ignoring the failure.
2. WHERE the `PUBLIC_VERCEL_SPEED_INSIGHTS` environment variable is set to `"true"`, THE App SHALL inject Vercel Speed Insights into every page; IF the injection process fails, THE App SHALL surface a warning.
3. WHERE a `PUBLIC_GA_MEASUREMENT_ID` environment variable is set, THE App SHALL inject a Google Analytics 4 script tag into every page `<head>`; IF the injection fails, THE App SHALL surface a warning.
4. THE App SHALL not block page rendering or hydration waiting for analytics scripts to load (analytics SHALL be loaded asynchronously).

---

### Requirement 24: CI Scripts Infrastructure

**User Story:** As a maintainer, I want all three CI scripts (validate, build-index, enrich) to remain as standalone TypeScript scripts compatible with `tsx`, so that they can be run locally and in GitHub Actions without requiring a full SvelteKit build.

#### Acceptance Criteria

1. THE App SHALL maintain `scripts/validate.ts`, `scripts/build-index.ts`, and `scripts/enrich.ts` as standalone TypeScript scripts executable with `tsx`.
2. THE scripts SHALL import shared library code from `src/lib/` (or a `lib/` directory) using relative imports compatible with `tsx`.
3. THE `package.json` SHALL define the scripts: `"validate": "tsx scripts/validate.ts"`, `"build:index": "tsx scripts/build-index.ts"`, `"enrich": "tsx scripts/enrich.ts"`.
4. THE build script in `package.json` SHALL run `build:index` before `vite build` to ensure the Search_Index is current before the SvelteKit build.
5. WHEN `scripts/enrich.ts` updates a TOML file's numeric fields (`stars`, `good_first_issues`) and boolean field (`verified`), THE Enrich_Script SHALL preserve all other existing TOML fields unchanged, including when no target fields are actually modified.

---

### Requirement 25: Project Verification Badge

**User Story:** As a project owner whose project is verified, I want a copyable badge snippet on my project detail page, so that I can display the verification badge in my README.

#### Acceptance Criteria

1. WHEN a project has `verified = true`, THE App SHALL display a "Verified Badge" section on the project detail page with the badge Markdown snippet.
2. THE App SHALL display the badge Markdown in a monospace code block with a one-click "Copy Badge" button; the code block and copy button SHALL only appear when the verified badge section itself is displayed.
3. WHEN the copy button is clicked, THE App SHALL copy the badge Markdown to the clipboard using the Clipboard API; IF the Clipboard API fails due to browser restrictions or permissions, THE App SHALL provide a fallback by auto-selecting the text for manual copying or displaying a tooltip with the markdown.
4. THE badge Markdown SHALL link back to `https://repnect.dev/projects/[slug]` and reference the repnect.dev shield URL.

---

### Requirement 26: Social Sharing

**User Story:** As a visitor who wants to spread the word, I want share buttons on every project page, so that I can post a project link to social media with a single click.

#### Acceptance Criteria

1. THE App SHALL display social share buttons on every project detail page for: X (Twitter), LinkedIn, Facebook, WhatsApp, and a native share button (using `navigator.share` when available).
2. EACH share action SHALL pre-populate the share text with the project name, short description, and project URL.
3. THE App SHALL provide a "Copy Link" button that copies the project URL (with description text) to the clipboard.
4. WHEN the copy action succeeds, THE App SHALL display a "✓ Copied!" confirmation for at least 2 seconds before reverting the button text.
5. WHEN `navigator.share` is not available in the browser, THE App SHALL use the Instagram share button to trigger the native share sheet on supported devices, or gracefully degrade.

---

### Requirement 27: Per-Project OG Image Endpoint

**User Story:** As a visitor sharing a project, I want the project's social card image to include the project name and branding, so that shared links are visually distinct and recognisable.

#### Acceptance Criteria

1. THE App SHALL expose a SvelteKit endpoint that generates a per-project OG image at `/projects/[slug]/og` (or as a `+server.ts` next to the page route).
2. EACH per-project OG image SHALL include: Repnect brand name, tricolour accent bar, project name (large, bold), project short description, primary language badge, and location city.
3. WHEN an invalid slug format is provided OR a valid slug format is provided for a project that does not exist, THE App SHALL return HTTP 404 from the per-project OG image endpoint.
4. THE generated image SHALL have dimensions of exactly 1200×630 pixels and `Content-Type: image/png`.