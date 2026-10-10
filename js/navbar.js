(function () {
  var THEME_KEY = "theme";
  var root = document.documentElement;
  var settings = document.querySelector(".navbar-settings");

  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
      theme = "dark";
    }
    if (settings) {
      settings.querySelectorAll(".navbar-theme-option").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.themeChoice === theme);
      });
    }
    // storage can throw when blocked (private mode, disabled cookies); the theme just won't persist
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(savedTheme || "dark");

  if (settings) {
    var gear = settings.querySelector(".navbar-gear");
    gear.addEventListener("click", function (e) {
      e.stopPropagation();
      settings.classList.toggle("open");
    });
    settings.querySelectorAll(".navbar-theme-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyTheme(btn.dataset.themeChoice);
        settings.classList.remove("open");
      });
    });
    document.addEventListener("click", function (e) {
      if (!settings.contains(e.target)) settings.classList.remove("open");
    });
  }

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
})();
