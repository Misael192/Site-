/* ============================================================
   SR FACILITIES — whatsapp.js
   Botão flutuante do WhatsApp com mensagem pré-definida
   ============================================================ */
(function () {
  "use strict";

  // Número oficial da SR Facilities (formato internacional, sem símbolos)
  const NUMERO_WHATSAPP = "5511945696208";

  // Mensagem inicial enviada ao abrir a conversa
  const MENSAGEM_PADRAO =
    "Olá! Visitei o site da SR Facilities e gostaria de solicitar um orçamento.";

  const botao = document.querySelector(".flutuante--whatsapp");
  if (!botao) return;

  const url =
    "https://wa.me/" +
    NUMERO_WHATSAPP +
    "?text=" +
    encodeURIComponent(MENSAGEM_PADRAO);

  botao.addEventListener("click", function () {
    // Abre o WhatsApp em nova aba, com proteção contra window.opener
    window.open(url, "_blank", "noopener,noreferrer");
  });
})();
