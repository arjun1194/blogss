# Design Spec: Minimalist Text Book & Blog Generator

A text-based, highly structured personal book/blog website with a Monaco monospace aesthetic. The site compiles from Markdown files containing frontmatter, supports dynamic dark/light modes, features a Hacker News-inspired homepage with interactive filtering, includes a collapsible chapter exploration sidebar, displays "No AI content" badges, and deploys automatically to GitHub Pages.

---

## 1. Directory Structure

The repository will be structured as follows:

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow for auto-deployment
├── content/                     # Obsidian Vault folder (where you write Markdown)
│   ├── life/
│   │   └── on-walking.md
│   └── software-engineering/
│       └── clean-architecture.md
├── src/
│   ├── templates/
│   │   ├── base.html            # Core layout template containing fonts, CSS, side panel
│   │   └── home.html            # Template for the homepage list layout
│   └── build.js                 # Custom Node.js build script
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-06-28-text-book-design.md  # This design spec
├── package.json                 # Project configuration and dependency listing
└── package-lock.json
```

The build script will output the compiled static website directly into a `/dist` directory (ignored by git, compiled only during deployment or local runs):
```text
dist/
├── index.html                   # Compiled creative Hacker News-style index
├── posts/
│   ├── life/
│   │   └── on-walking.html
│   └── software-engineering/
│       └── clean-architecture.html
└── style.css                    # Compiled stylesheet shared by all pages
```

---

## 2. Frontmatter Specification

Every chapter markdown file must start with a YAML-like block containing metadata:

```markdown
---
title: On Clean Architecture
category: Software Engineering
tags: [software-engineering, architecture, clean-code]
excerpt: A reflection on separating concerns in small and large software systems.
date: 2026-06-28
---
```

### Metadata Fields:
* `title` (string): The title of the chapter.
* `category` (string): The main grouping category (e.g., "Life", "Software Engineering").
* `tags` (array of strings): Specific tags used for interactive filtering on the homepage.
* `excerpt` (string): A short one-sentence summary shown on the homepage list.
* `date` (string, `YYYY-MM-DD`): Publication date for sorting and displaying.

---

## 3. Design Tokens & Styling (CSS)

A single CSS file (`style.css`) will handle layout and design. It will use CSS custom properties to implement the dynamic Light/Dark mode.

### Font
* Primary & Code: `Monaco, "Courier New", Courier, monospace` (clean spacing, technical print style).
* Line height: `1.6` for readable book-like spacing.

### Theme Variables

```css
:root {
  /* Light Theme */
  --bg-color: #fdfcfb;
  --text-color: #1a1b1c;
  --text-muted: #5e6064;
  --border-color: #e1dfda;
  --accent-color: #0066cc;
  --accent-hover: #004499;
  --sidebar-bg: #f5f4f0;
  --sidebar-hover: #e8e6e0;
  --card-bg: #f7f6f2;
}

@media (prefers-color-scheme: dark) {
  :root[data-theme="auto"] {
    --bg-color: #0e1011;
    --text-color: #e2e4e6;
    --text-muted: #8b949e;
    --border-color: #2c3136;
    --accent-color: #58a6ff;
    --accent-hover: #79c0ff;
    --sidebar-bg: #15181b;
    --sidebar-hover: #21262d;
    --card-bg: #161b22;
  }
}

:root[data-theme="dark"] {
  --bg-color: #0e1011;
  --text-color: #e2e4e6;
  --text-muted: #8b949e;
  --border-color: #2c3136;
  --accent-color: #58a6ff;
  --accent-hover: #79c0ff;
  --sidebar-bg: #15181b;
  --sidebar-hover: #21262d;
  --card-bg: #161b22;
}

:root[data-theme="light"] {
  --bg-color: #fdfcfb;
  --text-color: #1a1b1c;
  --text-muted: #5e6064;
  --border-color: #e1dfda;
  --accent-color: #0066cc;
  --accent-hover: #004499;
  --sidebar-bg: #f5f4f0;
  --sidebar-hover: #e8e6e0;
  --card-bg: #f7f6f2;
}
```

---

## 4. Badge Specification ("No AI Content")

To make it immediately visible, we will feature the badge in two locations:

### 1. Small Top Right Corner Badge
Pinned to the top right viewport using fixed positioning. Minimal text in a structured box:
```html
<a href="#no-ai-badge-footer" class="ai-badge-header" title="Learn more about this site's policy">
  <span>[100% Human Written]</span>
</a>
```

### 2. Large Footer Badge
Placed in the sitemap footer, drawing attention with an inline SVG graphic and description:
```html
<div class="ai-badge-footer-container" id="no-ai-badge-footer">
  <svg class="ai-badge-svg" viewBox="0 0 100 100" width="48" height="48">
    <!-- Custom SVG emblem representing human craft: standard hand-written feel -->
    <path d="M50 5 L95 28 L95 72 L50 95 L5 72 L5 28 Z" fill="none" stroke="currentColor" stroke-width="2"/>
    <text x="50" y="45" font-size="28" font-family="monospace" text-anchor="middle" fill="currentColor">H</text>
    <text x="50" y="70" font-size="12" font-family="monospace" text-anchor="middle" fill="currentColor">100%</text>
  </svg>
  <div class="ai-badge-text">
    <strong>No AI Content Policy</strong>
    <p>This website is crafted entirely from scratch. Every sentence is written directly by human hands, word by word.</p>
  </div>
</div>
```

---

## 5. JavaScript Interactions (Client-Side)

### Light/Dark Mode Switcher
Persisted in `localStorage` and default to the system preference.
```javascript
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'auto';

document.documentElement.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
  let theme = document.documentElement.getAttribute('data-theme');
  let newTheme = 'light';
  if (theme === 'light') {
    newTheme = 'dark';
  } else if (theme === 'dark') {
    newTheme = 'auto';
  }
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});
```

### Interactive Tag Filtering (Homepage)
A script on `index.html` filters posts on the fly when tags or categories are clicked:
```javascript
function filterPosts(tag) {
  const posts = document.querySelectorAll('.post-item');
  const activeTags = document.querySelectorAll('.filter-tag');
  
  // Highlight active tag UI
  activeTags.forEach(el => {
    if (el.dataset.tag === tag) el.classList.add('active');
    else el.classList.remove('active');
  });

  posts.forEach(post => {
    const postTags = JSON.parse(post.dataset.tags || '[]');
    const postCategory = post.dataset.category || '';
    if (tag === 'all' || postTags.includes(tag) || postCategory === tag) {
      post.style.display = 'block';
    } else {
      post.style.display = 'none';
    }
  });
}
```

---

## 6. Build Engine & Deploy Pipeline

### The Node.js Custom Build Script (`src/build.js`)
The script does not require a local development server for deployment; it compiles simple HTML files. It will:
1. Scan the `content/` folder recursively for `.md` files.
2. Read frontmatter using regex (avoiding parser packages) and calculate estimated reading times (Word count / 200).
3. Sort all posts chronologically by `date` (descending).
4. Parse the Markdown body into HTML elements (using the standard `marked` library).
5. Compile dynamic sidebar links (grouped by Category) containing references to all posts.
6. Render the homepage (`index.html`) using sorted list items and rendering tags.
7. Render each chapter page inside its category subdirectory under `dist/posts/[category]/[slug].html`.
8. Write the shared stylesheet `dist/style.css`.

### Continuous Integration (GitHub Actions)
Deploy to GitHub Pages runs automatically via `.github/workflows/deploy.yml`:
```yaml
name: Deploy static content to Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Build site
        run: node src/build.js
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 7. Verification Plan
1. **Local Test Script:** Add an `npm run build` and a simple dev server script `npm run dev` to verify output locally.
2. **Aesthetic Check:** Verify font sizes, theme switching, sidebar layout, and badge alignment on mobile/desktop viewports.
3. **Markdown rendering test:** Test inline code formatting, blockquotes, headers, bold text, links, and code blocks.
