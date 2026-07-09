/* ============================================================
   SR FACILITIES — scroll.js
   Scroll Reveal (animações ao rolar) e botão "voltar ao topo"
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Scroll Reveal com IntersectionObserver ---------- */
  const elementos = document.querySelectorAll(".revelar");

  if (elementos.length && "IntersectionObserver" in window) {
    const observador = new IntersectionObserver(
      function (entradas, obs) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("visivel");
            obs.unobserve(entrada.target); // anima apenas uma vez
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    elementos.forEach(function (el) {
      observador.observe(el);
    });
  } else {
    // Fallback: exibe tudo caso o navegador não suporte
    elementos.forEach(function (el) {
      el.classList.add("visivel");
    });
  }

  /* ---------- Botão "voltar ao topo" ---------- */
  const botaoTopo = document.querySelector(".flutuante--topo");

  if (botaoTopo) {
    function alternarBotaoTopo() {
      botaoTopo.classList.toggle("visivel", window.scrollY > 500);
    }

    window.addEventListener("scroll", alternarBotaoTopo, { passive: true });
    alternarBotaoTopo();

    botaoTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
