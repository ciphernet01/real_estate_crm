import { prisma } from '../../config/prisma.js';
import { z } from 'zod';

const dealStages = ['NEGOTIATION', 'AGREEMENT', 'CLOSED'];

const stageTransitions = {
  NEGOTIATION: ['AGREEMENT', 'CLOSED'],
  AGREEMENT: ['CLOSED'],
  CLOSED: [],
};

const createDealSchema = z.object({
  title: z.string().min(3),
  stage: z.enum(dealStages).optional(),
  commission: z.coerce.number().nonnegative().optional().nullable(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

const updateDealSchema = createDealSchema.partial();

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message || 'Invalid payload');
    error.statusCode = 400;
    throw error;
  }
  return parsed.data;
};

const resolveAgentId = async (requester, agentId) => {
  if (!agentId) {
    return requester?.role === 'AGENT' ? requester.sub : null;
  }

  const user = await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, role: true },
  });

  if (!user || !['AGENT', 'MANAGER'].includes(user.role)) {
    const error = new Error('Agent must be an agent or manager');
    error.statusCode = 400;
    throw error;
  }

  return user.id;
};

const calculateCommission = async ({ commission, commissionRate, propertyId }) => {
  if (commission !== undefined && commission !== null) {
    return Number(commission);
  }

  if (!propertyId) {
    return null;
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { price: true },
  });

  if (!property) {
    const error = new Error('Property not found for commission calculation');
    error.statusCode = 400;
    throw error;
  }

  const rate = commissionRate ?? 2;
  return Number(((property.price * rate) / 100).toFixed(2));
};

const validateLeadAvailability = async (leadId, currentDealId) => {
  if (!leadId) return;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });

  if (!lead) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }

  const existingDeal = await prisma.deal.findFirst({
    where: {
      leadId,
      ...(currentDealId ? { NOT: { id: currentDealId } } : {}),
    },
    select: { id: true },
  });

  if (existingDeal) {
    const error = new Error('Lead already linked to another deal');
    error.statusCode = 400;
    throw error;
  }
};

export const listDeals = async (_req, res, next) => {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lead: true, property: true, agent: true, documents: true },
    });
    res.json({ data: deals });
  } catch (error) {
    next(error);
  }
};

export const getDeal = async (req, res, next) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: { lead: true, property: true, agent: true, documents: true },
    });
    if (!deal) return res.status(404).json({ message: 'Deal not found' });
    res.json({ data: deal });
  } catch (error) {
    next(error);
  }
};

export const createDeal = async (req, res, next) => {
  try {
    const payload = parseBody(createDealSchema, req.body);

    await validateLeadAvailability(payload.leadId);

    const agentId = await resolveAgentId(req.user, payload.agentId);
    const commission = await calculateCommission({
      commission: payload.commission,
      commissionRate: payload.commissionRate,
      propertyId: payload.propertyId,
    });

    const deal = await prisma.deal.create({
      data: {
        title: payload.title,
        stage: payload.stage || 'NEGOTIATION',
        commission,
        notes: payload.notes,
        leadId: payload.leadId,
        propertyId: payload.propertyId,
        agentId,
      },
      include: { lead: true, property: true, agent: true, documents: true },
    });

    res.status(201).json({ data: deal });
  } catch (error) {
    next(error);
  }
};

export const updateDeal = async (req, res, next) => {
  try {
    const payload = parseBody(updateDealSchema, req.body);

    const existingDeal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      select: { id: true, stage: true, leadId: true, propertyId: true, agentId: true, commission: true },
    });

    if (!existingDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (payload.stage && payload.stage !== existingDeal.stage) {
      const allowed = stageTransitions[existingDeal.stage] || [];
      if (!allowed.includes(payload.stage)) {
        return res.status(400).json({ message: `Invalid stage transition: ${existingDeal.stage} -> ${payload.stage}` });
      }
    }

    const nextLeadId = payload.leadId === undefined ? existingDeal.leadId : payload.leadId;
    await validateLeadAvailability(nextLeadId, existingDeal.id);

    const nextPropertyId = payload.propertyId === undefined ? existingDeal.propertyId : payload.propertyId;
    const agentId =
      payload.agentId === undefined
        ? existingDeal.agentId
        : await resolveAgentId(req.user, payload.agentId);

    const commission =
      payload.commission !== undefined || payload.commissionRate !== undefined || payload.propertyId !== undefined
        ? await calculateCommission({
            commission: payload.commission,
            commissionRate: payload.commissionRate,
            propertyId: nextPropertyId,
          })
        : existingDeal.commission;

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.stage !== undefined ? { stage: payload.stage } : {}),
        ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
        ...(payload.leadId !== undefined ? { leadId: payload.leadId } : {}),
        ...(payload.propertyId !== undefined ? { propertyId: payload.propertyId } : {}),
        ...(payload.agentId !== undefined ? { agentId } : {}),
        commission,
      },
      include: { lead: true, property: true, agent: true, documents: true },
    });

    res.json({ data: deal });
  } catch (error) {
    next(error);
  }
};

export const deleteDeal = async (req, res, next) => {
  try {
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const uploadDealDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Document file is required' });
    }

    const deal = await prisma.deal.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const host = `${req.protocol}://${req.get('host')}`;
    const url = `${host}/uploads/deals/${req.file.filename}`;

    const document = await prisma.document.create({
      data: {
        dealId: req.params.id,
        name: req.body.name || req.file.originalname,
        url,
      },
    });

    res.status(201).json({ data: document });
  } catch (error) {
    next(error);
  }
};

export const getDealSummaryReport = async (_req, res, next) => {
  try {
    const [stageGroups, closedStats, overallStats] = await Promise.all([
      prisma.deal.groupBy({
        by: ['stage'],
        _count: { _all: true },
      }),
      prisma.deal.aggregate({
        where: { stage: 'CLOSED' },
        _count: { _all: true },
        _sum: { commission: true },
      }),
      prisma.deal.aggregate({
        _count: { _all: true },
        _sum: { commission: true },
      }),
    ]);

    const stageCounts = {
      NEGOTIATION: 0,
      AGREEMENT: 0,
      CLOSED: 0,
    };

    stageGroups.forEach((group) => {
      stageCounts[group.stage] = group._count._all;
    });

    const totalDeals = overallStats._count._all || 0;
    const closedDeals = closedStats._count._all || 0;
    const conversionRate = totalDeals > 0 ? Number(((closedDeals / totalDeals) * 100).toFixed(2)) : 0;

    res.json({
      data: {
        totalDeals,
        closedDeals,
        conversionRate,
        stageCounts,
        totalCommission: Number((overallStats._sum.commission || 0).toFixed(2)),
        closedCommission: Number((closedStats._sum.commission || 0).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};
