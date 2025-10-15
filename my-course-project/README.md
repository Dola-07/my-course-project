Course project — dynamic file list styling

Overview

This project serves course files and includes a dynamic CSS helper that converts plain file entries into a compact card layout on demand.

Files added/changed

- `dynamic-style.js` — script that converts existing file divs into `.file-item` compact cards and provides a toggle button.
- `course.html` — includes a "Compact view" toggle and loads `dynamic-style.js`.
- `style.css` — contains styles for `.file-item`, `.file-icon`, `.file-name`, `.file-size`, and hover effects.

How to use

1. Start your server that hosts the course files (default server in repo listens on port 3000):

```cmd
cd /d e:\Notes\my-course-project
npm install
npm start
```

2. Open a course page (example):

```
http://localhost:3000/course.html?course=CourseName
```

3. Click the "Compact view" button to enable the compact layout. Click again to return to normal view.

Notes

- The script tries to detect file title, link and size from DOM or `data-*` attributes. If your server provides `data-title`, `data-url`, and `data-size` on each file entry, the conversion will be more accurate.
- Toggling off reloads the page to restore original markup. If you need a non-reload revert, I can implement a smarter restore mechanism.

Next improvements

- Patch `index.html` and `admin.html` to include the toggle and unify styling.
- Add responsive behavior to show `.file-desc` on large screens only.
- Add an optional non-reload revert for toggle-off.
