# SR Facilities — Site Institucional

Site institucional premium da **SR Facilities**, empresa de serviços terceirizados
(controle de acesso, portaria, recepção, limpeza profissional, jardinagem,
zeladoria e apoio operacional) em Cajamar/SP.

Desenvolvido com **HTML5, CSS3 e JavaScript puro** — sem frameworks e sem build.
Pronto para hospedagem em qualquer servidor estático (GitHub Pages, Netlify,
Vercel, Hostinger, cPanel etc.).

## Estrutura

```
index.html                          Página inicial
sitemap.xml                         Mapa do site (SEO)
robots.txt                          Instruções para buscadores
/css
  style.css                         Estilos principais e identidade visual
  responsive.css                    Adaptações para tablet e smartphone
  animations.css                    Animações (fade, slide, reveal, hover)
/js
  script.js                         Ano automático, banner de cookies e formulário
  menu.js                           Menu fixo, menu mobile e link ativo
  scroll.js                         Scroll reveal e botão "voltar ao topo"
  whatsapp.js                       Botão flutuante do WhatsApp
/pages
  contato.html                      Página "Entre em Contato"
  politica-de-privacidade.html      Política de Privacidade (LGPD)
  politica-de-cookies.html          Política de Cookies
  termos-de-uso.html                Termos de Uso
/img                                Imagens (fundo do hero em SVG)
/assets                             Logo em SVG
/favicon                            Favicon em SVG
```

## Identidade visual

Cores exclusivas da marca: **preto, dourado, branco e grafite**
(variáveis CSS em `css/style.css`).

## Formulário de contato

O formulário em `pages/contato.html` valida os campos no navegador e está
**preparado para integração futura** com PHP Mailer, FormSubmit ou API própria —
as instruções estão comentadas em `js/script.js`.

## Publicação

1. Envie todos os arquivos para a raiz do servidor de hospedagem.
2. Ajuste o domínio nas tags `canonical`, `og:url`, no `sitemap.xml` e no
   `robots.txt` caso o endereço final seja diferente de
   `https://www.srfacilities.com.br/`.
