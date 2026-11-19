import { listPosts, formatDate } from "../posts/archive.js";

const list = document.querySelector("#story-list");
const status = document.querySelector("#status");
const search = document.querySelector("#search");
const empty = document.querySelector("#empty");
const emptyMessage = document.querySelector("#empty-message");
let posts = [];
let loaded = false;

function render() {
  if (!loaded) return;
  const query = search.value.trim().toLowerCase();
  list.replaceChildren();
  let visible = 0;

  for (const post of posts) {
    if (!post.title.toLowerCase().includes(query)) continue;
    const item = document.createElement("li");
    const link = document.createElement("a");
    const date = document.createElement("time");
    const url = new URL("post/", window.location.href);

    url.searchParams.set("file", post.filename);
    link.href = url.href;
    link.textContent = post.title;
    date.dateTime = post.date;
    date.className = "story-meta";
    date.textContent = ` — ${formatDate(post.date)}`;
    item.append(link, date);
    list.append(item);
    visible += 1;
  }

  empty.hidden = visible > 0;
  emptyMessage.textContent = posts.length
    ? "No story matches that search."
    : "No stories have been published yet.";
  document.querySelector("#clear-search").hidden = !posts.length;
  status.textContent = `${visible} ${visible === 1 ? "story" : "stories"}`;
}

async function loadNames() {
  status.textContent = "Loading story titles…";
  try {
    posts = await listPosts();
    loaded = true;
    render();
  } catch (error) {
    status.textContent = `The story list couldn't be loaded. ${error.message}`;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "Try again";
    retry.addEventListener("click", loadNames);
    status.append(" ", retry);
  }
}

search.addEventListener("input", render);
document.querySelector("#clear-search").addEventListener("click", () => {
  search.value = "";
  render();
  search.focus();
});
loadNames();
