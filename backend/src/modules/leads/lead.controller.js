import { prisma } from '../../config/prisma.js';
import { z } from 'zod';

const leadStatus = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'LOST'];

const statusTransitions = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CLOSED', 'LOST'],
  CLOSED: [],
  LOST: [],
};

const createLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  source: z.string().min(2),
  budget: z.coerce.number().nonnegative().optional().nullable(),
  preferences: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(leadStatus).optional(),
  assignedToId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

const updateLeadSchema = createLeadSchema
  .omit({ source: true, name: true })
  .extend({
    name: z.string().min(2).optional(),
    source: z.string().min(2).optional(),
  })
  .partial();

const reminderSchema = z.object({
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

const getDefaultAssigneeId = async (requester) => {
  if (requester?.role === 'AGENT') {
    return requester.sub;
  }

  const leastLoadedAgent = await prisma.user.findFirst({
    where: { role: 'AGENT' },
    orderBy: { leads: { _count: 'asc' } },
    select: { id: true },
  });

  return leastLoadedAgent?.id || null;
};

const resolveAssigneeId = async (requester, assignedToId) => {
  if (!assignedToId) {
    return getDefaultAssigneeId(requester);
  }

  const user = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { id: true, role: true },
  });

  if (!user || !['AGENT', 'MANAGER'].includes(user.role)) {
    const error = new Error('Assigned user must be an agent or manager');
    error.statusCode = 400;
    throw error;
  }

  return user.id;
};

export const listLeads = async (req, res, next) => {
  try {
    const status = req.query.status;
    const assignedToId = req.query.assignedToId;

    const where = {
      ...(status ? { status } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    };

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: true },
    });
    res.json({ data: leads });
  } catch (error) {
    next(error);
  }
};

export const getLead = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { assignedTo: true, interactions: true, reminders: true },
    });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ data: lead });
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req, res, next) => {
  try {
    const payload = parseBody(createLeadSchema, req.body);
    const assignedToId = await resolveAssigneeId(req.user, payload.assignedToId);

    const lead = await prisma.lead.create({
      data: {
        ...payload,
        assignedToId,
      },
      include: {
        assignedTo: true,
      },
    });
    res.status(201).json({ data: lead });
  } catch (error) {
    next(error);
  }
};

export const createCapturedLead = async (req, res, next) => {
  try {
    const payload = parseBody(
      createLeadSchema.omit({ source: true }).extend({ source: z.string().optional() }),
      req.body
    );

    const lead = await prisma.lead.create({
      data: {
        ...payload,
        source: payload.source || 'Website',
        status: 'NEW',
      },
    });

    res.status(201).json({ data: lead });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const payload = parseBody(updateLeadSchema, req.body);

    const existingLead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true },
    });

    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (payload.status && payload.status !== existingLead.status) {
      const allowedTransitions = statusTransitions[existingLead.status] || [];
      if (!allowedTransitions.includes(payload.status)) {
        return res.status(400).json({
          message: `Invalid status transition: ${existingLead.status} -> ${payload.status}`,
        });
      }
    }

    const assignedToId =
      payload.assignedToId === undefined
        ? undefined
        : await resolveAssigneeId(req.user, payload.assignedToId);

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...payload,
        ...(assignedToId === undefined ? {} : { assignedToId }),
      },
      include: {
        assignedTo: true,
      },
    });
    res.json({ data: lead });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listUpcomingReminders = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + days);

    const reminders = await prisma.reminder.findMany({
      where: {
        completed: false,
        dueAt: {
          gte: now,
          lte: until,
        },
      },
      orderBy: { dueAt: 'asc' },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    res.json({ data: reminders });
  } catch (error) {
    next(error);
  }
};

export const addLeadReminder = async (req, res, next) => {
  try {
    const payload = parseBody(reminderSchema, req.body);

    const lead = await prisma.lead.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        leadId: req.params.id,
        title: payload.title,
        dueAt: payload.dueAt,
      },
    });

    res.status(201).json({ data: reminder });
  } catch (error) {
    next(error);
  }
};

export const markReminderCompleted = async (req, res, next) => {
  try {
    const reminder = await prisma.reminder.update({
      where: { id: req.params.reminderId },
      data: { completed: true },
    });

    res.json({ data: reminder });
  } catch (error) {
    next(error);
  }
};
