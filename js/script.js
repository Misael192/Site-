/* ==========================================================
   SR FACILITIES — SCRIPT GERAL
   01. Ano automático no copyright
   02. Banner de consentimento de cookies
   03. Feedback do formulário de contato (status na URL)
   ========================================================== */
(function () {
    'use strict';

    /* ---------- 01. Ano automático ---------- */
    var ano = document.getElementById('ano-atual');
    if (ano) { ano.textContent = new Date().getFullYear(); }

    /* ---------- 02. Banner de cookies ---------- */
    var banner = document.getElementById('cookie-banner');
    var aceitar = document.getElementById('cookie-aceitar');

    if (banner && aceitar) {
        var CHAVE = 'sr-cookies-aceitos';
        var jaAceitou = false;

        try { jaAceitou = localStorage.getItem(CHAVE) === '1'; } catch (e) { /* armazenamento indisponível */ }

        if (!jaAceitou) {
            setTimeout(function () { banner.classList.add('visivel'); }, 1200);
        }

        aceitar.addEventListener('click', function () {
            try { localStorage.setItem(CHAVE, '1'); } catch (e) { /* armazenamento indisponível */ }
            banner.classList.remove('visivel');
        });
    }

    /* ---------- 03. Feedback do formulário ----------
       O envio é feito pelo enviar-email.php, que redireciona
       de volta com ?status=sucesso ou ?status=erro na URL. */
    var formulario = document.getElementById('formulario-contato');

    if (formulario) {
        var params = new URLSearchParams(window.location.search);
        var status = params.get('status');

        if (status === 'sucesso' || status === 'erro') {
            var alerta = document.getElementById('alerta-' + status);
            if (alerta) {
                alerta.classList.add('ativo');
                alerta.scrollIntoView({ block: 'center' });
            }
            /* Limpa o parâmetro da URL para não repetir a mensagem ao recarregar */
            history.replaceState(null, '', window.location.pathname);
        }
    }
})();
