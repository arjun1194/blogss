import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { parseFrontmatter, calculateReadingTime, slugify, escapeHtml } from './helpers.js';

const CONTENT_DIR = process.env.CONTENT_DIR ? path.resolve(process.env.CONTENT_DIR) : path.resolve('content');
const DIST_DIR = process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.resolve('dist');
const TEMPLATES_DIR = process.env.TEMPLATES_DIR ? path.resolve(process.env.TEMPLATES_DIR) : path.resolve('src/templates');

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
    date: metadata.date || new Date().toISOString().split('T')[0],
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
posts.sort((a, b) => b.date.localeCompare(a.date));

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
  sidebarHtml += `  <div class="sidebar-category-title">${escapeHtml(category)}</div>`;
  sidebarHtml += `  <ul class="sidebar-links">`;
  catPosts.forEach(post => {
    sidebarHtml += `    <li><a href="{{RELATIVE_PATH}}${post.relativePath}">${escapeHtml(post.title)}</a></li>`;
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
  
  // Replace placeholders in templates with corrected order:
  // 1. {{RELATIVE_PATH}} first
  // 2. {{TITLE}} and {{SIDEBAR}} next
  // 3. {{CONTENT}} last
  const relativePath = '../../';
  let html = baseTemplate.replace(/\{\{RELATIVE_PATH\}\}/g, () => relativePath);
  const sidebar = sidebarHtml.replace(/\{\{RELATIVE_PATH\}\}/g, () => relativePath);
  
  html = html
    .replace(/\{\{TITLE\}\}/g, () => escapeHtml(post.title))
    .replace(/\{\{SIDEBAR\}\}/g, () => sidebar)
    .replace(/\{\{CONTENT\}\}/g, () => post.bodyHtml);
    
  fs.writeFileSync(path.join(DIST_DIR, post.relativePath), html);
});

// Compile homepage index.html
let postsListHtml = '';
const allTags = new Set();

posts.forEach(post => {
  post.tags.forEach(t => allTags.add(t));
  
  const tagsListHtml = post.tags.map(t => `<span class="post-tag" onclick="filterPosts('${slugify(t)}')">#${escapeHtml(t)}</span>`).join(' ');
  
  postsListHtml += `
    <div class="post-item" data-category="${post.categorySlug}" data-tags="${JSON.stringify(post.tags).replace(/"/g, '&quot;')}">
      <h3 class="post-title"><a href="${post.relativePath}">${escapeHtml(post.title)}</a></h3>
      <div class="post-meta">
        <span class="post-category-badge" onclick="filterPosts('${post.categorySlug}')">${escapeHtml(post.category)}</span>
        <span>${post.date}</span>
        <span>•</span>
        <span>${post.readingTime}</span>
      </div>
      <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
      <div class="post-tags-list">
        ${tagsListHtml}
      </div>
    </div>
  `;
});

const seenSlugs = new Set();
let tagsCloudHtml = '';

// Render tags
allTags.forEach(tag => {
  const slug = slugify(tag);
  if (!seenSlugs.has(slug)) {
    seenSlugs.add(slug);
    tagsCloudHtml += `<button class="filter-tag" data-tag="${slug}" onclick="filterPosts('${slug}')">${escapeHtml(tag)}</button> `;
  }
});

// Render categories
Object.keys(postsByCategory).forEach(cat => {
  const slug = slugify(cat);
  if (!seenSlugs.has(slug)) {
    seenSlugs.add(slug);
    tagsCloudHtml += `<button class="filter-tag" data-tag="${slug}" onclick="filterPosts('${slug}')">${escapeHtml(cat)}</button> `;
  }
});

const homepageHtml = homeTemplate
  .replace(/\{\{TAGS\}\}/g, () => tagsCloudHtml)
  .replace(/\{\{POSTS\}\}/g, () => postsListHtml);

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homepageHtml);
console.log(`Compilation complete. Output generated under /dist folder.`);
