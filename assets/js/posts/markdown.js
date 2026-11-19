function appendInline(parent, text) {
  const pattern = /(!?\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)|\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*([^*\n]+)\*(?!\*)|_([^_\n]+)_|`([^`]+)`|<br\s*\/?>)/g;
  let position = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > position) parent.append(document.createTextNode(text.slice(position, start)));

    const [token, , label, url, bold, boldAlt, italic, italicAlt, code] = match;
    if (token.startsWith("![") && url) {
      const image = document.createElement("img");
      image.src = url;
      image.alt = label;
      image.loading = "lazy";
      parent.append(image);
    } else if (token.startsWith("[") && url) {
      const link = document.createElement("a");
      link.href = url;
      link.textContent = label;
      link.rel = "noopener noreferrer";
      parent.append(link);
    } else if (bold || boldAlt) {
      const strong = document.createElement("strong");
      strong.textContent = bold || boldAlt;
      parent.append(strong);
    } else if (italic || italicAlt) {
      const emphasis = document.createElement("em");
      emphasis.textContent = italic || italicAlt;
      parent.append(emphasis);
    } else if (code) {
      const inlineCode = document.createElement("code");
      inlineCode.textContent = code;
      parent.append(inlineCode);
    } else {
      parent.append(document.createElement("br"));
    }
    position = start + token.length;
  }

  if (position < text.length) parent.append(document.createTextNode(text.slice(position)));
}

export function renderMarkdown(markdown) {
  const root = document.createDocumentFragment();
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const first = lines[index].trim();
    if (!first) {
      index += 1;
      continue;
    }

    if (/^```/.test(first)) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      root.append(pre);
      continue;
    }

    const heading = first.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const element = document.createElement(`h${heading[1].length + 1}`);
      appendInline(element, heading[2]);
      root.append(element);
      index += 1;
      continue;
    }

    if (/^(---+|\*\*\*+)$/.test(first)) {
      root.append(document.createElement("hr"));
      index += 1;
      continue;
    }

    if (/^>\s?/.test(first)) {
      const quote = document.createElement("blockquote");
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        const paragraph = document.createElement("p");
        appendInline(paragraph, lines[index].trim().replace(/^>\s?/, ""));
        quote.append(paragraph);
        index += 1;
      }
      root.append(quote);
      continue;
    }

    const item = first.match(/^([-*+]|\d+\.)\s+(.+)$/);
    if (item) {
      const ordered = /\d/.test(item[1]);
      const list = document.createElement(ordered ? "ol" : "ul");
      while (index < lines.length) {
        const next = lines[index].trim().match(/^([-*+]|\d+\.)\s+(.+)$/);
        if (!next || /\d/.test(next[1]) !== ordered) break;
        const listItem = document.createElement("li");
        appendInline(listItem, next[2]);
        list.append(listItem);
        index += 1;
      }
      root.append(list);
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && lines[index].trim()) {
      const line = lines[index].trim();
      if (
        /^```/.test(line) ||
        /^#{1,4}\s/.test(line) ||
        /^(---+|\*\*\*+)$/.test(line) ||
        /^>\s?/.test(line) ||
        /^([-*+]|\d+\.)\s+/.test(line)
      ) {
        break;
      }
      paragraphLines.push(line);
      index += 1;
    }
    if (paragraphLines.length) {
      const paragraph = document.createElement("p");
      appendInline(paragraph, paragraphLines.join(" "));
      root.append(paragraph);
    } else {
      index += 1;
    }
  }
  return root;
}

export function plainText(markdown) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#~-]/g, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
