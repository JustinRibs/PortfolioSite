(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll-triggered reveals */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (!reducedMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Šahovnica heatmap — a checkerboard that behaves like a data grid.
     Red cells shimmer at varying intensity and light up near the cursor. */
  var canvas = document.getElementById("checker-field");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var hero = canvas.parentElement;
  var CELL = 26;
  var GAP = 4;
  var STEP = CELL + GAP;
  var cells = [];
  var cols = 0;
  var rows = 0;
  var dpr = 1;
  var pointer = { x: -9999, y: -9999 };
  var RED = { r: 206, g: 59, b: 44 };

  function build() {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(rect.width / STEP) + 1;
    rows = Math.ceil(rect.height / STEP) + 1;
    cells = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if ((r + c) % 2 !== 0) continue; // šahovnica: alternate squares only
        cells.push({
          x: c * STEP,
          y: r * STEP,
          col: c,
          base: 0.05 + Math.random() * 0.13,
          amp: 0.03 + Math.random() * 0.09,
          phase: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.55
        });
      }
    }
  }

  function draw(t) {
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    var seconds = t / 1000;

    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var alpha = cell.base;
      if (!reducedMotion) {
        alpha += cell.amp * Math.sin(seconds * cell.speed + cell.phase);
      }

      var dx = cell.x + CELL / 2 - pointer.x;
      var dy = cell.y + CELL / 2 - pointer.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180) {
        alpha += (1 - dist / 180) * 0.55;
      }

      if (alpha <= 0.01) continue;
      ctx.fillStyle =
        "rgba(" + RED.r + "," + RED.g + "," + RED.b + "," + Math.min(alpha, 0.9) + ")";
      ctx.fillRect(cell.x, cell.y, CELL, CELL);
    }
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  hero.addEventListener("pointermove", function (e) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });

  hero.addEventListener("pointerleave", function () {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });

  build();
  if (reducedMotion) {
    draw(0);
  } else {
    requestAnimationFrame(loop);
  }
})();
