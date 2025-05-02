// page_route.js
function loadPage(url) {
    fetch(url)
      .then(res => res.text())
      .then(html => {
        document.getElementById('app').innerHTML = html;
      });
  }
  
  page('/', () => loadPage('/pages/home.html'));
  page('/home', () => loadPage('/pages/home.html'));
  page('/programs', () => loadPage('/pages/programs.html'));
  page('/centers', () => loadPage('/pages/centers.html'));
  page('/contact', () => loadPage('/pages/contact.html'));
  page({ hashbang: true }); // 🔁 Enable hash routing
  
  // auto scroll top
  page('*', (ctx, next) => {
    document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
    next();
  });
  
  
  
  document.querySelectorAll('.navbar-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      page(this.getAttribute('href'));
    });
  });
  

  page('/programs', () => {
    loadPage('/pages/programs.html');
    setTimeout(() => {
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // slight delay to wait for content load
  });
  