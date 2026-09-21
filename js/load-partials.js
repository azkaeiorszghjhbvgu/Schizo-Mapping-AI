async function loadPartial(id, file) {

  const element =
    document.getElementById(id);

  if (!element) return;


  const response =
    await fetch(file);


  const html =
    await response.text();


  element.innerHTML = html;

}


async function loadPartials() {

  await loadPartial(
    "controls-container",
    "partials/controls.html"
  );


  await loadPartial(
    "maps-container",
    "partials/maps.html"
  );


  await loadPartial(
    "results-container",
    "partials/results.html"
  );


  document.dispatchEvent(
    new Event("partialsLoaded")
  );

}


loadPartials();