import { renderMarkdown } from "../posts/markdown.js";

const STORAGE_KEY = "zunalita-editor-draft-v1";
const fields = {
  title: document.querySelector("#title"),
  author: document.querySelector("#author"),
  category: document.querySelector("#category"),
  tags: document.querySelector("#tags"),
  content: document.querySelector("#content"),
};
const status = document.querySelector("#draft-status");
const download = document.querySelector("#download");

function draftValues() {
  return Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.value]),
  );
}

function updatePreview() {
  const title = fields.title.value.trim();
  const content = fields.content.value;
  document.querySelector("#preview-title").textContent = title || "Your title";
  document.querySelector("#preview-byline").textContent =
    fields.author.value.trim() || "By you";
  document.querySelector("#preview-body").replaceChildren(renderMarkdown(content));
  document.querySelector("#count").textContent = `${content.length} / 300 characters`;
  download.disabled = title.length < 1 || content.trim().length < 300;
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftValues()));
    status.textContent = "Draft saved in this browser.";
  } catch (error) {
    status.textContent = `Couldn't save this draft: ${error.message}`;
  }
}

function restoreDraft() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const draft = JSON.parse(saved);
    for (const [name, field] of Object.entries(fields)) {
      if (typeof draft[name] === "string") field.value = draft[name];
    }
    status.textContent = "Your saved draft has been restored.";
  } catch (error) {
    status.textContent = `Couldn't restore this draft: ${error.message}`;
  }
}

function quote(value) {
  return JSON.stringify(value);
}

function downloadStory() {
  const draft = draftValues();
  const tags = draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  const date = new Date().toISOString();
  const slug = draft.title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${date.slice(0, 10)}-${slug || "untitled"}.md`;
  const markdown = [
    "---",
    `title: ${quote(draft.title.trim())}`,
    `author: ${quote(draft.author.trim() || "Anonymous")}`,
    `date: ${quote(date)}`,
    `category: ${quote(draft.category.trim() || "Essay")}`,
    `tags: [${tags.map(quote).join(", ")}]`,
    "---",
    "",
    draft.content.trim(),
    "",
  ].join("\n");
  const file = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = "Markdown downloaded. Your local draft is still saved.";
}

for (const field of Object.values(fields)) {
  field.addEventListener("input", () => {
    updatePreview();
    saveDraft();
  });
}

document.querySelector("#editor").addEventListener("submit", (event) => {
  event.preventDefault();
});

document.querySelector("#clear").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    for (const field of Object.values(fields)) field.value = "";
    updatePreview();
    status.textContent = "Draft cleared from this browser.";
  } catch (error) {
    status.textContent = `Couldn't clear the saved draft: ${error.message}`;
  }
});

download.addEventListener("click", downloadStory);
restoreDraft();
updatePreview();
