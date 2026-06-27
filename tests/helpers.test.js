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

test('parseFrontmatter returns empty metadata when no frontmatter exists', () => {
  const content = 'Just plain content without frontmatter.';
  const { metadata, body } = parseFrontmatter(content);
  assert.deepStrictEqual(metadata, {});
  assert.strictEqual(body, content);
});

test('parseFrontmatter handles metadata values containing colons', () => {
  const content = `---\nurl: https://example.com\n---\n`;
  const { metadata } = parseFrontmatter(content);
  assert.strictEqual(metadata.url, 'https://example.com');
});

test('parseFrontmatter handles frontmatter with no body and no trailing newline after ---', () => {
  const content = `---\ntitle: No Body\n---`;
  const { metadata, body } = parseFrontmatter(content);
  assert.strictEqual(metadata.title, 'No Body');
  assert.strictEqual(body, '');
});

test('calculateReadingTime handles empty or whitespace-only text', () => {
  assert.strictEqual(calculateReadingTime(''), '0 min read');
  assert.strictEqual(calculateReadingTime('   '), '0 min read');
});

test('slugify handles special characters and emojis correctly', () => {
  assert.strictEqual(slugify('!!! Hello World !!!'), 'hello-world');
  assert.strictEqual(slugify('Hello, World! ⚡️'), 'hello-world');
});


