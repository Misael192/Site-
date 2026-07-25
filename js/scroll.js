/* ==========================================================
   SR FACILITIES — SCROLL
   Scroll Reveal (Intersection Observer) + botão voltar ao topo
   ========================================================== */
(function () {
    'use strict';

    /* Animações de entrada das seções */
    var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var elementos = document.querySelectorAll('.revelar');

    if (!reduzMovimento && 'IntersectionObserver' in window) {
        var observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('revelar--visivel');
                    observador.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        elementos.forEach(function (el, i) {
            el.style.transitionDelay = (i % 3) * 0.08 + 's';
            observador.observe(el);
        });
    } else {
        elementos.forEach(function (el) { el.classList.add('revelar--visivel'); });
    }

    /* Botão voltar ao topo */
    var voltarTopo = document.getElementById('voltar-topo');

    if (voltarTopo) {
        var alternarBotao = function () {
            voltarTopo.classList.toggle('visivel', window.scrollY > 600);
        };
        window.addEventListener('scroll', alternarBotao, { passive: true });
        alternarBotao();

        voltarTopo.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduzMovimento ? 'auto' : 'smooth' });
        });
    }
})();
