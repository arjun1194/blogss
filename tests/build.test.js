import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

test('build script compiles posts correctly, sorting by date and avoiding injection bugs', () => {
  const contentDir = path.resolve('content');
  const distDir = path.resolve('dist');

  // Ensure clean setup
  if (fs.existsSync(contentDir)) {
    fs.rmSync(contentDir, { recursive: true, force: true });
  }
  fs.mkdirSync(contentDir);

  // Write some mock posts
  // Post 1: date 2026-06-25, contains $& in content
  const post1Content = `---
title: Post One
date: 2026-06-25
category: Tech
tags: [js]
excerpt: Excerpt one
---
Code containing replacement patterns: $& and $1.`;

  // Post 2: date 2026-06-28
  const post2Content = `---
title: Post Two
date: 2026-06-28
category: Tech
tags: [js]
excerpt: Excerpt two
---
Regular body.`;

  fs.mkdirSync(path.join(contentDir, 'tech'), { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'tech', 'post-one.md'), post1Content);
  fs.writeFileSync(path.join(contentDir, 'tech', 'post-two.md'), post2Content);

  try {
    // Run the build script
    execSync('node src/build.js');

    // 1. Verify files are created
    const postOneHtmlPath = path.join(distDir, 'posts', 'tech', 'post-one.html');
    const postTwoHtmlPath = path.join(distDir, 'posts', 'tech', 'post-two.html');
    const indexHtmlPath = path.join(distDir, 'index.html');

    assert.ok(fs.existsSync(postOneHtmlPath), 'post-one.html should exist');
    assert.ok(fs.existsSync(postTwoHtmlPath), 'post-two.html should exist');
    assert.ok(fs.existsSync(indexHtmlPath), 'index.html should exist');

    // 2. Verify replacement pattern injection bug is fixed ($& is not expanded to matching pattern/placeholder)
    const postOneHtmlContent = fs.readFileSync(postOneHtmlPath, 'utf-8');
    assert.ok(postOneHtmlContent.includes('$&amp; and $1'), 'Should preserve special pattern sequences without injection bugs');

    // 3. Verify ordering in index.html (newest first, so Post Two should come before Post One)
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const indexPostTwo = indexHtmlContent.indexOf('Post Two');
    const indexPostOne = indexHtmlContent.indexOf('Post One');
    assert.ok(indexPostTwo !== -1 && indexPostOne !== -1, 'Both posts should be in the homepage');
    assert.ok(indexPostTwo < indexPostOne, 'Post Two (2026-06-28) should be before Post One (2026-06-25)');

  } finally {
    // Clean up content folder and dist folder to keep git workspace clean
    if (fs.existsSync(contentDir)) {
      fs.rmSync(contentDir, { recursive: true, force: true });
    }
    // Re-run build to clear the generated files or just let it be
    execSync('node src/build.js');
  }
});
