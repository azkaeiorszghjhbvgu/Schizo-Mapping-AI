(function () {
  document.querySelectorAll(".cta, .navbar-home").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var targetUrl = link.getAttribute("href");

      document.body.style.animation = "none";

      void document.body.offsetHeight;

      document.body.classList.add("fade-out");

      setTimeout(function () {
        window.location.href = targetUrl;
      }, 400);
    });
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      document.body.style.animation = "none";
      document.body.classList.remove("fade-out");
    }
  });

  var explainBtn = document.getElementById("explainBtn");
  var explanationDrawer = document.getElementById("explanationDrawer");
  var drawerOverlay = document.getElementById("drawerOverlay");
  var closeDrawerBtn = document.getElementById("closeDrawerBtn");

  function toggleDrawer() {
    if (explanationDrawer) explanationDrawer.classList.toggle("open");
    if (drawerOverlay) drawerOverlay.classList.toggle("open");
  }

  if (explainBtn) explainBtn.addEventListener("click", toggleDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", toggleDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", toggleDrawer);

  var navbar = document.querySelector(".navbar");
  if (!navbar) return;

  var lastScrollY = window.scrollY;
  var hidden = false;

  window.addEventListener(
    "scroll",
    function () {
      var currentScrollY = window.scrollY;
      var scrolledDown = currentScrollY > lastScrollY;

      if (scrolledDown && currentScrollY > navbar.offsetHeight) {
        if (!hidden) {
          navbar.classList.add("navbar-hidden");
          hidden = true;
        }
      } else if (hidden) {
        navbar.classList.remove("navbar-hidden");
        hidden = false;
      }

      lastScrollY = currentScrollY;
    },
    { passive: true }
  );
})();
