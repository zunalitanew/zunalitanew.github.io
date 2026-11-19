const REPOSITORY = "zunalita/posts";
const LIST_URL = `https://api.github.com/repos/${REPOSITORY}/contents/posts?ref=main`;
const RAW_URL = `https://raw.githubusercontent.com/${REPOSITORY}/main/posts/`;
const POST_FILE_PATTERN = /^\d{4}-\d{2}-\d{2}-[a-z\d-]+\.md$/i;

export function isPostFilename(filename) {
  return POST_FILE_PATTERN.test(filename);
}

export async function listPosts() {
  const response = await fetch(LIST_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);

  const files = await response.json();
  return files
    .filter((file) => file.type === "file" && isPostFilename(file.name))
    .map((file) => ({
      filename: file.name,
      date: file.name.slice(0, 10),
      title: titleFromFilename(file.name),
    }))
    .sort((left, right) => right.filename.localeCompare(left.filename));
}

export async function fetchPost(filename) {
  if (!isPostFilename(filename)) throw new Error("That story name is not valid.");
  const response = await fetch(`${RAW_URL}${encodeURIComponent(filename)}`);
  if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);
  return response.text();
}

export function parsePost(filename, markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const metadata = {};
  let body = markdown;

  if (match) {
    for (const line of match[1].split("\n")) {
      const field = line.match(/^([a-zA-Z_]+):\s*(.*?)\s*$/);
      if (!field) continue;

      let value = field[2];
      if (value.startsWith('"') && value.endsWith('"')) {
        try {
          value = JSON.parse(value);
        } catch {
          value = value.slice(1, -1);
        }
      } else {
        value = value.replace(/^['"]|['"]$/g, "");
      }
      metadata[field[1]] = value;
    }
    body = markdown.slice(match[0].length);
  }

  return {
    filename,
    title: metadata.title || titleFromFilename(filename),
    author: metadata.author || "Zunalita community",
    category: metadata.category || "Notes",
    date: metadata.date || filename.slice(0, 10),
    body,
  };
}

export function titleFromFilename(filename) {
  return filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/\.md$/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
