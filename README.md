# SR Facilities — Site Institucional

Site institucional premium da **SR Facilities** (facilities e serviços terceirizados),
desenvolvido em HTML5, **Tailwind CSS** e JavaScript puro.

## Estilização

O projeto usa **exclusivamente Tailwind CSS** — não há CSS de layout escrito à mão.
Todo o layout, espaçamento, tipografia, grids e responsividade vivem nas classes
utilitárias do HTML.

- `css/tailwind-input.css` — **fonte** dos estilos: tema com as variáveis da marca
  (preto, branco, dourado `#D4AF37`), componentes reutilizáveis (`.btn-ouro`,
  `.btn-contorno`, `.campo`, `.rotulo`, `.texto-legal`), a animação de scroll reveal
  (`.revelar`) e o foco visível de acessibilidade.
- `css/tailwind.css` — **CSS compilado e minificado** (é o arquivo carregado pelas páginas).

### Recompilar o CSS após editar classes

```
npx @tailwindcss/cli -i css/tailwind-input.css -o css/tailwind.css --minify
```

Rode na raiz do projeto para que as classes de `index.html` e `pages/` sejam
detectadas automaticamente pelos `@source`.

## Estrutura

```
index.html                  Página inicial
enviar-email.php            Processador do formulário de contato (PHP)
sitemap.xml                 Mapa do site para buscadores
robots.txt                  Instruções para robôs de busca
css/
  tailwind-input.css        Fonte: tema + componentes (editar aqui)
  tailwind.css              CSS compilado e minificado (carregado pelas páginas)
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

- Links de **LinkedIn** e **Facebook** no rodapé (Instagram já configurado).
