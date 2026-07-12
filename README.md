# SR Facilities — Site Institucional

Site institucional premium da **SR Facilities** (facilities e serviços terceirizados),
desenvolvido em HTML5, CSS3 e JavaScript puro.

## Estrutura

```
index.html                  Página inicial
enviar-email.php            Processador do formulário de contato (PHP)
sitemap.xml                 Mapa do site para buscadores
robots.txt                  Instruções para robôs de busca
css/
  style.css                 Estilos principais
  responsive.css            Responsividade (tablet e celular)
  animations.css            Animações de entrada (scroll reveal)
js/
  script.js                 Ano automático, banner de cookies, feedback do formulário
  menu.js                   Cabeçalho fixo com efeito ao rolar + menu mobile
  scroll.js                 Scroll reveal + botão voltar ao topo
  whatsapp.js               Balão de convite do WhatsApp
pages/
  contato.html              Entre em Contato (formulário)
  politica-de-privacidade.html
  politica-de-cookies.html
  termos-de-uso.html
  declaracao-de-acessibilidade.html
img/                        Imagens do site
favicon/                    Favicon e ícone de toque (escudo SR oficial)
```

## Formulário de contato (PHP)

O formulário de `pages/contato.html` envia via POST para `enviar-email.php`,
que valida os campos, aplica proteção anti-spam (honeypot) e envia o e-mail
para `srfacilitiesservicos@gmail.com` com a função `mail()` do PHP.

- **Hospedagem com PHP** (Hostinger, HostGator, Locaweb etc.): funciona sem configuração.
- **Hospedagem estática** (GitHub Pages, Netlify): PHP não roda. Troque o `action`
  do formulário por `https://formsubmit.co/srfacilitiesservicos@gmail.com`.
- **PHPMailer/SMTP**: instruções de migração comentadas no topo de `enviar-email.php`.

## Pendências de conteúdo

- Foto oficial de **Jardinagem** para a galeria (usa imagem provisória).
- Links de **LinkedIn** e **Facebook** no rodapé (Instagram já configurado).
