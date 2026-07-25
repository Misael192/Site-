/* ==========================================================
   SR FACILITIES — WHATSAPP
   Balão de convite exibido após o carregamento,
   com fechamento automático e manual
   ========================================================== */
(function () {
    'use strict';

    var balao = document.getElementById('whatsapp-balao');
    var fecharBalao = document.getElementById('whatsapp-fechar');

    if (!balao || !fecharBalao) { return; }

    var temporizador;

    setTimeout(function () {
        balao.classList.add('visivel');
        temporizador = setTimeout(function () {
            balao.classList.remove('visivel');
        }, 8000);
    }, 3500);

    fecharBalao.addEventListener('click', function () {
        clearTimeout(temporizador);
        balao.classList.remove('visivel');
    });
})();
