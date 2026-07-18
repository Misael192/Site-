/**
 * Seed do plano de controle: catálogo de módulos, permissões e planos.
 *
 * Dados por tenant (roles, pipeline stages, workflows padrão) NÃO são
 * seedados aqui — são criados pelo provisioning no signup (doc 14, Fase 1).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODULES = [
  ["people", "Pessoas", "Colaboradores, admissão digital, férias e ponto"],
  ["payroll", "Folha de Pagamento", "Folha, holerites e eSocial"],
  ["recruitment", "Recrutamento", "Vagas, Trabalhe Conosco e pipeline de candidatos"],
  ["benefits", "Benefícios", "Benefícios corporativos e convênios"],
  ["learning", "Treinamentos", "Cursos, trilhas e certificados"],
  ["performance", "Performance", "Metas, avaliações e plano de carreira"],
  ["documents", "Documentos", "GED com versões e assinatura eletrônica"],
  ["analytics", "Indicadores", "Dashboards e relatórios"],
  ["ai", "Assistente IA", "Assistente de IA para RH e DP"],
] as const;

// Catálogo global `module.resource.action` (doc 05 §2)
const PERMISSIONS = [
  // Core
  ["core.users.read", "core"], ["core.users.manage", "core"],
  ["core.roles.manage", "core"], ["core.organizations.manage", "core"],
  ["core.settings.manage", "core"], ["core.audit.read", "core"],
  ["core.billing.manage", "core"], ["core.api_keys.manage", "core"],
  ["core.workflows.manage", "core"],
  // People / DP
  ["people.employee.read", "people"], ["people.employee.manage", "people"],
  ["people.admission.manage", "people"],
  ["people.vacation.request", "people"], ["people.vacation.approve", "people"],
  ["people.time.record", "people"], ["people.time.adjust.request", "people"],
  ["people.time.adjust.approve", "people"], ["people.time.reports", "people"],
  // Documentos
  ["documents.file.read", "documents"], ["documents.file.manage", "documents"],
  ["documents.signature.request", "documents"], ["documents.signature.sign", "documents"],
  // Recrutamento
  ["recruitment.job.manage", "recruitment"], ["recruitment.candidate.read", "recruitment"],
  ["recruitment.pipeline.manage", "recruitment"],
  // Benefícios
  ["benefits.benefit.read", "benefits"], ["benefits.benefit.manage", "benefits"],
  // Performance / Learning / Engagement
  ["performance.review.manage", "performance"], ["performance.goal.manage", "performance"],
  ["learning.course.manage", "learning"], ["learning.course.attend", "learning"],
  ["engagement.survey.manage", "performance"], ["engagement.announcement.manage", "performance"],
  // Analytics / IA / Payroll
  ["analytics.dashboard.read", "analytics"],
  ["ai.chat.use", "ai"], ["ai.documents.generate", "ai"],
  ["payroll.payslip.read.own", "payroll"], ["payroll.payroll.manage", "payroll"],
] as const;

const PLANS = [
  {
    slug: "starter",
    name: "Starter",
    priceCents: 0,
    entitlements: {
      modules: ["people", "documents", "analytics"],
      limits: { max_employees: 25, storage_gb: 5, ai_tokens_month: 0 },
    },
  },
  {
    slug: "professional",
    name: "Professional",
    priceCents: 79900,
    entitlements: {
      modules: ["people", "documents", "analytics", "recruitment", "benefits", "performance", "learning", "ai"],
      limits: { max_employees: 300, storage_gb: 100, ai_tokens_month: 2_000_000 },
    },
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    priceCents: 299900,
    entitlements: {
      modules: MODULES.map(([slug]) => slug),
      limits: { max_employees: 100_000, storage_gb: 1_000, ai_tokens_month: 50_000_000 },
    },
  },
];

async function main() {
  for (const [slug, name, description] of MODULES) {
    await prisma.platformModule.upsert({
      where: { slug },
      update: { name, description },
      create: { slug, name, description },
    });
  }

  for (const [key, module] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { module },
      create: { key, module },
    });
  }

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: { name: plan.name, priceCents: plan.priceCents, entitlements: plan.entitlements },
      create: plan,
    });
  }

  console.log(
    `Seed ok: ${MODULES.length} módulos, ${PERMISSIONS.length} permissões, ${PLANS.length} planos.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
