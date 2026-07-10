/* ==========================================================
   SR FACILITIES — MENU
   Cabeçalho fixo com efeito ao rolar + menu mobile animado
   ========================================================== */
(function () {
    'use strict';

    /* Cabeçalho: glassmorphism e redução de altura ao rolar */
    var cabecalho = document.getElementById('cabecalho');

    if (cabecalho) {
        var aoRolar = function () {
            cabecalho.classList.toggle('cabecalho--rolado', window.scrollY > 40);
        };
        window.addEventListener('scroll', aoRolar, { passive: true });
        aoRolar();
    }

    /* Menu mobile */
    var botaoMenu = document.getElementById('menu-botao');
    var menu = document.getElementById('menu');

    if (botaoMenu && menu) {
        botaoMenu.addEventListener('click', function () {
            var aberto = menu.classList.toggle('aberto');
            botaoMenu.setAttribute('aria-expanded', String(aberto));
            botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
        });

        menu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                menu.classList.remove('aberto');
                botaoMenu.setAttribute('aria-expanded', 'false');
            });
        });
    }
})();
