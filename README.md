# Zunalita

A lightweight, mostly native-HTML journal for GitHub Pages. The small stylesheet is in `assets/css/`; page scripts and post utilities are separated under `assets/js/`. There is no build step, package installation, backend, or API key.

## Publishing

Publish the repository root with GitHub Pages. On the home page, the site makes one request to GitHub's Contents API to get the Markdown filenames in [`zunalita/posts`](https://github.com/zunalita/posts). It does not fetch story bodies for the list. The Markdown body is requested from `raw.githubusercontent.com` only when a reader opens that story.

Stories open as individual pages at `/post/?file=<filename>`, rather than in an overlay. Since the listing endpoint returns names rather than frontmatter, the home page derives its title and date from each filename. The article page reads `title`, `author`, `date`, and `category` from the post's frontmatter and offers reading-time, text-size, read-aloud, and sharing controls.

## Writing

The `/create/` editor previews Markdown in the browser, saves drafts locally, and downloads a ready-to-submit `.md` file. Contributors can add that file to the archive's `posts/` directory and open a pull request. The static site never asks for or stores GitHub credentials.

## Other pages

- `/about/` explains the project, contribution path, and data stored locally.
- `/saved/` is a browser-only reading list. It stores post filenames in `localStorage` and makes no GitHub request.

The site search filters story titles from the filename list. Each full post is fetched only after its link is opened.
