// dynamic-style.js
// Adds compact .file-item structure to existing file list entries and provides a toggle.

(function () {
  const listId = 'fileList';
  const toggleId = 'toggleCompact';
  let compact = false;
  // cache original nodes to allow non-reload revert
  const originalNodes = new Map();

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${Math.round(bytes * 10) / 10} ${units[i]}`;
  }

  // Convert an existing file div created by displayFiles into .file-item structure
  function convertDiv(oldDiv, fileObj) {
    // If already converted, skip
    if (oldDiv.classList && oldDiv.classList.contains('file-item')) return oldDiv;

    // cache original HTML so we can revert later
    if (!originalNodes.has(oldDiv)) {
      originalNodes.set(oldDiv, oldDiv.cloneNode(true));
    }

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const icon = document.createElement('div');
    icon.className = 'file-icon';
    // show first 3 letters of extension or generic
    const ext = (fileObj && fileObj.url) ? (fileObj.url.split('.').pop().slice(0,3).toUpperCase()) : (oldDiv.dataset && oldDiv.dataset.url ? (oldDiv.dataset.url.split('.').pop().slice(0,3).toUpperCase()) : 'F');
    icon.textContent = ext;

    const meta = document.createElement('div');
    meta.className = 'file-meta';
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = fileObj && fileObj.title ? fileObj.title : (oldDiv.querySelector('h4') ? oldDiv.querySelector('h4').innerText : (oldDiv.querySelector('b') ? oldDiv.querySelector('b').innerText : 'File'));

    meta.appendChild(name);

    const size = document.createElement('div');
    size.className = 'file-size';
    // attempt to read data-size attribute if available (server can provide)
    const rawSize = fileObj && fileObj.size ? fileObj.size : (oldDiv.getAttribute('data-size') || oldDiv.dataset && oldDiv.dataset.size);
    size.textContent = rawSize ? formatSize(Number(rawSize)) : '';

    fileItem.appendChild(icon);
    fileItem.appendChild(meta);
    fileItem.appendChild(size);

    // Copy the click / link behavior from oldDiv
    const link = oldDiv.querySelector('a') || oldDiv.querySelector('iframe') || oldDiv.querySelector('img');
    if (link && link.tagName === 'A') {
      fileItem.style.cursor = 'pointer';
      fileItem.addEventListener('click', () => window.open(link.href, '_blank'));
    } else if (link && (link.tagName === 'IFRAME' || link.tagName === 'IMG')) {
      const src = link.src || link.getAttribute('src');
      if (src) fileItem.addEventListener('click', () => window.open(src, '_blank'));
    } else {
      // If div contains a bold title with a following link (admin), try to find the first anchor
      const anyAnchor = oldDiv.querySelector('a');
      if (anyAnchor) fileItem.addEventListener('click', () => window.open(anyAnchor.href, '_blank'));
    }

    // Replace oldDiv with fileItem but keep a reference key for revert
    // Use a marker attribute to allow mapping back
    const key = Math.random().toString(36).slice(2, 9);
    fileItem.setAttribute('data-converted-key', key);
    oldDiv.setAttribute('data-original-key', key);
    oldDiv.replaceWith(fileItem);
    return fileItem;
  }

  // Walk current file list and convert
  function convertAll() {
    const list = document.getElementById(listId);
    if (!list) return;

    // The page creates divs with innerHTML; try to extract title/url for each
    const children = Array.from(list.children);
    children.forEach(ch => {
      // try to get file info from dataset or inner content
      let f = null;
      if (ch.dataset && (ch.dataset.title || ch.dataset.url || ch.dataset.size)) {
        f = { title: ch.dataset.title, url: ch.dataset.url, size: ch.dataset.size };
      } else {
        const a = ch.querySelector('a');
        const h4 = ch.querySelector('h4');
        if (a || h4) {
          f = { title: h4 ? h4.innerText : (a ? a.innerText : 'File'), url: a ? a.href : (ch.dataset.url || '') };
        }
      }
      convertDiv(ch, f);
    });
  }

  function revertAll() {
    // find all converted nodes and replace with cached originals
    const list = document.getElementById(listId);
    if (!list) return;
    // converted nodes now have data-converted-key
    const converted = list.querySelectorAll('[data-converted-key]');
    converted.forEach(node => {
      const key = node.getAttribute('data-converted-key');
      // find original by matching original-key on clones in the map
      for (let [orig, clone] of originalNodes.entries()) {
        if (orig.getAttribute && orig.getAttribute('data-original-key') === key) {
          node.replaceWith(clone.cloneNode(true));
          originalNodes.delete(orig);
          break;
        }
      }
    });
  }

  function toggleCompact() {
    compact = !compact;
    const btn = document.getElementById(toggleId);
    if (btn) btn.textContent = compact ? 'Normal view' : 'Compact view';
    if (compact) convertAll();
    else revertAll();
  }

  // observe future changes to the fileList
  function observeList() {
    const list = document.getElementById(listId);
    if (!list) return;
    const mo = new MutationObserver(muts => {
      if (!compact) return;
      muts.forEach(m => {
        Array.from(m.addedNodes).forEach(n => {
          if (n.nodeType === 1 && n.tagName === 'DIV') {
            // attempt conversion
            convertDiv(n);
          }
        });
      });
    });
    mo.observe(list, { childList: true });
  }

  // wire up toggle button
  function init() {
    const btn = document.getElementById(toggleId);
    if (btn) btn.addEventListener('click', toggleCompact);
    // enable compact by default if you want
    // compact = true; convertAll();
    observeList();
  }

  // wait for DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
