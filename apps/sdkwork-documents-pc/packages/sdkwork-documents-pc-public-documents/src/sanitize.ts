const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DD', 'DIV', 'DL', 'DT', 'EM', 'H1', 'H2', 'H3', 'H4',
  'HR', 'I', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'TABLE', 'TBODY', 'TD', 'TH', 'THEAD',
  'TR', 'U', 'UL',
]);

const ALLOWED_ATTRIBUTES: Record<string, readonly string[]> = {
  A: ['href', 'title'],
  TD: ['colspan', 'rowspan'],
  TH: ['colspan', 'rowspan', 'scope'],
};

function safeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed, 'https://sdkwork.invalid');
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

function sanitizeElement(element: Element): void {
  for (const child of Array.from(element.children)) {
    if (!ALLOWED_TAGS.has(child.tagName)) {
      child.remove();
      continue;
    }
    for (const attribute of Array.from(child.attributes)) {
      const allowed = ALLOWED_ATTRIBUTES[child.tagName] ?? [];
      if (!allowed.includes(attribute.name.toLowerCase())) {
        child.removeAttribute(attribute.name);
        continue;
      }
      if (attribute.name.toLowerCase() === 'href') {
        const safe = safeUrl(attribute.value);
        if (safe) {
          child.setAttribute('href', safe);
          if (safe.startsWith('http')) {
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noreferrer noopener');
          }
        } else {
          child.removeAttribute('href');
        }
      }
    }
    sanitizeElement(child);
  }
}

/**
 * Sanitizes authored rich-text HTML before it is injected into the public
 * article. The allowlist keeps document semantics only and drops scripts,
 * event handlers, iframes, styles, and non-http(s) URLs.
 */
export function sanitizeDocumentHtml(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  sanitizeElement(parsed.body);
  return parsed.body.innerHTML;
}
