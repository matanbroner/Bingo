window.addEventListener("load", function () {
  window.postMessage({ type: "BINGO_MARCO" }, "*");
  document.getElementById("bingo-status").innerHTML = "Requested";
});

window.addEventListener("message", function (event) {
  if (event.source != window) return;

  if (event.data.type && event.data.type == "BINGO_POLO") {
    console.log("Bingo extension is installed");
    document.getElementById("bingo-status").innerHTML = "Installed";
  }
});
