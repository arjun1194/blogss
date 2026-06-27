# Text Book Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a clean, text-based personal book/blog site using Monaco font, supporting dynamic light/dark theme, featuring a Hacker News-style filtered list homepage, dynamic sidebar, and custom badges, deployed automatically to GitHub Pages.

**Architecture:** Build a content compiler in Node.js that parses Markdown files with YAML frontmatter, compiles them with HTML templates, and writes static files to a `/dist` folder. Client-side JS manages search/sidebar navigation, tags filtering, and theme switching.

**Tech Stack:** Node.js, `marked` (Markdown parser), HTML, CSS, GitHub Actions.

## Global Constraints
- Primary typography: `Monaco, Courier New, monospace`.
- Badge location: Small badge pinned to top-right corner, large badge in footer.
- Badge text: "100% Human Written" and AI-Free certification details.
- Standard static output under `/dist` folder.
- Dynamic dark/light mode saved to `localStorage` and default to system preferences.
- Clean design with minimal borders and responsive layout.

---

### Task 1: Package initialization and basic dependencies

**Files:**
- Create: `package.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: Base configuration for run scripts and dependency mappings.

- [ ] **Step 1: Create package.json**
Create `package.json` at the root with standard script mappings and the `marked` library.
```json
{
  "name": "text-book-blog",
  "version": "1.0.0",
  "description": "Minimal monospace book/blog",
  "main": "src/build.js",
  "type": "module",
  "scripts": {
    "build": "node src/build.js",
    "test": "node --test"
  },
  "dependencies": {
    "marked": "^12.0.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**
Create a `.gitignore` to prevent tracking of `node_modules` and compiled files.
```text
node_modules
dist
.DS_Store
```

- [ ] **Step 3: Run npm install**
Run: `npm install`
Expected: Installs `marked` and generates `package-lock.json`.

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize project configuration and dependencies"
```

---

### Task 2: Core Helper Functions and Unit Tests

**Files:**
- Create: `src/helpers.js`
- Create: `tests/helpers.test.js`

**Interfaces:**
- Consumes: Raw text values.
- Produces: 
  - `parseFrontmatter(content)`: returns `{ metadata: {}, body: "" }`
  - `calculateReadingTime(text)`: returns string (e.g. `"4 min read"`)
  - `slugify(text)`: returns url-safe slug (e.g. `"clean-architecture"`)

- [ ] **Step 1: Write helper tests in tests/helpers.test.js**
```javascript
import test from 'node:test';
import assert from 'node:assert';
import { parseFrontmatter, calculateReadingTime, slugify } from '../src/helpers.js';

test('parseFrontmatter parses YAML blocks correctly', () => {
  const content = `---\ntitle: On Walking\ncategory: Life\ntags: [life, personal]\nexcerpt: Just walk.\n---\nThis is body.`;
  const { metadata, body } = parseFrontmatter(content);
  assert.strictEqual(metadata.title, 'On Walking');
  assert.strictEqual(metadata.category, 'Life');
  assert.deepStrictEqual(metadata.tags, ['life', 'personal']);
  assert.strictEqual(metadata.excerpt, 'Just walk.');
  assert.strictEqual(body.trim(), 'This is body.');
});

test('calculateReadingTime calculates correct minutes', () => {
  const text = 'word '.repeat(350);
  const time = calculateReadingTime(text);
  assert.strictEqual(time, '2 min read');
});

test('slugify converts titles to valid URLs', () => {
  assert.strictEqual(slugify('Software Engineering 101!'), 'software-engineering-101');
});
```

- [ ] **Step 2: Run tests to verify failure**
Run: `npm test`
Expected: Fails with "cannot find module '../src/helpers.js'"

- [ ] **Step 3: Implement src/helpers.js**
```javascript
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };
  
  const yaml = match[1];
  const body = match[2];
  const metadata = {};
  
  yaml.split('\n').forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
      if (val.startsWith('[') && val.endsWith(']')) {
        metadata[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      } else {
        metadata[key] = val;
      }
    }
  });
  return { metadata, body };
}

export function calculateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / 200);
  return `${time} min read`;
}

export function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
```

- [ ] **Step 4: Run tests to verify success**
Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add src/helpers.js tests/helpers.test.js
git commit -m "feat: implement core helper functions with passing unit tests"
```

---

### Task 3: Shared Templates and Styling Sheet

**Files:**
- Create: `src/templates/style.css`
- Create: `src/templates/base.html`
- Create: `src/templates/home.html`

**Interfaces:**
- Produces: HTML blueprints and styling rules mapping CSS variables to themes.

- [ ] **Step 1: Create src/templates/style.css**
```css
:root {
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

body {
  font-family: Monaco, "Courier New", Courier, monospace;
  background-color: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

a {
  color: var(--accent-color);
  text-decoration: none;
}

a:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

footer {
  border-top: 2px solid var(--border-color);
  margin-top: 4rem;
  padding-top: 2rem;
}

.footer-layout {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2rem;
}

.sitemap-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sitemap-links li {
  margin-bottom: 0.5rem;
}

.ai-badge-header {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  border-radius: 3px;
  z-index: 100;
}

.ai-badge-footer-container {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  max-width: 450px;
}

.ai-badge-svg {
  flex-shrink: 0;
}

.ai-badge-text strong {
  display: block;
  margin-bottom: 0.25rem;
}

.ai-badge-text p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

#theme-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-family: inherit;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  border-radius: 3px;
}

/* Sidebar styling */
.sidebar {
  position: fixed;
  left: -280px;
  top: 0;
  bottom: 0;
  width: 260px;
  background-color: var(--sidebar-bg);
  border-right: 2px solid var(--border-color);
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  transition: left 0.3s ease;
  z-index: 99;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.sidebar.active {
  left: 0;
}

.sidebar-toggle-btn {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  background: var(--accent-color);
  color: #fff;
  border: none;
  font-family: inherit;
  padding: 0.6rem 1rem;
  cursor: pointer;
  z-index: 100;
  border-radius: 3px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.sidebar-category {
  margin-bottom: 1.5rem;
}

.sidebar-category-title {
  font-weight: bold;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.sidebar-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-links li {
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.search-input {
  width: 90%;
  padding: 0.4rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  font-family: inherit;
}

/* Post lists on Homepage */
.tag-cloud {
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-tag {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 3px;
  cursor: pointer;
}

.filter-tag.active {
  background: var(--accent-color);
  color: #fff;
  border-color: var(--accent-color);
}

.post-item {
  margin-bottom: 2.5rem;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 1.5rem;
}

.post-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.post-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.post-category-badge {
  background: var(--border-color);
  color: var(--text-color);
  padding: 0.1rem 0.4rem;
  border-radius: 2px;
}

.post-excerpt {
  margin: 0.5rem 0;
  font-style: italic;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.post-tags-list {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.post-tag {
  font-size: 0.75rem;
  color: var(--accent-color);
  cursor: pointer;
}

.post-tag:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .footer-layout {
    flex-direction: column;
  }
}
```

- [ ] **Step 2: Create src/templates/base.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - My Book</title>
  <link rel="stylesheet" href="{{RELATIVE_PATH}}style.css">
</head>
<body>

  <!-- Small top right corner badge -->
  <a href="#no-ai-badge-footer" class="ai-badge-header">
    <span>[100% Human Written]</span>
  </a>

  <!-- Sidebar menu toggle button -->
  <button class="sidebar-toggle-btn" id="sidebar-toggle">☰ Chapters</button>

  <!-- Sidebar explore drawer -->
  <aside class="sidebar" id="sidebar-drawer">
    <input type="text" id="sidebar-search" class="search-input" placeholder="Search chapters...">
    {{SIDEBAR}}
  </aside>

  <div class="container">
    <header>
      <h1><a href="{{RELATIVE_PATH}}index.html">My Book</a></h1>
      <button id="theme-toggle">Theme</button>
    </header>

    <main>
      <article>
        {{CONTENT}}
      </article>
    </main>

    <footer>
      <div class="footer-layout">
        <div class="sitemap-links">
          <strong>Sitemap</strong>
          <ul>
            <li><a href="{{RELATIVE_PATH}}index.html">Home</a></li>
            <li><a href="https://github.com">GitHub Repository</a></li>
          </ul>
        </div>
        
        <div class="ai-badge-footer-container" id="no-ai-badge-footer">
          <svg class="ai-badge-svg" viewBox="0 0 100 100" width="48" height="48">
            <path d="M50 5 L95 28 L95 72 L50 95 L5 72 L5 28 Z" fill="none" stroke="currentColor" stroke-width="2"/>
            <text x="50" y="45" font-size="28" font-family="monospace" text-anchor="middle" fill="currentColor">H</text>
            <text x="50" y="70" font-size="12" font-family="monospace" text-anchor="middle" fill="currentColor">100%</text>
          </svg>
          <div class="ai-badge-text">
            <strong>No AI Content Policy</strong>
            <p>This website is crafted entirely from scratch. Every sentence is written directly by human hands, word by word.</p>
          </div>
        </div>
      </div>
    </footer>
  </div>

  <script>
    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    // Sidebar drawer toggle logic
    const sidebar = document.getElementById('sidebar-drawer');
    const toggleBtn = document.getElementById('sidebar-toggle');
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    // Sidebar search filtering
    const searchInput = document.getElementById('sidebar-search');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const links = sidebar.querySelectorAll('.sidebar-links li');
      links.forEach(li => {
        const text = li.textContent.toLowerCase();
        if (text.includes(query)) {
          li.style.display = 'block';
        } else {
          li.style.display = 'none';
        }
      });
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Create src/templates/home.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Book - Table of Contents</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- Small top right corner badge -->
  <a href="#no-ai-badge-footer" class="ai-badge-header">
    <span>[100% Human Written]</span>
  </a>

  <div class="container">
    <header>
      <h1><a href="index.html">My Book</a></h1>
      <button id="theme-toggle">Theme</button>
    </header>

    <main>
      <!-- Interactive tag filter cloud -->
      <section class="tag-cloud">
        <button class="filter-tag active" data-tag="all" onclick="filterPosts('all')">All</button>
        {{TAGS}}
      </section>

      <!-- Hacker news-style post timeline list -->
      <section class="posts-list">
        {{POSTS}}
      </section>
    </main>

    <footer>
      <div class="footer-layout">
        <div class="sitemap-links">
          <strong>Sitemap</strong>
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="https://github.com">GitHub Repository</a></li>
          </ul>
        </div>
        
        <div class="ai-badge-footer-container" id="no-ai-badge-footer">
          <svg class="ai-badge-svg" viewBox="0 0 100 100" width="48" height="48">
            <path d="M50 5 L95 28 L95 72 L50 95 L5 72 L5 28 Z" fill="none" stroke="currentColor" stroke-width="2"/>
            <text x="50" y="45" font-size="28" font-family="monospace" text-anchor="middle" fill="currentColor">H</text>
            <text x="50" y="70" font-size="12" font-family="monospace" text-anchor="middle" fill="currentColor">100%</text>
          </svg>
          <div class="ai-badge-text">
            <strong>No AI Content Policy</strong>
            <p>This website is crafted entirely from scratch. Every sentence is written directly by human hands, word by word.</p>
          </div>
        </div>
      </div>
    </footer>
  </div>

  <script>
    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    // Tag filtering logic
    function filterPosts(tag) {
      const posts = document.querySelectorAll('.post-item');
      const activeTags = document.querySelectorAll('.filter-tag');
      
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
  </script>
</body>
</html>
```

- [ ] **Step 4: Commit**
```bash
git add src/templates/style.css src/templates/base.html src/templates/home.html
git commit -m "style & markup: implement layout templates and css design system"
```

---

### Task 4: Custom Node.js Static Builder Script

**Files:**
- Create: `src/build.js`

**Interfaces:**
- Consumes: Raw Markdown files in `content/`
- Produces: Compiled HTML files and stylesheet output in `/dist` folder.

- [ ] **Step 1: Write builder code in src/build.js**
```javascript
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { parseFrontmatter, calculateReadingTime, slugify } from './helpers.js';

const CONTENT_DIR = path.resolve('content');
const DIST_DIR = path.resolve('dist');
const TEMPLATES_DIR = path.resolve('src/templates');

// Ensure output directories exist
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);
if (!fs.existsSync(path.join(DIST_DIR, 'posts'))) fs.mkdirSync(path.join(DIST_DIR, 'posts'));

// Copy CSS to dist
const css = fs.readFileSync(path.join(TEMPLATES_DIR, 'style.css'), 'utf-8');
fs.writeFileSync(path.join(DIST_DIR, 'style.css'), css);

// Read templates
const baseTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'base.html'), 'utf-8');
const homeTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'home.html'), 'utf-8');

// Recursively find markdown files
function getMarkdownFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

const mdFiles = getMarkdownFiles(CONTENT_DIR);
const posts = [];

// Parse and prepare posts data
for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const { metadata, body } = parseFrontmatter(content);
  
  if (!metadata.title) continue;
  
  const category = metadata.category || 'General';
  const categorySlug = slugify(category);
  const postSlug = slugify(metadata.title);
  const relativePostPath = `posts/${categorySlug}/${postSlug}.html`;
  
  posts.push({
    title: metadata.title,
    date: metadata.date || '2026-06-28',
    category,
    categorySlug,
    tags: metadata.tags || [],
    excerpt: metadata.excerpt || '',
    readingTime: calculateReadingTime(body),
    bodyHtml: marked(body),
    slug: postSlug,
    relativePath: relativePostPath
  });
}

// Sort posts chronologically (newest first)
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Build sidebar structure
let sidebarHtml = '';
const postsByCategory = {};
posts.forEach(post => {
  if (!postsByCategory[post.category]) {
    postsByCategory[post.category] = [];
  }
  postsByCategory[post.category].push(post);
});

for (const [category, catPosts] of Object.entries(postsByCategory)) {
  sidebarHtml += `<div class="sidebar-category">`;
  sidebarHtml += `  <div class="sidebar-category-title">${category}</div>`;
  sidebarHtml += `  <ul class="sidebar-links">`;
  catPosts.forEach(post => {
    sidebarHtml += `    <li><a href="{{RELATIVE_PATH}}${post.relativePath}">${post.title}</a></li>`;
  });
  sidebarHtml += `  </ul>`;
  sidebarHtml += `</div>`;
}

// Compile post pages
posts.forEach(post => {
  const categoryDistDir = path.join(DIST_DIR, 'posts', post.categorySlug);
  if (!fs.existsSync(categoryDistDir)) {
    fs.mkdirSync(categoryDistDir, { recursive: true });
  }
  
  // Replace placeholders in templates
  let html = baseTemplate
    .replace(/\{\{TITLE\}\}/g, post.title)
    .replace(/\{\{CONTENT\}\}/g, post.bodyHtml)
    .replace(/\{\{SIDEBAR\}\}/g, sidebarHtml.replace(/\{\{RELATIVE_PATH\}\}/g, '../../'))
    .replace(/\{\{RELATIVE_PATH\}\}/g, '../../');
    
  fs.writeFileSync(path.join(DIST_DIR, post.relativePath), html);
});

// Compile homepage index.html
let postsListHtml = '';
const allTags = new Set();

posts.forEach(post => {
  post.tags.forEach(t => allTags.add(t));
  
  const tagsListHtml = post.tags.map(t => `<span class="post-tag" onclick="filterPosts('${t}')">#${t}</span>`).join(' ');
  
  postsListHtml += `
    <div class="post-item" data-category="${post.categorySlug}" data-tags='${JSON.stringify(post.tags)}'>
      <h3 class="post-title"><a href="${post.relativePath}">${post.title}</a></h3>
      <div class="post-meta">
        <span class="post-category-badge" onclick="filterPosts('${post.categorySlug}')">${post.category}</span>
        <span>${post.date}</span>
        <span>•</span>
        <span>${post.readingTime}</span>
      </div>
      <p class="post-excerpt">${post.excerpt}</p>
      <div class="post-tags-list">
        ${tagsListHtml}
      </div>
    </div>
  `;
});

let tagsCloudHtml = '';
allTags.forEach(tag => {
  tagsCloudHtml += `<button class="filter-tag" data-tag="${tag}" onclick="filterPosts('${tag}')">${tag}</button> `;
});

// Also include categories in tag cloud
Object.keys(postsByCategory).forEach(cat => {
  const catSlug = slugify(cat);
  tagsCloudHtml += `<button class="filter-tag" data-tag="${catSlug}" onclick="filterPosts('${catSlug}')">${cat}</button> `;
});

const homepageHtml = homeTemplate
  .replace(/\{\{TAGS\}\}/g, tagsCloudHtml)
  .replace(/\{\{POSTS\}\}/g, postsListHtml);

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homepageHtml);
console.log(`Compilation complete. Output generated under /dist folder.`);
```

- [ ] **Step 2: Commit**
```bash
git add src/build.js
git commit -m "feat: implement main compilation engine to generate static HTML pages"
```

---

### Task 5: Sample Contents for Verification

**Files:**
- Create: `content/life/on-walking.md`
- Create: `content/software-engineering/clean-architecture.md`

**Interfaces:**
- Produces: Test markdown files to verify layout formatting and compiler accuracy.

- [ ] **Step 1: Create content/life/on-walking.md**
```markdown
---
title: On the Art of Walking
category: Life
tags: [life, reflection, habits]
excerpt: Reflecting on why walking is the single greatest intellectual and physical habit.
date: 2026-06-28
---

Walking is not just about moving from point A to point B. It is an exploration of thought.

### Why Walk?

1. **Uninterrupted Thinking**: Away from the screen, thoughts settle.
2. **Physical Cadence**: The steady beat of footsteps drives mental rhythm.

> "All truly great thoughts are conceived while walking." — Friedrich Nietzsche

#### A Simple Routine
Try walking 30 minutes in the morning without your phone. Just look around.
```

- [ ] **Step 2: Create content/software-engineering/clean-architecture.md**
```markdown
---
title: Understanding Clean Architecture
category: Software Engineering
tags: [software-engineering, architecture, principles]
excerpt: An explanation of separating concerns and dependencies in system designs.
date: 2026-06-27
---

Clean architecture is about keeping options open and making code testable.

### The Dependency Rule

Dependencies must only point **inwards** toward the core business logic.

* **Entities**: Core business models.
* **Use Cases**: Application-specific rules.
* **Controllers/Gateways**: Translation layers.
* **UI/Devices**: External systems (frameworks, database).

```javascript
// Example of dependency direction
import { UserEntity } from '../entities/user.js';

export class RegisterUserUseCase {
  execute(userData) {
    return new UserEntity(userData);
  }
}
```
```

- [ ] **Step 3: Run build process locally**
Run: `npm run build`
Expected: Output generated successfully. `/dist` directory contains:
- `dist/index.html`
- `dist/style.css`
- `dist/posts/life/on-the-art-of-walking.html`
- `dist/posts/software-engineering/understanding-clean-architecture.html`

- [ ] **Step 4: Commit**
```bash
git add content/life/on-walking.md content/software-engineering/clean-architecture.md
git commit -m "content: add sample markdown files to verify static rendering"
```

---

### Task 6: GitHub Actions CI/CD Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: Production deployment configuration triggered on branch push.

- [ ] **Step 1: Create deploy workflow file**
Create `.github/workflows/deploy.yml`:
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

- [ ] **Step 2: Commit**
```bash
git add .github/workflows/deploy.yml
git commit -m "ci: set up Github Actions deployment workflow to Github Pages"
```
