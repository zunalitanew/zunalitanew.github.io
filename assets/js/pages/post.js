import { fetchPost, formatDate, parsePost } from "../posts/archive.js";
import { plainText, renderMarkdown } from "../posts/markdown.js";
import { getSavedPosts, toggleSavedPost } from "../posts/reading-list.js";

const status = document.querySelector("#status");
const story = document.querySelector("#story");
const body = document.querySelector("#body");
const filename = new URLSearchParams(window.location.search).get("file");
const FONT_SIZE_KEY = "zunalita-font-size";
let speaking = false;

function readingTime(text) {
  const words = plainText(text).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function display(post) {
  document.title = `${post.title} — Zunalita`;
  document.querySelector("#category").textContent = post.category;
  document.querySelector("#title").textContent = post.title;
  document.querySelector("#summary").textContent = plainText(post.body).slice(0, 220);

  const byline = document.querySelector("#byline");
  byline.textContent = `By ${post.author} · ${formatDate(post.date)} · ${readingTime(post.body)}`;
  body.replaceChildren(renderMarkdown(post.body));

  const source = document.querySelector("#source");
  source.href = `https://github.com/zunalita/posts/blob/main/posts/${encodeURIComponent(post.filename)}`;
  updateSaveButton();
  restoreTextSize();
  status.hidden = true;
  story.hidden = false;
}

function updateSaveButton() {
  const button = document.querySelector("#save-story");
  try {
    const saved = getSavedPosts().includes(filename);
    button.textContent = saved ? "Remove from reading list" : "Save for later";
    button.setAttribute("aria-pressed", String(saved));
  } catch (error) {
    button.disabled = true;
    document.querySelector("#reading-status").textContent = error.message;
  }
}

function restoreTextSize() {
  try {
    const saved = Number(localStorage.getItem(FONT_SIZE_KEY));
    if (saved >= 15 && saved <= 28) body.style.fontSize = `${saved}px`;
  } catch (error) {
    document.querySelector("#reading-status").textContent =
      `Couldn't restore text size: ${error.message}`;
  }
}

function changeTextSize(change) {
  const current = Number.parseFloat(getComputedStyle(body).fontSize) || 16;
  const size = Math.min(28, Math.max(15, current + change));
  body.style.fontSize = `${size}px`;
  try {
    localStorage.setItem(FONT_SIZE_KEY, String(size));
  } catch (error) {
    document.querySelector("#reading-status").textContent =
      `Text size changed, but couldn't be saved: ${error.message}`;
  }
}

async function loadStory() {
  if (!filename) {
    status.textContent = "Choose a story from the journal to read it here.";
    return;
  }

  try {
    status.textContent = "Loading story…";
    display(parsePost(filename, await fetchPost(filename)));
  } catch (error) {
    status.textContent = `This story couldn't be loaded. ${error.message}`;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Try again";
    retry.addEventListener("click", loadStory);
    status.append(" ", retry);
  }
}

document.querySelector("#smaller").addEventListener("click", () => changeTextSize(-2));
document.querySelector("#larger").addEventListener("click", () => changeTextSize(2));
document.querySelector("#save-story").addEventListener("click", () => {
  try {
    const saved = toggleSavedPost(filename);
    updateSaveButton();
    document.querySelector("#reading-status").textContent =
      saved ? "Saved in this browser." : "Removed from your reading list.";
  } catch (error) {
    document.querySelector("#reading-status").textContent = error.message;
  }
});
document.querySelector("#listen").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const message = document.querySelector("#reading-status");
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    message.textContent = "Read-aloud isn't available in this browser.";
    return;
  }
  if (speaking) {
    window.speechSynthesis.cancel();
    speaking = false;
    button.textContent = "Listen";
    button.setAttribute("aria-pressed", "false");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(body.textContent);
  utterance.lang = document.documentElement.lang || "en";
  utterance.onend = () => {
    speaking = false;
    button.textContent = "Listen";
    button.setAttribute("aria-pressed", "false");
  };
  window.speechSynthesis.speak(utterance);
  speaking = true;
  button.textContent = "Stop";
  button.setAttribute("aria-pressed", "true");
  message.textContent = "";
});

document.querySelector("#share").addEventListener("click", async () => {
  const message = document.querySelector("#reading-status");
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url: window.location.href });
      message.textContent = "Thanks for sharing.";
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      message.textContent = "Link copied.";
    } else {
      message.textContent = "Copy the story URL from your browser.";
    }
  } catch (error) {
    if (error.name !== "AbortError") message.textContent = "Couldn't share this story.";
  }
});

window.addEventListener("beforeunload", () => {
  if (speaking) window.speechSynthesis.cancel();
});

loadStory();
