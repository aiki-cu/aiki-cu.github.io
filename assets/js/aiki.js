/* Static content is the baseline. Each enhancement initializes independently. */
(() => {
  const filters = document.querySelector('[data-publication-filters]');
  if (filters) {
    const links = [...filters.querySelectorAll('[data-area]')];
    const records = [...document.querySelectorAll('.publication')];
    const groups = [...document.querySelectorAll('[data-year-group]')];
    const count = document.querySelector('#publication-count');
    const valid = new Set(links.map(link => link.dataset.area));
    const applyFilter = (area, updateURL = false) => {
      if (!valid.has(area)) area = 'all';
      let shown = 0;
      for (const record of records) {
        record.hidden = area !== 'all' && !record.dataset.areas.split(' ').includes(area);
        if (!record.hidden) shown++;
      }
      for (const group of groups) group.hidden = !group.querySelector('.publication:not([hidden])');
      for (const link of links) {
        if (link.dataset.area === area) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      count.textContent = `${shown} publication${shown === 1 ? '' : 's'}`;
      if (updateURL) {
        const url = new URL(window.location.href);
        if (area === 'all') url.searchParams.delete('area');
        else url.searchParams.set('area', area);
        url.hash = '';
        window.history.pushState(null, '', url);
      }
    };
    filters.addEventListener('click', (event) => {
      const link = event.target.closest('[data-area]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      applyFilter(link.dataset.area, true);
    });
    const readURL = () => applyFilter(new URL(window.location.href).searchParams.get('area') || 'all');
    window.addEventListener('popstate', readURL);
    readURL();
  }
})();
