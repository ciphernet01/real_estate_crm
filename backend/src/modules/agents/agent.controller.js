import { z } from 'zod';
import { prisma } from '../../config/prisma.js';

const assignTaskSchema = z.object({
  leadId: z.string().min(5),
  agentId: z.string().min(5),
  title: z.string().min(2),
  dueAt: z.coerce.date(),
});

const parseBody = (schema, body) => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message || 'Invalid payload');
    error.statusCode = 400;
    throw error;
  }
  return parsed.data;
};

export const getAgentPerformance = async (_req, res, next) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: { in: ['AGENT', 'MANAGER'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();

    const metrics = await Promise.all(
      agents.map(async (agent) => {
        const [assignedLeads, closedLeads, openDeals, closedDeals, dealCommissions, pendingTasks, overdueTasks] = await Promise.all([
          prisma.lead.count({ where: { assignedToId: agent.id } }),
          prisma.lead.count({ where: { assignedToId: agent.id, status: 'CLOSED' } }),
          prisma.deal.count({ where: { agentId: agent.id, stage: { not: 'CLOSED' } } }),
          prisma.deal.count({ where: { agentId: agent.id, stage: 'CLOSED' } }),
          prisma.deal.aggregate({
            where: { agentId: agent.id, stage: 'CLOSED' },
            _sum: { commission: true },
          }),
          prisma.reminder.count({
            where: {
              completed: false,
              lead: {
                assignedToId: agent.id,
              },
            },
          }),
          prisma.reminder.count({
            where: {
              completed: false,
              dueAt: { lt: now },
              lead: {
                assignedToId: agent.id,
              },
            },
          }),
        ]);

        const conversionRate = assignedLeads > 0 ? Number(((closedLeads / assignedLeads) * 100).toFixed(2)) : 0;

        return {
          ...agent,
          assignedLeads,
          closedLeads,
          conversionRate,
          openDeals,
          closedDeals,
          closedCommission: Number((dealCommissions._sum.commission || 0).toFixed(2)),
          pendingTasks,
          overdueTasks,
        };
      })
    );

    res.json({ data: metrics });
  } catch (error) {
    next(error);
  }
};

export const listAgentTasks = async (req, res, next) => {
  try {
    const mine = req.query.mine === 'true';
    const agentId = mine ? req.user.sub : req.query.agentId;

    const where = {
      completed: false,
      ...(agentId
        ? {
            lead: {
              assignedToId: agentId,
            },
          }
        : {}),
    };

    const tasks = await prisma.reminder.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            status: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dueAt: 'asc' },
      take: 200,
    });

    res.json({ data: tasks });
  } catch (error) {
    next(error);
  }
};

export const assignTaskToAgent = async (req, res, next) => {
  try {
    const payload = parseBody(assignTaskSchema, req.body);

    const [lead, agent] = await Promise.all([
      prisma.lead.findUnique({ where: { id: payload.leadId }, select: { id: true } }),
      prisma.user.findUnique({
        where: { id: payload.agentId },
        select: { id: true, role: true },
      }),
    ]);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (!agent || !['AGENT', 'MANAGER'].includes(agent.role)) {
      return res.status(400).json({ message: 'Assigned user must be an agent or manager' });
    }

    await prisma.lead.update({
      where: { id: payload.leadId },
      data: { assignedToId: payload.agentId },
    });

    const reminder = await prisma.reminder.create({
      data: {
        leadId: payload.leadId,
        title: payload.title,
        dueAt: payload.dueAt,
      },
    });

    res.status(201).json({ data: reminder });
  } catch (error) {
    next(error);
  }
};
