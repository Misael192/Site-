/* ============================================================
   SR FACILITIES — script.js
   Funções gerais: ano do rodapé, banner de cookies e
   validação do formulário de contato
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Copyright automático com o ano atual ---------- */
  const anoAtual = document.querySelectorAll(".ano-atual");
  anoAtual.forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ============================================================
     BANNER DE CONSENTIMENTO DE COOKIES
     A escolha do usuário fica salva no localStorage.
     ============================================================ */
  const CHAVE_COOKIES = "srfacilities_cookies";
  const banner = document.querySelector(".banner-cookies");

  if (banner) {
    let preferencia = null;
    try {
      preferencia = localStorage.getItem(CHAVE_COOKIES);
    } catch (erro) {
      preferencia = null; // localStorage indisponível (modo privado etc.)
    }

    // Exibe o banner apenas se o usuário ainda não decidiu
    if (!preferencia) {
      setTimeout(function () {
        banner.classList.add("visivel");
      }, 1200);
    }

    function registrarEscolha(valor) {
      try {
        localStorage.setItem(CHAVE_COOKIES, valor);
      } catch (erro) {
        /* segue sem persistir */
      }
      banner.classList.remove("visivel");
    }

    const botaoAceitar = banner.querySelector("[data-cookies='aceitar']");
    const botaoRecusar = banner.querySelector("[data-cookies='recusar']");

    botaoAceitar &&
      botaoAceitar.addEventListener("click", function () {
        registrarEscolha("aceito");
      });

    botaoRecusar &&
      botaoRecusar.addEventListener("click", function () {
        registrarEscolha("recusado");
      });
  }

  /* ============================================================
     FORMULÁRIO DE CONTATO
     Validação no navegador + máscara simples de celular.
     Preparado para integração futura com PHP Mailer, FormSubmit
     ou outro serviço de envio de e-mails (ver comentários abaixo).
     ============================================================ */
  const formulario = document.querySelector("#formulario-contato");

  if (formulario) {
    const campoCelular = formulario.querySelector("#celular");

    // Máscara de celular brasileiro: (11) 99999-9999
    if (campoCelular) {
      campoCelular.addEventListener("input", function () {
        let digitos = campoCelular.value.replace(/\D/g, "").slice(0, 11);
        let formatado = digitos;

        if (digitos.length > 2) {
          formatado = "(" + digitos.slice(0, 2) + ") " + digitos.slice(2);
        }
        if (digitos.length > 7) {
          formatado =
            "(" +
            digitos.slice(0, 2) +
            ") " +
            digitos.slice(2, 7) +
            "-" +
            digitos.slice(7);
        }
        campoCelular.value = formatado;
      });
    }

    // Regras de validação por campo
    const validadores = {
      nome: function (valor) {
        return valor.trim().length >= 3;
      },
      email: function (valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
      },
      celular: function (valor) {
        return valor.replace(/\D/g, "").length >= 10;
      },
      mensagem: function (valor) {
        return valor.trim().length >= 10;
      },
    };

    function validarCampo(campo) {
      const wrapper = campo.closest(".campo");
      const regra = validadores[campo.name];
      const valido = regra ? regra(campo.value) : campo.value.trim() !== "";

      wrapper.classList.toggle("campo--invalido", !valido);
      campo.setAttribute("aria-invalid", valido ? "false" : "true");
      return valido;
    }

    // Valida ao sair do campo
    formulario.querySelectorAll("input, textarea").forEach(function (campo) {
      campo.addEventListener("blur", function () {
        validarCampo(campo);
      });
    });

    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();

      // Valida todos os campos antes de enviar
      let tudoValido = true;
      formulario.querySelectorAll("input, textarea").forEach(function (campo) {
        if (!validarCampo(campo)) tudoValido = false;
      });

      if (!tudoValido) {
        const primeiroInvalido = formulario.querySelector(
          ".campo--invalido input, .campo--invalido textarea"
        );
        primeiroInvalido && primeiroInvalido.focus();
        return;
      }

      /* --------------------------------------------------------
         INTEGRAÇÃO FUTURA COM SERVIÇO DE E-MAIL
         --------------------------------------------------------
         Opção 1 — FormSubmit (sem backend):
           No HTML, defina:
             action="https://formsubmit.co/contato@srfacilities.com.br"
             method="POST"
           e remova o evento.preventDefault() acima.

         Opção 2 — PHP Mailer (com backend próprio):
           Defina action="enviar.php" method="POST" e trate os
           campos name="nome", "email", "celular" e "mensagem"
           no servidor.

         Opção 3 — Fetch para uma API própria:
           const dados = new FormData(formulario);
           fetch("/api/contato", { method: "POST", body: dados });
         -------------------------------------------------------- */

      // Enquanto não há integração, exibe confirmação visual
      const retorno = formulario.querySelector(".formulario__retorno");
      if (retorno) {
        retorno.classList.add("formulario__retorno--sucesso");
        retorno.textContent =
          "Mensagem registrada com sucesso! Em breve nossa equipe entrará em contato. " +
          "Se preferir atendimento imediato, fale conosco pelo WhatsApp (11) 94569-6208.";
      }

      formulario.reset();
      formulario
        .querySelectorAll(".campo--invalido")
        .forEach(function (wrapper) {
          wrapper.classList.remove("campo--invalido");
        });
    });
  }
})();
