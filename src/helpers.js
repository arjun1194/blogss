export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n([\s\S]*))?$/);
  if (!match) return { metadata: {}, body: content };
  
  const yaml = match[1];
  const body = match[2] || '';
  const metadata = {};
  
  yaml.split('\n').forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
      if (val.startsWith('[') && val.endsWith(']')) {
        const contentInside = val.slice(1, -1).trim();
        metadata[key] = contentInside ? contentInside.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
      } else {
        metadata[key] = val;
      }
    }
  });
  return { metadata, body };
}

export function calculateReadingTime(text) {
  const trimmed = text.trim();
  if (!trimmed) return '0 min read';
  const words = trimmed.split(/\s+/).length;
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
