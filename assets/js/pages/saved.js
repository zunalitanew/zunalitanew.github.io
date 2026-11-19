import { formatDate, titleFromFilename } from "../posts/archive.js";
import {
  clearSavedPosts,
  getSavedPosts,
  removeSavedPost,
} from "../posts/reading-list.js";

const list = document.querySelector("#saved-list");
const status = document.querySelector("#status");
const empty = document.querySelector("#empty");
const clearButton = document.querySelector("#clear-list");

function render() {
  list.replaceChildren();
  clearButton.hidden = true;
  let saved;
  try {
    saved = getSavedPosts();
  } catch (error) {
    status.textContent = error.message;
    empty.hidden = true;
    clearButton.hidden = false;
    return;
  }

  empty.hidden = saved.length > 0;
  clearButton.hidden = saved.length === 0;
  status.textContent = `${saved.length} saved ${saved.length === 1 ? "story" : "stories"}`;

  for (const filename of saved.sort((left, right) => right.localeCompare(left))) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const date = document.createElement("span");
    const remove = document.createElement("button");
    const url = new URL("../post/", window.location.href);

    url.searchParams.set("file", filename);
    link.href = url.href;
    link.textContent = titleFromFilename(filename);
    date.className = "story-meta";
    date.textContent = ` — ${formatDate(filename.slice(0, 10))} `;
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${link.textContent} from your reading list`);
    remove.addEventListener("click", () => {
      try {
        removeSavedPost(filename);
        render();
      } catch (error) {
        status.textContent = error.message;
      }
    });

    item.append(link, date, remove);
    list.append(item);
  }
}

clearButton.addEventListener("click", () => {
  try {
    clearSavedPosts();
    render();
  } catch (error) {
    status.textContent = error.message;
  }
});

render();
