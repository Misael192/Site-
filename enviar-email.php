<?php
/**
 * ==========================================================
 * SR FACILITIES — PROCESSADOR DO FORMULÁRIO DE CONTATO
 * ==========================================================
 *
 * Recebe o POST do formulário em pages/contato.html, valida os
 * campos, aplica proteção anti-spam (honeypot) e envia o e-mail
 * com a função mail() nativa do PHP.
 *
 * REQUISITOS DE HOSPEDAGEM
 * - Servidor com PHP 7.4+ e envio de e-mail habilitado
 *   (Hostinger, HostGator, Locaweb, KingHost etc.).
 * - Em hospedagem estática (GitHub Pages, Netlify) o PHP não
 *   roda; nesse caso use FormSubmit apontando o action do
 *   formulário para https://formsubmit.co/contato@srfacilities.com.br
 *
 * MIGRAÇÃO FUTURA PARA PHPMAILER (envio via SMTP autenticado)
 * - composer require phpmailer/phpmailer
 * - Substitua o bloco "ENVIO" abaixo pela configuração SMTP,
 *   mantendo a validação e o redirecionamento já prontos.
 */

declare(strict_types=1);

/* ---------- Configurações ---------- */
const EMAIL_DESTINO  = 'contato@srfacilities.com.br';
const PAGINA_RETORNO = 'pages/contato.html';

/* ---------- Aceita somente POST ---------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: ' . PAGINA_RETORNO);
    exit;
}

/**
 * Redireciona de volta ao formulário com o status do envio.
 * O js/script.js lê o parâmetro e exibe a mensagem adequada.
 */
function redirecionar(string $status): void
{
    header('Location: ' . PAGINA_RETORNO . '?status=' . $status);
    exit;
}

/* ---------- Anti-spam (honeypot) ----------
   O campo "site" é invisível para pessoas; se vier preenchido,
   é um robô. Respondemos como sucesso para não dar pistas. */
if (!empty($_POST['site'])) {
    redirecionar('sucesso');
}

/* ---------- Coleta e sanitização ---------- */
function campo(string $nome): string
{
    $valor = trim((string) ($_POST[$nome] ?? ''));
    /* Remove quebras de linha de campos de linha única para
       impedir injeção de cabeçalhos de e-mail */
    return str_replace(["\r", "\n"], ' ', $valor);
}

$nome     = campo('nome');
$email    = campo('email');
$celular  = campo('celular');
$mensagem = trim((string) ($_POST['mensagem'] ?? ''));

/* ---------- Validação ---------- */
if (
    $nome === '' || $celular === '' || $mensagem === '' ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    mb_strlen($nome) > 120 || mb_strlen($celular) > 30 ||
    mb_strlen($mensagem) > 5000
) {
    redirecionar('erro');
}

/* ---------- Montagem da mensagem ---------- */
$assunto = 'Novo contato pelo site — ' . $nome;

$corpo  = "Nova mensagem recebida pelo formulário do site SR Facilities\n";
$corpo .= "------------------------------------------------------------\n\n";
$corpo .= "Nome:     {$nome}\n";
$corpo .= "E-mail:   {$email}\n";
$corpo .= "Celular:  {$celular}\n\n";
$corpo .= "Mensagem:\n{$mensagem}\n\n";
$corpo .= "------------------------------------------------------------\n";
$corpo .= 'Enviado em ' . date('d/m/Y \à\s H:i') . "\n";

/* Remetente do domínio (evita cair em spam); resposta vai ao visitante */
$dominio = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'srfacilities.com.br');

$cabecalhos  = 'From: Site SR Facilities <nao-responda@' . $dominio . ">\r\n";
$cabecalhos .= 'Reply-To: ' . $nome . ' <' . $email . ">\r\n";
$cabecalhos .= "MIME-Version: 1.0\r\n";
$cabecalhos .= "Content-Type: text/plain; charset=UTF-8\r\n";

/* ---------- ENVIO ---------- */
$enviado = @mail(
    EMAIL_DESTINO,
    '=?UTF-8?B?' . base64_encode($assunto) . '?=',
    $corpo,
    $cabecalhos
);

redirecionar($enviado ? 'sucesso' : 'erro');
