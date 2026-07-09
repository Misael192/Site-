/* ============================================================
   SR FACILITIES — menu.js
   Controle do menu fixo, menu mobile e link ativo
   ============================================================ */
(function () {
  "use strict";

  const cabecalho = document.querySelector(".cabecalho");
  const botaoMenu = document.querySelector(".menu-alternar");
  const menu = document.querySelector(".menu");
  const veu = document.querySelector(".menu-veu");
  const linksMenu = document.querySelectorAll(".menu__link");

  /* ---------- Efeito do cabeçalho ao rolar a página ---------- */
  function atualizarCabecalho() {
    if (!cabecalho) return;
    cabecalho.classList.toggle("cabecalho--rolado", window.scrollY > 40);
  }

  window.addEventListener("scroll", atualizarCabecalho, { passive: true });
  atualizarCabecalho();

  /* ---------- Menu mobile (abrir / fechar) ---------- */
  function abrirMenu() {
    menu.classList.add("menu--aberto");
    veu && veu.classList.add("visivel");
    document.body.classList.add("sem-rolagem");
    botaoMenu.setAttribute("aria-expanded", "true");
    botaoMenu.setAttribute("aria-label", "Fechar menu de navegação");
  }

  function fecharMenu() {
    menu.classList.remove("menu--aberto");
    veu && veu.classList.remove("visivel");
    document.body.classList.remove("sem-rolagem");
    botaoMenu.setAttribute("aria-expanded", "false");
    botaoMenu.setAttribute("aria-label", "Abrir menu de navegação");
  }

  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", function () {
      const aberto = menu.classList.contains("menu--aberto");
      aberto ? fecharMenu() : abrirMenu();
    });

    // Fecha ao clicar no véu de fundo
    veu && veu.addEventListener("click", fecharMenu);

    // Fecha ao clicar em qualquer link do menu
    linksMenu.forEach(function (link) {
      link.addEventListener("click", fecharMenu);
    });

    // Fecha com a tecla Esc (acessibilidade)
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && menu.classList.contains("menu--aberto")) {
        fecharMenu();
        botaoMenu.focus();
      }
    });
  }

  /* ---------- Destaque do link ativo conforme a seção visível ---------- */
  const secoes = document.querySelectorAll("section[id]");

  if (secoes.length && "IntersectionObserver" in window) {
    const observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          const id = entrada.target.getAttribute("id");
          linksMenu.forEach(function (link) {
            const destino = link.getAttribute("href") || "";
            link.classList.toggle(
              "menu__link--ativo",
              destino.indexOf("#" + id) !== -1
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    secoes.forEach(function (secao) {
      observador.observe(secao);
    });
  }
})();
