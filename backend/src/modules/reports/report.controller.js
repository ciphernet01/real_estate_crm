import PDFDocument from 'pdfkit';
import { prisma } from '../../config/prisma.js';

const formatMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const computeOverview = async () => {
  const [leadTotal, leadByStatus, dealByStage, commissionAgg, closedDealAgg, users, closedDeals] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.deal.groupBy({ by: ['stage'], _count: { _all: true } }),
    prisma.deal.aggregate({ _sum: { commission: true }, _count: { _all: true } }),
    prisma.deal.aggregate({ where: { stage: 'CLOSED' }, _sum: { commission: true }, _count: { _all: true } }),
    prisma.user.findMany({
      where: { role: { in: ['AGENT', 'MANAGER'] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.deal.findMany({
      where: { stage: 'CLOSED' },
      select: { createdAt: true, commission: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const leadsByStatus = {
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    CLOSED: 0,
    LOST: 0,
  };

  leadByStatus.forEach((row) => {
    leadsByStatus[row.status] = row._count._all;
  });

  const dealsByStage = {
    NEGOTIATION: 0,
    AGREEMENT: 0,
    CLOSED: 0,
  };

  dealByStage.forEach((row) => {
    dealsByStage[row.stage] = row._count._all;
  });

  const leadConversionRate = leadTotal > 0 ? Number(((leadsByStatus.CLOSED / leadTotal) * 100).toFixed(2)) : 0;
  const dealClosureRate = commissionAgg._count._all > 0 ? Number(((closedDealAgg._count._all / commissionAgg._count._all) * 100).toFixed(2)) : 0;

  const agentPerformance = await Promise.all(
    users.map(async (user) => {
      const [assignedLeads, closedLeads, deals, closedCommission] = await Promise.all([
        prisma.lead.count({ where: { assignedToId: user.id } }),
        prisma.lead.count({ where: { assignedToId: user.id, status: 'CLOSED' } }),
        prisma.deal.count({ where: { agentId: user.id } }),
        prisma.deal.aggregate({ where: { agentId: user.id, stage: 'CLOSED' }, _sum: { commission: true } }),
      ]);

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        assignedLeads,
        closedLeads,
        deals,
        conversionRate: assignedLeads > 0 ? Number(((closedLeads / assignedLeads) * 100).toFixed(2)) : 0,
        closedCommission: Number((closedCommission._sum.commission || 0).toFixed(2)),
      };
    })
  );

  const revenueByMonthMap = new Map();
  closedDeals.forEach((deal) => {
    const key = formatMonthKey(new Date(deal.createdAt));
    revenueByMonthMap.set(key, (revenueByMonthMap.get(key) || 0) + Number(deal.commission || 0));
  });

  const revenueByMonth = [...revenueByMonthMap.entries()].map(([month, revenue]) => ({
    month,
    revenue: Number(revenue.toFixed(2)),
  }));

  return {
    leadTotal,
    leadsByStatus,
    leadConversionRate,
    dealsTotal: commissionAgg._count._all,
    dealsByStage,
    closedDeals: closedDealAgg._count._all,
    dealClosureRate,
    totalCommission: Number((commissionAgg._sum.commission || 0).toFixed(2)),
    closedCommission: Number((closedDealAgg._sum.commission || 0).toFixed(2)),
    agentPerformance,
    revenueByMonth,
  };
};

export const getReportsOverview = async (_req, res, next) => {
  try {
    const overview = await computeOverview();
    res.json({ data: overview });
  } catch (error) {
    next(error);
  }
};

export const exportOverviewCsv = async (_req, res, next) => {
  try {
    const overview = await computeOverview();

    const lines = [
      'metric,value',
      `leadTotal,${overview.leadTotal}`,
      `leadConversionRate,${overview.leadConversionRate}`,
      `dealsTotal,${overview.dealsTotal}`,
      `closedDeals,${overview.closedDeals}`,
      `dealClosureRate,${overview.dealClosureRate}`,
      `totalCommission,${overview.totalCommission}`,
      `closedCommission,${overview.closedCommission}`,
      `leads_NEW,${overview.leadsByStatus.NEW}`,
      `leads_CONTACTED,${overview.leadsByStatus.CONTACTED}`,
      `leads_QUALIFIED,${overview.leadsByStatus.QUALIFIED}`,
      `leads_CLOSED,${overview.leadsByStatus.CLOSED}`,
      `leads_LOST,${overview.leadsByStatus.LOST}`,
    ];

    overview.revenueByMonth.forEach((item) => {
      lines.push(`revenue_${item.month},${item.revenue}`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="crm-report-overview.csv"');
    res.send(lines.join('\n'));
  } catch (error) {
    next(error);
  }
};

export const exportOverviewPdf = async (_req, res, next) => {
  try {
    const overview = await computeOverview();

    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', next);

    doc.fontSize(18).text('Real Estate CRM - Overview Report', { underline: true });
    doc.moveDown(1);

    doc.fontSize(12).text(`Leads Total: ${overview.leadTotal}`);
    doc.text(`Lead Conversion Rate: ${overview.leadConversionRate}%`);
    doc.text(`Deals Total: ${overview.dealsTotal}`);
    doc.text(`Closed Deals: ${overview.closedDeals}`);
    doc.text(`Deal Closure Rate: ${overview.dealClosureRate}%`);
    doc.text(`Total Commission: $${overview.totalCommission}`);
    doc.text(`Closed Commission: $${overview.closedCommission}`);

    doc.moveDown(1);
    doc.fontSize(14).text('Lead Status Breakdown');
    Object.entries(overview.leadsByStatus).forEach(([status, count]) => {
      doc.fontSize(12).text(`${status}: ${count}`);
    });

    doc.moveDown(1);
    doc.fontSize(14).text('Revenue by Month');
    if (!overview.revenueByMonth.length) {
      doc.fontSize(12).text('No closed deal revenue yet.');
    } else {
      overview.revenueByMonth.forEach((item) => {
        doc.fontSize(12).text(`${item.month}: $${item.revenue}`);
      });
    }

    doc.moveDown(1);
    doc.fontSize(14).text('Agent Performance');
    if (!overview.agentPerformance.length) {
      doc.fontSize(12).text('No agents found.');
    } else {
      overview.agentPerformance.forEach((agent) => {
        doc.fontSize(12).text(
          `${agent.name} (${agent.role}) - Leads: ${agent.assignedLeads}, Closed: ${agent.closedLeads}, Deals: ${agent.deals}, Commission: $${agent.closedCommission}`
        );
      });
    }

    doc.end();

    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="crm-report-overview.pdf"');
      res.send(buffer);
    });
  } catch (error) {
    next(error);
  }
};
