/* Shared by the writing page and the archive page.
   The writing page (notes.html) is the only place pieces are written;
   the side panel and the archive are built from it. */
window.IM = (() => {
  const PANEL_MAX = 10;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const esc = (t) => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // A piece's title, or its opening words when it has none
  const titleOf = (a) => {
    const h = a.querySelector('h2');
    if (h && h.textContent.trim()) return h.textContent.trim();
    const words = ((a.querySelector('.text') || {}).textContent || '').trim().split(/\s+/);
    return words.slice(0, 8).join(' ') + (words.length > 8 ? '…' : '');
  };

  // Read every piece from a document: id, title, date
  const collect = (doc) => [...doc.querySelectorAll('article.note')].map(a => {
    const t = a.querySelector('time.date');
    const iso = (t && t.getAttribute('datetime')) || '';
    const [y, m, d] = iso.split('-').map(Number);
    return { id: a.id, title: titleOf(a), iso, y, m, d };
  }).filter(n => n.id && n.y).sort((a, b) => b.iso.localeCompare(a.iso));

  // Date format: 1 September, 2026
  const fullDate = (n) => `${n.d} ${MONTHS[n.m - 1]}, ${n.y}`;

  // Write every piece's date from its datetime, so only datetime="YYYY-MM-DD" needs filling in
  const formatDates = (doc) => doc.querySelectorAll('time.date[datetime]').forEach(t => {
    const [y, m, d] = t.getAttribute('datetime').split('-').map(Number);
    if (y && m && d) t.textContent = fullDate({ y, m, d });
  });

  // Side panel: newest ten titles under their month; from ten pieces on, a See all link
  const renderPanel = (items, base) => {
    const box = document.getElementById('side-list');
    if (!box) return;
    let html = '', month = '';
    items.slice(0, PANEL_MAX).forEach(n => {
      const key = `${MONTHS[n.m - 1]} ${n.y}`;
      if (key !== month) {
        if (month) html += '</ul>';
        html += `<h3 class="side-month">${key}</h3><ul class="side-titles">`;
        month = key;
      }
      html += `<li><a href="${base}#${esc(n.id)}" title="${esc(n.title)}">${esc(n.title)}</a><time datetime="${esc(n.iso)}">${n.d} ${MONTHS[n.m - 1].slice(0, 3)}</time></li>`;
    });
    if (month) html += '</ul>';
    if (items.length >= PANEL_MAX) html += '<a class="side-all" href="archive.html">See all</a>';
    box.innerHTML = html;
  };

  // Archive: year, then month, then title and date
  const renderArchive = (items, el) => {
    let html = '', year = 0, month = 0;
    items.forEach(n => {
      if (n.y !== year) {
        if (month) html += '</ul>';
        html += `<h2 class="arc-year">${n.y}</h2>`;
        year = n.y; month = 0;
      }
      if (n.m !== month) {
        if (month) html += '</ul>';
        html += `<h3 class="arc-month">${MONTHS[n.m - 1]}</h3><ul class="arc-list">`;
        month = n.m;
      }
      html += `<li><a href="notes.html#${esc(n.id)}">${esc(n.title)}</a><time datetime="${esc(n.iso)}">${n.d} ${MONTHS[n.m - 1].slice(0, 3)}</time></li>`;
    });
    if (month) html += '</ul>';
    el.innerHTML = html || '<p class="arc-empty">Nothing published yet.</p>';
  };

  // Subscribe forms (side panel and the small sections between pieces)
  const subscribe = () => {
    // Paste the sign-up address here (for example a Google Apps Script web app URL).
    const ENDPOINT = '';
    document.querySelectorAll('form.sub-form').forEach(form => {
      const input = form.querySelector('input[type=email]');
      const msg = form.querySelector('.sub-msg');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.className = 'sub-msg'; msg.textContent = '';
        const email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          msg.className = 'sub-msg err'; msg.textContent = 'Please enter a valid email address.'; input.focus(); return;
        }
        if (!ENDPOINT) {
          msg.className = 'sub-msg err'; msg.textContent = 'Sign-ups are not connected yet.'; return;
        }
        try {
          await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ email, source: 'ilona-writing' }) });
          form.innerHTML = '<p class="sub-done">Thank you. New pieces will come to your inbox.</p>';
        } catch (err) {
          msg.className = 'sub-msg err'; msg.textContent = 'Something went wrong. Please try again.';
        }
      });
    });
  };

  // Small sign-up sections between pieces: after the 2nd, then after every 10th
  const inlineSignups = () => {
    const notes = [...document.querySelectorAll('article.note')];
    notes.forEach((n, i) => {
      const pos = i + 1;
      if (pos === notes.length) return;
      if (pos === 2 || pos % 10 === 0) {
        const id = 'sub-email-' + pos;
        const sec = document.createElement('section');
        sec.className = 'sub-inline';
        sec.setAttribute('aria-label', 'Subscribe');
        sec.innerHTML = `<form class="sub-form" novalidate><p class="side-p">Get these in your inbox</p><div class="sub-row"><label for="${id}">Email</label><input id="${id}" name="email" type="email" autocomplete="email" placeholder="Your email" required><button type="submit">Subscribe</button></div><div class="sub-msg" role="status"></div></form>`;
        n.after(sec);
      }
    });
  };

  return { collect, renderPanel, renderArchive, subscribe, inlineSignups, formatDates, fullDate };
})();
