# Design Document: FOSSwe SvelteKit Rebuild

## Overview

FOSSwe is a full reimplementation of the Repnect.dev open-source directory platform, replacing the Next.js 16 / React 19 stack with SvelteKit (Svelte 5), shadcn-svelte, TypeScript (strict mode), and Tailwind CSS. The platform is a Git-powered, database-free directory for Nigeria-focused open-source projects. All project data lives as TOML files in the repository; a JSON search index is generated at build time and served statically. The runtime does zero database queries for the directory itself.

The rebuild achieves strict 1:1 feature parity with the existing application. All UI logic uses idiomatic Svelte 5 runes (`$state`, `$derived`, `$effect`) exclusively — no legacy stores.

### Key Design Decisions

- **No database for project data**: TOML → `public/index.json` at build time; SvelteKit `load` functions read the static JSON on every request.
- **Shared lib, not duplicated**: `src/lib/` is the single source of truth for schema, project loading, and utilities, imported by both SvelteKit routes and `tsx`-run CI scripts via relative paths.
- **SvelteKit adapter-auto**: Targets Vercel deployment; `@sveltejs/adapter-auto` infers the correct adapter at build time.
- **shadcn-svelte for UI primitives**: All interactive elements (Button, Card, Input, Badge, Dialog, Select, Tabs) come from shadcn-svelte to ensure accessibility and Tailwind composability.
- **GitHub OAuth via SvelteKit API routes**: Custom OAuth flow in `+server.ts` endpoints; no NextAuth dependency.

---

## Architecture

### Data Flow

```
data/projects/*.toml
        │
        ▼  (scripts/build-index.ts, runs via tsx before vite build)
public/index.json   ◄── SearchIndexItem[]
        │
        ▼  (SvelteKit +page.server.ts load function, SSR)
PageData (searchIndex, categories)
        │
        ▼  (hydrated to Svelte 5 $state in +page.svelte)
Client-side: Fuse.js fuzzy search + $derived filtered/sorted list
        │
        ▼
ProjectCard components rendered in responsive grid
```

```
data/projects/[slug].toml  +  public/cache/[slug].json
        │
        ▼  (SvelteKit +page.server.ts for /projects/[slug])
Project + CacheData + similarProjects (SSR)
        │
        ▼
ProjectDetail.svelte (full detail page, static pre-render via entries())
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Build Pipeline                           │
│                                                                 │
│  data/projects/*.toml ──► scripts/build-index.ts ──►           │
│                                    public/index.json            │
│  scripts/enrich.ts (nightly CI) ──► data/projects/*.toml       │
│                                     public/cache/[slug].json    │
│  scripts/validate.ts (PR CI) ──► exit code / error report      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SvelteKit Application                      │
│                                                                 │
│  src/routes/                                                    │
│  ├── +layout.svelte          (Header, theme, analytics)         │
│  ├── +page.server.ts         (load: searchIndex, categories)    │
│  ├── +page.svelte            (Homepage: Fuse search, grid)      │
│  ├── projects/[slug]/                                           │
│  │   ├── +page.server.ts     (load: Project, Cache, similar)    │
│  │   ├── +page.svelte        (ProjectDetail)                    │
│  │   └── og/+server.ts       (satori OG image endpoint)         │
│  ├── api/                                                       │
│  │   ├── upvote/+server.ts   (CounterAPI proxy)                 │
│  │   ├── og/+server.ts       (homepage OG image)                │
│  │   └── auth/               (GitHub OAuth flow)                │
│  ├── submit/                                                    │
│  │   ├── +page.svelte        (Submission guide)                 │
│  │   └── form/+page.svelte   (5-step guided form)               │
│  ├── radar/+page.server.ts   (all projects + cache aggregation) │
│  ├── about/+page.svelte      (about page)                       │
│  └── sitemap.xml/+server.ts  (dynamic sitemap)                  │
│                                                                 │
│  src/lib/                                                       │
│  ├── schema.ts               (Zod schemas + TypeScript types)   │
│  ├── projects.ts             (TOML loading, parseProjectFile)   │
│  ├── similar.ts              (similarity scoring)               │
│  ├── github.ts               (Octokit wrappers)                 │
│  ├── upvote.ts               (CounterAPI client)                │
│  ├── theme.svelte.ts         (Svelte 5 theme state)             │
│  ├── search.ts               (Fuse.js factory)                  │
│  ├── og.ts                   (satori OG image helpers)          │
│  └── components/             (Svelte 5 components)              │
│      ├── ui/                 (shadcn-svelte primitives)         │
│      ├── Header.svelte                                          │
│      ├── ProjectCard.svelte                                     │
│      ├── ProjectGrid.svelte                                     │
│      ├── ProjectDetail.svelte                                   │
│      ├── SearchBar.svelte                                       │
│      ├── Filters.svelte                                         │
│      ├── SimilarProjects.svelte                                 │
│      ├── SocialShare.svelte                                     │
│      ├── ProjectUpvote.svelte                                   │
│      ├── RadarChart.svelte                                      │
│      ├── ContributorAvatars.svelte                              │
│      ├── VerifiedBadge.svelte                                   │
│      └── ThemeToggle.svelte                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### SvelteKit Route Structure

| Route | File | Purpose |
|---|---|---|
| `/` | `src/routes/+page.server.ts` + `+page.svelte` | Homepage with search/filter/grid |
| `/projects/[slug]` | `src/routes/projects/[slug]/+page.server.ts` + `+page.svelte` | Project detail |
| `/projects/[slug]/og` | `src/routes/projects/[slug]/og/+server.ts` | Per-project OG image (PNG) |
| `/submit` | `src/routes/submit/+page.svelte` | Submission guide |
| `/submit/form` | `src/routes/submit/form/+page.svelte` | 5-step guided form |
| `/radar` | `src/routes/radar/+page.server.ts` + `+page.svelte` | Geographic analytics |
| `/about` | `src/routes/about/+page.svelte` | About page |
| `/api/upvote` | `src/routes/api/upvote/+server.ts` | CounterAPI proxy (GET/POST) |
| `/api/og` | `src/routes/api/og/+server.ts` | Homepage OG image |
| `/api/auth/login` | `src/routes/api/auth/login/+server.ts` | GitHub OAuth initiate |
| `/api/auth/callback` | `src/routes/api/auth/callback/+server.ts` | GitHub OAuth callback |
| `/api/auth/logout` | `src/routes/api/auth/logout/+server.ts` | Sign-out |
| `/sitemap.xml` | `src/routes/sitemap.xml/+server.ts` | Dynamic sitemap |
| `/robots.txt` | `static/robots.txt` | Robots file (static) |

### Component Architecture

All components use Svelte 5 runes. No `onMount`/`beforeUpdate` lifecycle functions outside of `$effect`. All props are typed via TypeScript interfaces.

```
src/lib/components/
├── ui/                         (shadcn-svelte — installed via CLI)
│   ├── button/Button.svelte
│   ├── card/Card.svelte, CardHeader.svelte, CardContent.svelte, CardFooter.svelte
│   ├── badge/Badge.svelte
│   ├── input/Input.svelte
│   ├── select/Select.svelte
│   ├── tabs/Tabs.svelte, TabsList.svelte, TabsTrigger.svelte, TabsContent.svelte
│   ├── dialog/Dialog.svelte, DialogContent.svelte, DialogHeader.svelte
│   ├── tooltip/Tooltip.svelte, TooltipContent.svelte, TooltipTrigger.svelte
│   └── skeleton/Skeleton.svelte
│
├── Header.svelte               ($state for mobileOpen; theme toggle)
├── ThemeToggle.svelte          (reads/writes theme context)
├── ProjectCard.svelte          (shadcn Card, image fallback logic)
├── ProjectGrid.svelte          ($state search/filter/sort; $derived results; Fuse.js)
├── SearchBar.svelte            ($state query; emits on:change; clear button)
├── Filters.svelte              (category tabs + sort dropdown; $state activeCategory/sort)
├── ProjectDetail.svelte        (full detail layout, tabs for stats/contributors/similar)
├── SimilarProjects.svelte      (renders up to 4 ProjectCard components)
├── SocialShare.svelte          (Twitter/LinkedIn/Facebook/WhatsApp/navigator.share)
├── ProjectUpvote.svelte        ($state count/hasVoted; localStorage; optimistic update)
├── ContributorAvatars.svelte   (avatar stack with overflow count)
├── VerifiedBadge.svelte        (badge display + copy markdown button)
├── RadarChart.svelte           (SVG hexagonal chart, top 6 states)
├── LanguageBar.svelte          (language breakdown bar chart)
└── BreadcrumbSchema.svelte     (injects BreadcrumbList JSON-LD via <svelte:head>)
```

#### Header.svelte

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import ThemeToggle from './ThemeToggle.svelte';

  let mobileOpen = $state(false);

  // Close mobile menu on navigation
  $effect(() => {
    page.url.pathname; // track navigation
    mobileOpen = false;
  });
</script>
```

#### ProjectGrid.svelte (core search/filter component)

```svelte
<script lang="ts">
  import type { SearchIndexItem } from '$lib/schema';
  import { createFuse } from '$lib/search';

  interface Props {
    initialProjects: SearchIndexItem[];
    categories: { id: string; label: string }[];
  }

  let { initialProjects, categories }: Props = $props();

  let query = $state('');
  let activeCategory = $state('all');
  let sortOrder = $state<'recent' | 'stars' | 'alpha'>('recent');
  let debouncedQuery = $state('');

  const fuse = $derived(createFuse(initialProjects));

  // 300ms debounce via $effect
  $effect(() => {
    const q = query;
    const timer = setTimeout(() => {
      debouncedQuery = q;
    }, 300);
    return () => clearTimeout(timer);
  });

  const searchResults = $derived(
    debouncedQuery.trim()
      ? fuse.search(debouncedQuery).map((r) => r.item)
      : initialProjects
  );

  const filteredProjects = $derived(
    activeCategory === 'all'
      ? searchResults
      : searchResults.filter((p) => p.category === activeCategory)
  );

  const sortedProjects = $derived(
    [...filteredProjects].sort((a, b) => {
      if (sortOrder === 'stars') return (b.stars ?? 0) - (a.stars ?? 0);
      if (sortOrder === 'alpha') return a.name.localeCompare(b.name);
      // 'recent': sort by added_at descending
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    })
  );
</script>
```

---

## Data Models

### Core TypeScript Interfaces

These types are defined in `src/lib/schema.ts` and imported by both SvelteKit routes and CI scripts.

```typescript
// src/lib/schema.ts

import { z } from 'zod';

const RESERVED_SLUGS = [
  'new', 'admin', 'api', 'auth', 'projects', 'tags',
  'search', 'submit', 'about', 'privacy', 'terms'
];

export const ProjectSchema = z.object({
  // Required fields
  slug: z.string()
    .regex(/^[a-z0-9-]+$/)
    .min(2).max(60)
    .refine((s) => !RESERVED_SLUGS.includes(s)),
  name: z.string().min(2).max(80),
  short_desc: z.string().min(10).max(160),
  repo: z.string().url().regex(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/),
  license: z.string().min(1),
  added_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  primary_lang: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).min(1).max(10),
  looking_for_contributors: z.boolean(),
  location_city: z.string().min(2).max(100),
  location_nigerian_state: z.string().min(2).max(100),

  // Optional fields
  website: z.string().url().optional(),
  logo: z.string()
    .regex(/^\/logos\/[^/]+\.(svg|png|jpg|jpeg|webp)$/)
    .optional(),
  good_first_issues: z.number().int().nonnegative().optional().default(0),
  stars: z.number().int().nonnegative().optional().default(0),
  verified: z.boolean().optional().default(false),
  nigeria_connection: z
    .enum(['founder', 'organization', 'community', 'contributor'])
    .optional(),
  nigeria_connection_details: z.string().max(500).optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const SearchIndexItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  short_desc: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  stars: z.number().default(0),
  primary_lang: z.string(),
  verified: z.boolean().default(false),
  added_at: z.string(),
  looking_for_contributors: z.boolean(),
  location_city: z.string(),
  location_nigerian_state: z.string(),
});

export type SearchIndexItem = z.infer<typeof SearchIndexItemSchema>;

export const ProjectSubmissionSchema = ProjectSchema
  .omit({ stars: true, good_first_issues: true, verified: true })
  .extend({ submitter_notes: z.string().max(500).optional() });

export type ProjectSubmission = z.infer<typeof ProjectSubmissionSchema>;
```

### Cache Data Model

Written by `scripts/enrich.ts`, read by the project detail page `load` function.

```typescript
// src/lib/types.ts

export interface Contributor {
  login: string;
  avatar_url: string | undefined;
  html_url: string | undefined;
  contributions: number;
}

export interface InstallationInfo {
  type: 'npm' | 'pip' | 'cargo' | 'go' | 'git';
  command: string;
}

export interface RepoStats {
  forks: number;
  watchers: number;
  open_issues: number;
  size: number;           // KB
  created_at: string;     // ISO 8601
  updated_at: string;
  pushed_at: string;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
}

export interface CacheData {
  slug: string;
  contributors: Contributor[];
  installation: InstallationInfo | null;
  documentation: {
    docs_url?: string;
    changelog_url?: string;
  };
  stats: RepoStats;
  languages: Record<string, number>;  // language -> byte count
  updated_at: string;                 // ISO 8601
}
```

### Category Shape

```typescript
// Loaded from data/categories.json at build/SSR time
export interface Category {
  id: string;
  label: string;
  description: string;
  icon: string;
}
```

### Theme State (Svelte 5 module context)

```typescript
// src/lib/theme.svelte.ts
let theme = $state<'dark' | 'light'>('dark');

export function getTheme() { return theme; }
export function setTheme(t: 'dark' | 'light') {
  theme = t;
  document.documentElement.classList.toggle('dark', t === 'dark');
  localStorage.setItem('theme', t);
}
export function toggleTheme() {
  setTheme(theme === 'dark' ? 'light' : 'dark');
}
```

### Session / Auth State

```typescript
// Stored in an HttpOnly cookie after OAuth callback
export interface GitHubSession {
  access_token: string;   // GitHub user access token (public_repo scope)
  login: string;          // GitHub username
  avatar_url: string;
  expires_at: number;     // Unix timestamp
}

// Exposed to pages via $page.data (set in +layout.server.ts load)
export interface AuthUser {
  login: string;
  avatar_url: string;
}
```

---

## SvelteKit Route Design

### Homepage (`/`)

**`src/routes/+page.server.ts`**

```typescript
import type { PageServerLoad } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { SearchIndexItem } from '$lib/schema';

export const load: PageServerLoad = async () => {
  const indexPath = join(process.cwd(), 'public', 'index.json');
  const searchIndex: SearchIndexItem[] = JSON.parse(readFileSync(indexPath, 'utf-8'));

  const categoriesPath = join(process.cwd(), 'data', 'categories.json');
  const raw = JSON.parse(readFileSync(categoriesPath, 'utf-8'));
  const categories = Object.entries(raw.categories).map(([id, cat]: [string, any]) => ({
    id,
    label: cat.label,
  }));

  return { searchIndex, categories };
};
```

**`src/routes/+page.svelte`**

The page receives `{ searchIndex, categories }` from the load function. It renders:
1. Hero section with headline, subtitle, animated badge → `/submit`
2. `<ProjectGrid {searchIndex} {categories} />` (handles all search/filter/sort client-side)
3. Developer CTA section
4. SEO content section (city links, tech links, category links)
5. Footer

### Project Detail Page (`/projects/[slug]`)

**`src/routes/projects/[slug]/+page.server.ts`**

```typescript
import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { loadAllProjects, getProjectBySlug } from '$lib/projects';
import { findSimilarProjects } from '$lib/similar';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { CacheData } from '$lib/types';

export const entries: EntryGenerator = () => {
  return loadAllProjects().map((p) => ({ slug: p.slug }));
};

export const prerender = true;

export const load: PageServerLoad = async ({ params }) => {
  const project = getProjectBySlug(params.slug);
  if (!project) error(404, 'Project not found');

  let cache: CacheData | null = null;
  const cachePath = join(process.cwd(), 'public', 'cache', `${params.slug}.json`);
  if (existsSync(cachePath)) {
    try {
      cache = JSON.parse(readFileSync(cachePath, 'utf-8'));
    } catch {
      cache = null;
    }
  }

  const allProjects = loadAllProjects();
  const similarProjects = findSimilarProjects(project, allProjects, 4);

  return { project, cache, similarProjects };
};
```

### Upvote API (`/api/upvote`)

**`src/routes/api/upvote/+server.ts`**

```typescript
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getUpvoteCount, incrementUpvoteCount, decrementUpvoteCount } from '$lib/upvote';

export const GET: RequestHandler = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug || slug.length === 0 || slug.length > 100) {
    error(400, 'Invalid slug');
  }
  const count = await getUpvoteCount(slug);
  return json({ slug, count });
};

export const POST: RequestHandler = async ({ request }) => {
  const { slug, action } = await request.json();
  if (!slug || slug.length === 0 || slug.length > 100) {
    error(400, 'Invalid slug');
  }
  if (action !== 'upvote' && action !== 'unvote') {
    error(400, 'action must be "upvote" or "unvote"');
  }
  const count = action === 'upvote'
    ? await incrementUpvoteCount(slug)
    : await decrementUpvoteCount(slug);
  return json({ slug, count, action });
};
```

### GitHub OAuth Flow

**Sequence:**

```
User clicks "Sign in with GitHub"
  → GET /api/auth/login
       Redirects to: https://github.com/login/oauth/authorize
                     ?client_id=GITHUB_CLIENT_ID
                     &redirect_uri=/api/auth/callback
                     &scope=public_repo
                     &state=[CSRF token stored in session cookie]

GitHub authorises user
  → GET /api/auth/callback?code=xxx&state=yyy
       1. Verify CSRF state matches cookie
       2. POST to https://github.com/login/oauth/access_token
       3. GET https://api.github.com/user (to get login + avatar)
       4. Set HttpOnly signed cookie: { access_token, login, avatar_url, expires_at }
       5. Redirect to referrer or /

User visits any page
  → +layout.server.ts load() reads cookie
  → Passes { user: AuthUser | null } to all pages via PageData
```

**`src/routes/api/auth/login/+server.ts`**

```typescript
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies }) => {
  const state = crypto.randomUUID();
  cookies.set('oauth_state', state, { path: '/', httpOnly: true, maxAge: 600 });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${PUBLIC_ORIGIN}/api/auth/callback`,
    scope: 'public_repo',
    state,
  });

  redirect(302, `https://github.com/login/oauth/authorize?${params}`);
};
```

### Sitemap (`/sitemap.xml`)

**`src/routes/sitemap.xml/+server.ts`**

Returns a dynamically generated XML document with entries for all routes and project pages.

### OG Image Endpoints

**Homepage OG: `/api/og/+server.ts`**  
Generates a 1200×630 PNG using `satori` with the Repnect brand name, tricolour accent bar, site headline, and description.

**Per-project OG: `/projects/[slug]/og/+server.ts`**  
Generates a 1200×630 PNG using `satori` including: brand name, tricolour accent bar, project name (large bold), short description, primary language badge, and location city. Returns 404 for unknown slugs.

```typescript
// Example satori call pattern
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export const GET: RequestHandler = async ({ params }) => {
  const project = getProjectBySlug(params.slug);
  if (!project) error(404);

  const svg = await satori(
    // JSX-like element tree describing the card layout
    { type: 'div', props: { /* ... */ } },
    { width: 1200, height: 630, fonts: [...] }
  );

  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' }
  });
};
```

---

## State Management Approach

All mutable state uses Svelte 5 runes. There are no legacy stores (`writable`, `readable`, `derived` from `svelte/store`).

### Theme State

Implemented as a Svelte 5 module-level `$state` in `src/lib/theme.svelte.ts`. The `+layout.svelte` imports and subscribes. FOUC prevention is handled by an inline `<script>` in `src/app.html` that reads `localStorage` and sets the `dark` class before the page paints.

```html
<!-- src/app.html -->
<head>
  <script>
    (function() {
      const t = localStorage.getItem('theme');
      const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (t === 'dark' || (!t && prefer === 'dark')) {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>
  %sveltekit.head%
</head>
```

### Search and Filter State (ProjectGrid)

```
query ($state)
  ├── $effect → 300ms setTimeout → debouncedQuery ($state)
  └── [$derived] searchResults via Fuse.js on debouncedQuery

activeCategory ($state: string, 'all' | category id)
sortOrder ($state: 'recent' | 'stars' | 'alpha')

filteredProjects = $derived(
  activeCategory === 'all' ? searchResults : searchResults.filter(...)
)

sortedProjects = $derived([...filteredProjects].sort(...))
```

### Upvote State (ProjectUpvote)

```
count ($state: number)
hasVoted ($state: boolean, initialised from localStorage)
loading ($state: boolean)

// Optimistic update flow:
// 1. Update count and hasVoted immediately ($state mutation)
// 2. POST /api/upvote
// 3. On error: revert count and hasVoted to previous values
```

### GitHub OAuth State

Session state is not held in Svelte `$state`. It flows from the server via `+layout.server.ts` load → `$page.data.user` (SvelteKit's `$page` rune from `$app/state`). UI elements conditionally rendered based on `$page.data.user`.

### Form Step State (Submit Form)

```
currentStep ($state: 1 | 2 | 3 | 4 | 5)
formData ($state: Partial<ProjectSubmission>)
validationErrors ($state: Record<string, string>)
githubFetchStatus ($state: 'idle' | 'loading' | 'success' | 'error')
prCreationStatus ($state: 'idle' | 'loading' | 'success' | 'error')
```

---

## Search and Filter Architecture

### Fuse.js Integration

```typescript
// src/lib/search.ts
import Fuse from 'fuse.js';
import type { SearchIndexItem } from './schema';

export function createFuse(items: SearchIndexItem[]): Fuse<SearchIndexItem> {
  return new Fuse(items, {
    threshold: 0.3,
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'short_desc', weight: 0.3 },
      { name: 'tags', weight: 0.2 },
      { name: 'category', weight: 0.1 },
    ],
    includeScore: true,
  });
}
```

The `createFuse` function is called once per `ProjectGrid` instance, inside a `$derived` that re-creates the Fuse instance if `initialProjects` changes (e.g., if the parent re-renders with a new array). Because the search index is SSR-loaded and static for the session, the Fuse instance is effectively created once.

### Filter and Sort Pipeline

```
initialProjects (from server load, stable reference)
  → searchResults (Fuse results or all, based on debouncedQuery)
    → filteredProjects (category filter applied)
      → sortedProjects (sort applied, spread to new array for Svelte reactivity)
        → rendered in ProjectGrid
```

---

## GitHub OAuth Flow Design

The OAuth flow is entirely custom, implemented in SvelteKit `+server.ts` files. No third-party auth library is required.

### Environment Variables Required

- `GITHUB_CLIENT_ID` — OAuth app client ID
- `GITHUB_CLIENT_SECRET` — OAuth app client secret
- `SESSION_SECRET` — 32-byte hex string for signing the session cookie
- `GITHUB_REPO_OWNER` — Target repo owner for PR creation (`wbfoss`)
- `GITHUB_REPO_NAME` — Target repo name (`repnect`)

### Fallback Behaviour

When `GITHUB_CLIENT_ID` is not set:
- The "Sign in with GitHub" button is hidden
- The submission form shows the manual git workflow instead of the auto-PR button
- The GitHub star button links directly to the repository URL

### Session Cookie

The access token is stored in an HttpOnly, SameSite=Lax, Secure cookie named `gh_session`. The value is a Base64-encoded JSON object signed with HMAC-SHA256 using `SESSION_SECRET`.

---

## OG Image Generation

`satori` is used for SVG generation, with `@resvg/resvg-js` to render the SVG to PNG.

### Card Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ▓▓▓ [saffron] ▓▓▓ [white] ▓▓▓ [green] (6px tricolour accent)    │
│                                                                 │
│  Repnect.dev logo + wordmark (top left)                       │
│                                                                 │
│  [Project Name — large, 64px, bold, white]                      │
│                                                                 │
│  [Short description — 32px, gray-400, 2-line clamp]             │
│                                                                 │
│  [Language badge]  [City, State]                                │
│                                                                 │
│                                repnect.dev (bottom right)     │
└─────────────────────────────────────────────────────────────────┘
1200px × 630px, dark background (#030712)
```

Font loading uses `satori`'s `fonts` option. The Inter font is loaded server-side from the static directory or fetched once at startup and cached.

---

## CI Scripts Architecture

The three CI scripts are standalone TypeScript files executable via `tsx`. They share code from `src/lib/` (schema, projects, github utilities) via relative imports.

### File Structure

```
scripts/
├── build-index.ts    (tsx scripts/build-index.ts)
├── enrich.ts         (tsx scripts/enrich.ts, requires GITHUB_TOKEN)
└── validate.ts       (tsx scripts/validate.ts)
```

### Shared Import Pattern

```typescript
// scripts/build-index.ts
import { loadAllProjects } from '../src/lib/projects.js';
import type { SearchIndexItem } from '../src/lib/schema.js';
```

The `tsconfig.json` at root enables `"moduleResolution": "bundler"` and `"allowImportingTsExtensions": false`, ensuring `.js` extension imports resolve to `.ts` source files when run via `tsx`.

### package.json Scripts

```json
{
  "scripts": {
    "validate":    "tsx scripts/validate.ts",
    "build:index": "tsx scripts/build-index.ts",
    "enrich":      "tsx scripts/enrich.ts",
    "build":       "pnpm run build:index && vite build",
    "dev":         "vite dev",
    "preview":     "vite preview"
  }
}
```

### Enrich Script Rate Limiting

Between each GitHub API call, the enrich script pauses using:
```typescript
await new Promise<void>((resolve) => setTimeout(resolve, 1000));
```

---

## Environment Variables

### Server-only (`$env/static/private`)

| Variable | Required | Description |
|---|---|---|
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth app client secret |
| `GITHUB_TOKEN` | Optional (CI) | Personal access token for enrich/validate scripts |
| `SESSION_SECRET` | Recommended | 32-char hex, for signing session cookies |
| `GITHUB_REPO_OWNER` | Optional | Upstream repo owner for PR creation |
| `GITHUB_REPO_NAME` | Optional | Upstream repo name for PR creation |

### Public (`$env/static/public`)

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_SITE_URL` | Yes | Canonical base URL, e.g. `https://repnect.dev` |
| `PUBLIC_VERCEL_ANALYTICS` | Optional | `"true"` to enable Vercel Analytics |
| `PUBLIC_VERCEL_SPEED_INSIGHTS` | Optional | `"true"` to enable Speed Insights |
| `PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 Measurement ID |

### `.env.example`

```bash
# GitHub OAuth (optional – enables PR creation + star button)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SESSION_SECRET=

# Repo for PR submission
GITHUB_REPO_OWNER=wbfoss
GITHUB_REPO_NAME=repnect

# GitHub token for CI scripts only
GITHUB_TOKEN=

# Public
PUBLIC_SITE_URL=http://localhost:5173
PUBLIC_VERCEL_ANALYTICS=false
PUBLIC_VERCEL_SPEED_INSIGHTS=false
PUBLIC_GA_MEASUREMENT_ID=
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Schema validation rejects invalid field values

*For any* object where a required Project field violates its constraint (slug contains uppercase, name shorter than 2 chars, tags array longer than 10, reserved slug used, etc.), the `ProjectSchema.parse()` call SHALL throw a ZodError whose message identifies the failing field.

**Validates: Requirements 1.1, 1.3**

---

### Property 2: Logo path pattern enforcement

*For any* string value provided as the `logo` field, the schema SHALL accept it if and only if it matches the pattern `/^\/logos\/[^/]+\.(svg|png|jpg|jpeg|webp)$/`.

**Validates: Requirements 1.5**

---

### Property 3: TOML round-trip preserves project data

*For any* valid `Project` object, serialising it to a TOML string and then re-parsing that string SHALL produce a `Project` object that is deep-equal to the original.

**Validates: Requirements 1.6**

---

### Property 4: Search index contains exactly the required fields per item

*For any* non-empty collection of valid Project TOML files, running `buildIndex()` on that collection SHALL produce a `SearchIndexItem[]` where every element contains exactly the fields: `slug`, `name`, `short_desc`, `category`, `tags`, `stars`, `primary_lang`, `verified`, `added_at`, `looking_for_contributors`, `location_city`, `location_nigerian_state`.

**Validates: Requirements 2.2**

---

### Property 5: Build index sort order is deterministic and stable

*For any* set of `SearchIndexItem` objects that includes at least one with `slug === "repnect"`, the `sortIndex()` function SHALL always place that item at index 0, with all remaining items sorted alphabetically by `name`; and running the same function twice on the same input SHALL produce identical output.

**Validates: Requirements 2.3, 2.6**

---

### Property 6: Validate script correctly identifies allowlist violations

*For any* `Project` object with tags not in the Tag allowlist OR a category not in the Category allowlist OR a license not in the OSI list, the validator's `checkAllowlists(project)` function SHALL return a non-empty error array identifying each violation.

**Validates: Requirements 3.2, 3.3, 3.4**

---

### Property 7: Enrich script preserves non-target TOML fields

*For any* Project TOML that has been enriched, all fields other than `stars`, `good_first_issues`, and `verified` SHALL remain unchanged after the enrich operation, including when none of the target fields actually change value.

**Validates: Requirements 4.2, 24.5**

---

### Property 8: Search results are always a subset of the full project list

*For any* non-empty query string `q` and search index `items`, calling `fuse.search(q)` SHALL return a result set whose slugs are all present in `items` (results ⊆ full set).

**Validates: Requirements 6.4, 6.8**

---

### Property 9: Empty query returns all projects

*For any* project list `items`, when the search query is empty or whitespace-only, the displayed project list SHALL be equal to `items` (subject to active category filter and sort, but no query filtering applied).

**Validates: Requirements 6.2**

---

### Property 10: Category filter invariant — all results match selected category

*For any* selected category `c` (not "all") and project list, every project in the filtered result set SHALL have `project.category === c`.

**Validates: Requirements 7.3, 7.7**

---

### Property 11: Filter+sort results are always a subset of the full search index

*For any* combination of category filter and sort order applied to a project list, the resulting display set SHALL be a subset of the original `SearchIndexItem[]`.

**Validates: Requirements 7.6**

---

### Property 12: Similar projects never include the current project

*For any* project `P` and project list `all`, calling `findSimilarProjects(P, all, 4)` SHALL return an array that does not contain any item with `slug === P.slug`.

**Validates: Requirements 10.1, 10.3**

---

### Property 13: Similar projects count never exceeds 4

*For any* project and any project list (regardless of size), `findSimilarProjects(project, list, 4).length` SHALL be ≤ 4.

**Validates: Requirements 10.2, 10.4**

---

### Property 14: Upvote API slug validation

*For any* slug that is either empty (`length === 0`) or longer than 100 characters, the upvote API endpoint SHALL return HTTP 400 with an error message.

**Validates: Requirements 14.8**

---

### Property 15: Geographic state project counts sum to total

*For any* collection of Project objects, grouping projects by `location_nigerian_state` and summing the count per group SHALL equal the total number of projects in the collection.

**Validates: Requirements 15.9**

---

### Property 16: Theme toggle round-trip returns to original

*For any* initial theme value `t ∈ { "dark", "light" }`, calling `toggleTheme()` twice in succession SHALL result in the theme being equal to `t`.

**Validates: Requirements 17.5**

---

### Property 17: Canonical URL matches expected pattern for all project slugs

*For any* valid project slug `s` (matching `/^[a-z0-9-]+$/`, 2–60 chars), the canonical URL generated for that project's detail page SHALL exactly equal `https://repnect.dev/projects/${s}`.

**Validates: Requirements 19.6**

---

## Error Handling

### Data Loading

- If `public/index.json` does not exist at server start, the homepage `load` function returns an empty `searchIndex: []`, triggering the empty-state UI (requirement 5.8).
- If a project TOML is malformed, `getProjectBySlug` returns `null` and the detail page `load` throws `error(404)`.
- If a Cache JSON is malformed, the detail page `load` sets `cache: null` and the reduced-stats view is shown (requirement 9.4).

### API Errors

- Upvote GET/POST: invalid slug → 400; CounterAPI failure → 500 with JSON error body.
- OG image: unknown slug → 404; satori render failure → 500.
- OAuth callback: CSRF mismatch or token exchange failure → redirect to `/` with error query param; all session data absent → user treated as unauthenticated.

### CI Script Errors

- `validate.ts`: collects all errors and warnings, prints them, then exits 1 if any errors (not warnings) found. Continues processing all files even after errors.
- `build-index.ts`: exits 1 on any parse error; prints warning (not error) when index exceeds 300 KB.
- `enrich.ts`: exits 1 if `GITHUB_TOKEN` is absent; logs warning per-project and continues on network/404 errors.

### Client-side Upvote Error Recovery

```svelte
<!-- ProjectUpvote.svelte pattern -->
<script lang="ts">
  let count = $state(initialCount);
  let hasVoted = $state(/* from localStorage */);

  async function handleVote() {
    const prevCount = count;
    const prevVoted = hasVoted;

    // Optimistic update
    count = hasVoted ? count - 1 : count + 1;
    hasVoted = !hasVoted;

    try {
      const res = await fetch('/api/upvote', { method: 'POST', body: JSON.stringify({ slug, action: hasVoted ? 'upvote' : 'unvote' }) });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      count = data.count;
    } catch {
      // Revert on failure
      count = prevCount;
      hasVoted = prevVoted;
    }
  }
</script>
```

---

## Testing Strategy

### Unit Tests (Vitest)

Located in `src/lib/__tests__/` and alongside components in `src/lib/components/__tests__/`.

Unit tests cover:
- Schema validation edge cases (boundary values, reserved slugs, invalid regex patterns)
- `loadAllProjects()` filename-slug mismatch detection
- `findSimilarProjects()` scoring and exclusion logic
- `buildIndex()` sort order and field projection
- `checkAllowlists()` tag/category/license validation
- Upvote API slug validation (400 boundary conditions)
- Theme toggle logic
- Canonical URL generation

Example unit test structure:
```typescript
// src/lib/__tests__/schema.test.ts
import { describe, it, expect } from 'vitest';
import { ProjectSchema } from '../schema';

describe('ProjectSchema', () => {
  it('rejects a reserved slug', () => {
    expect(() => ProjectSchema.parse({ ...validProject, slug: 'admin' })).toThrow();
  });
});
```

### Property-Based Tests (Vitest + fast-check)

Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) as the PBT library. Each test runs a **minimum of 100 iterations** (fast-check default). Tests are tagged with a comment referencing the design property they validate.

```typescript
// src/lib/__tests__/schema.property.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Feature: fosswe-svelte-rebuild, Property 2: Logo path pattern enforcement
it('schema accepts valid logo paths and rejects invalid ones', () => {
  fc.assert(
    fc.property(
      fc.string(),
      (logo) => {
        const isValid = /^\/logos\/[^/]+\.(svg|png|jpg|jpeg|webp)$/.test(logo);
        const result = ProjectSchema.safeParse({ ...validProject, logo });
        return isValid ? result.success : !result.success;
      }
    ),
    { numRuns: 100 }
  );
});
```

Property tests to implement (one test per property):

| Test File | Property | fast-check Arbitraries |
|---|---|---|
| `schema.property.test.ts` | P1: Schema rejects invalid fields | `fc.record` with arbitrary string/number values for each field |
| `schema.property.test.ts` | P2: Logo path pattern | `fc.string()` for logo values |
| `schema.property.test.ts` | P3: TOML round-trip | `fc.record` from valid Project arbitraries; serialize + re-parse |
| `build-index.property.test.ts` | P4: SearchIndexItem fields | `fc.array(validProjectArbitrary)` |
| `build-index.property.test.ts` | P5: Sort order deterministic | `fc.array(validProjectArbitrary)` with at least one `slug === "repnect"` |
| `validate.property.test.ts` | P6: Allowlist violations detected | `fc.array(fc.string())` for tags/category/license outside allowlists |
| `enrich.property.test.ts` | P7: Non-target fields preserved | `fc.record` for full Project; mock GitHub API; verify unchanged fields |
| `search.property.test.ts` | P8: Search results ⊆ full set | `fc.array(searchItemArbitrary)` + `fc.string()` for query |
| `search.property.test.ts` | P9: Empty query returns all | `fc.array(searchItemArbitrary)` |
| `filters.property.test.ts` | P10: Category filter invariant | `fc.array(searchItemArbitrary)` + `fc.string()` for category |
| `filters.property.test.ts` | P11: Filter+sort ⊆ full index | `fc.array(searchItemArbitrary)` + `fc.constantFrom('recent','stars','alpha')` |
| `similar.property.test.ts` | P12: Current project not in similar | `fc.record` for Project + `fc.array(projectArbitrary)` |
| `similar.property.test.ts` | P13: Similar count ≤ 4 | `fc.array(projectArbitrary, { maxLength: 1000 })` |
| `upvote.property.test.ts` | P14: Slug validation returns 400 | `fc.oneof(fc.constant(''), fc.string({ minLength: 101 }))` |
| `radar.property.test.ts` | P15: State counts sum to total | `fc.array(projectArbitrary)` |
| `theme.property.test.ts` | P16: Theme toggle round-trip | `fc.constantFrom('dark', 'light')` as initial theme |
| `seo.property.test.ts` | P17: Canonical URL pattern | `fc.stringMatching(/^[a-z0-9-]{2,60}$/).filter(s => !RESERVED_SLUGS.includes(s))` |

### Integration Tests

Integration tests use Vitest with the SvelteKit test harness or plain `fetch` against a preview build. These cover:
- GitHub OAuth callback with mocked `fetch` (token exchange)
- Upvote endpoint end-to-end with mocked CounterAPI
- OG image endpoint returns `Content-Type: image/png` for valid slugs, 404 for invalid
- Sitemap contains all project URLs

### Component Tests

Svelte component tests use `@testing-library/svelte`:
- `ProjectCard` renders name, description, language badge, and navigates to correct slug
- `ProjectUpvote` displays loading state and reverts on API error
- `ThemeToggle` shows correct icon for each theme state
- `SocialShare` constructs correct share URLs for each platform

### Test Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
  },
});
```

fast-check is added as a dev dependency:
```json
{
  "devDependencies": {
    "fast-check": "^3.x.x"
  }
}
```

Each property test file is tagged at the top level:
```typescript
// Feature: fosswe-svelte-rebuild
// Tests: Property N — [title]
```
