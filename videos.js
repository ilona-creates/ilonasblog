/* Videos: the only place to add a video is the two lists below, newest first.
   Each video:  { title: '...', date: 'YYYY-MM-DD', url: 'the YouTube link', thumb: 'img/videos/your-picture.jpg (optional)' }
   A YouTube link (watch, youtu.be or shorts) plays right in its box, and its picture from YouTube is used unless you give a thumb.
   Any other link opens where the video is hosted. */
window.VIDEOS = {
  shorts: [
    { title: 'Now I realise it was not about the gear', date: '2026-11-25', url: 'https://youtu.be/odSNW7znj14', thumb: 'img/videos/short-1.jpg' },
    { title: 'Identity, becoming – we never stop becoming something new', date: '2026-11-24', url: 'https://youtu.be/vcFURRJd5uM', thumb: 'img/videos/short-2.jpg' }
  ],
  long: [
    { title: 'I didn’t realise how much of a startup (or any online business) is creating content', date: '2026-11-24', url: 'https://youtu.be/p7-MUbd5IA8', thumb: 'img/videos/long-1.jpg' }
  ]
};

window.VID = (() => {
  const ROW_MAX = 10;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date = (iso) => { const [y, m, d] = String(iso).split('-').map(Number); return y ? `${d} ${MONTHS[m - 1]}, ${y}` : ''; };
  const sorted = (list) => [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // The YouTube id from any YouTube link (watch, youtu.be or shorts), or the id itself
  const ytId = (v) => {
    if (v.youtube) return v.youtube;
    const m = String(v.url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
    return m ? m[1] : '';
  };

  const picture = (v, kind) => {
    const id = ytId(v);
    const src = v.thumb || (id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${kind === 'shorts' ? 'oar2' : 'hqdefault'}.jpg` : '');
    return src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '';
  };

  // A YouTube video plays right in its box; any other link opens where the video is hosted
  const card = (v, kind) => {
    const id = ytId(v);
    if (id) {
      return `<div class="v-card">
      <span class="v-hold">
        <button type="button" class="v-pic v-pic-${kind} v-yt" data-yt="${esc(id)}" aria-label="Play ${esc(v.title)}">${picture(v, kind)}</button>
        <button type="button" class="v-big" data-yt="${esc(id)}" data-kind="${kind}" aria-label="Play ${esc(v.title)} bigger"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
      </span>
      <span class="v-title">${esc(v.title)}</span>
      <time class="v-date" datetime="${esc(v.date)}">${date(v.date)}</time>
    </div>`;
    }
    const external = v.url && v.url !== '#';
    return `<a class="v-card" href="${esc(v.url || '#')}"${external ? ' target="_blank" rel="noopener"' : ''}>
      <span class="v-pic v-pic-${kind}">${picture(v, kind)}</span>
      <span class="v-title">${esc(v.title)}</span>
      <time class="v-date" datetime="${esc(v.date)}">${date(v.date)}</time>
    </a>`;
  };

  const embed = (id) => `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;

  // Tap a box to play it there; only one video plays at a time
  let playing = null;
  const stopBox = () => { if (playing) { playing.classList.remove('is-playing'); playing.innerHTML = playing.dataset.cover; playing = null; } };

  // Bigger: the video plays large on a white screen; Back or Esc returns to the page
  let big = null, lastFocus = null;
  const openBig = (id, kind) => {
    stopBox();
    if (!big) {
      big = document.createElement('div');
      big.className = 'v-bigview';
      big.setAttribute('role', 'dialog'); big.setAttribute('aria-modal', 'true'); big.setAttribute('aria-label', 'Video');
      big.innerHTML = '<button type="button" class="v-bigback">← Back to videos</button><div class="v-bigframe"></div>';
      document.body.appendChild(big);
      big.querySelector('.v-bigback').addEventListener('click', closeBig);
      big.addEventListener('click', (e) => { if (e.target === big) closeBig(); });
    }
    lastFocus = document.activeElement;
    const f = big.querySelector('.v-bigframe');
    f.className = 'v-bigframe v-bigframe-' + kind;
    f.innerHTML = embed(id);
    big.classList.add('open'); document.body.classList.add('locked');
    big.querySelector('.v-bigback').focus();
  };
  const closeBig = () => {
    if (!big) return;
    big.querySelector('.v-bigframe').innerHTML = '';
    big.classList.remove('open'); document.body.classList.remove('locked');
    if (lastFocus) lastFocus.focus();
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && big && big.classList.contains('open')) closeBig(); });

  // Hover preview, like YouTube: after a moment the video plays silently in its box,
  // and the thumbnail comes back when the pointer leaves. Only on screens with a mouse,
  // and not inside Claude, where video players are blocked.
  const canPreview = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !/claudeusercontent\.com$|claude\.ai$/.test(location.hostname);
  const preview = (box) => {
    const id = encodeURIComponent(box.dataset.yt);
    const f = document.createElement('iframe');
    f.className = 'v-preview';
    f.title = 'Preview';
    f.setAttribute('tabindex', '-1');
    f.setAttribute('allow', 'autoplay; encrypted-media');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${id}`;
    f.addEventListener('load', () => setTimeout(() => f.classList.add('on'), 600));
    box.appendChild(f);
  };
  if (canPreview) {
    document.addEventListener('mouseover', (e) => {
      const box = e.target.closest('.v-yt');
      if (!box || box.classList.contains('is-playing') || box.dataset.hover) return;
      box.dataset.hover = '1';
      box._t = setTimeout(() => { if (box.dataset.hover && !box.classList.contains('is-playing')) preview(box); }, 500);
    });
    document.addEventListener('mouseout', (e) => {
      const box = e.target.closest('.v-yt');
      if (!box || box.contains(e.relatedTarget)) return;
      delete box.dataset.hover; clearTimeout(box._t);
      const f = box.querySelector('.v-preview'); if (f) f.remove();
    });
  }

  document.addEventListener('click', (e) => {
    const bigBtn = e.target.closest('.v-big');
    if (bigBtn) { openBig(bigBtn.dataset.yt, bigBtn.dataset.kind); return; }
    const box = e.target.closest('.v-yt');
    if (!box || box.classList.contains('is-playing')) return;
    stopBox();
    clearTimeout(box._t); delete box.dataset.hover;
    const pv = box.querySelector('.v-preview'); if (pv) pv.remove();
    box.dataset.cover = box.innerHTML;
    box.innerHTML = embed(box.dataset.yt);
    box.classList.add('is-playing');
    playing = box;
  });

  // A row that scrolls sideways: newest ten, then a See all card
  const row = (el, kind, allPage) => {
    const items = sorted(window.VIDEOS[kind] || []);
    if (!items.length) { el.innerHTML = '<p class="v-empty">Nothing here yet.</p>'; return; }
    let html = items.slice(0, ROW_MAX).map(v => card(v, kind)).join('');
    if (items.length >= ROW_MAX) {
      html += `<a class="v-card v-all" href="${allPage}"><span class="v-pic v-pic-${kind} v-all-box">See all</span></a>`;
    }
    el.innerHTML = html;
  };

  // A full page of every video, in a grid
  const grid = (el, kind) => {
    const items = sorted(window.VIDEOS[kind] || []);
    el.innerHTML = items.length ? items.map(v => card(v, kind)).join('') : '<p class="v-empty">Nothing here yet.</p>';
  };

  // Arrow buttons that move a row by one screen
  const arrows = (rowEl, prev, next) => {
    const step = () => rowEl.clientWidth;
    const update = () => {
      prev.disabled = rowEl.scrollLeft < 4;
      next.disabled = rowEl.scrollLeft + rowEl.clientWidth > rowEl.scrollWidth - 4;
    };
    prev.addEventListener('click', () => rowEl.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => rowEl.scrollBy({ left: step(), behavior: 'smooth' }));
    rowEl.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  return { row, grid, arrows };
})();
