(() => {
  'use strict';
  const areas = JSON.parse(document.getElementById('engagement-areas').textContent);
  const baseurl = document.body.dataset.baseurl;
  const pagePath = document.body.dataset.pagePath;
  const currentArea = areas.find(area => area.path === location.pathname);
  const selectedArea = pagePath === '/support/'
    ? areas.find(area => area.id === new URLSearchParams(location.search).get('area'))
    : null;
  const locationName = currentArea ? 'research_hub' : ({
    '/': 'home', '/research/': 'research', '/people/': 'people',
    '/support/': 'support', '/join/': 'join', '/news/': 'news', '/about/': 'about'
  }[pagePath] || 'other');

  // The topic is useful even when analytics is blocked or disabled.
  const contact = document.querySelector('[data-support-email]');
  if (contact) {
    const subject = 'Supporting AIKI' + (selectedArea ? ': ' + selectedArea.title : '');
    contact.href = contact.getAttribute('href').split('?')[0] + '?subject=' + encodeURIComponent(subject);
    if (selectedArea) {
      const topic = document.querySelector('[data-support-topic]');
      topic.textContent = 'Your research interest: ' + selectedArea.title;
      topic.hidden = false;
    }
  }

  const send = (name, area, details = {}) => {
    if (!window.aikiAnalyticsEnabled || typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      action_location: locationName,
      ...(area ? { research_area: area.id } : {}),
      ...details,
      transport_type: 'beacon'
    });
  };

  const trackLink = event => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const link = event.target.closest('a');
    if (!link) return;
    const area = currentArea || selectedArea;
    // Explicit actions never send a URL, link text, email, or form value.
    switch (link.dataset.track) {
      case 'support_contact_click':
        send('support_contact_click', area);
        return;
      case 'research_person_click':
        send('research_person_click', area, { person_id: link.dataset.personId });
        return;
    }
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin) return;
    const targetArea = areas.find(candidate => candidate.path === target.pathname);
    if (targetArea && target.pathname !== location.pathname) {
      send('research_area_open', targetArea);
    } else if (target.pathname === baseurl + '/support/' && pagePath !== '/support/') {
      send('support_open', area);
    } else if (target.pathname === baseurl + '/join/' && target.hash === '#newsletter') {
      send('newsletter_open', area);
    }
  };
  document.addEventListener('click', trackLink);
  document.addEventListener('auxclick', trackLink);
  document.querySelector('.newsletter-form')?.addEventListener('submit', () => {
    // Native validation precedes this event. It is an attempt, not an enrollment.
    send('newsletter_submit', null);
  });
})();
