import { prisma } from '../../config/prisma.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  type: z.enum(['BUYER', 'SELLER', 'BOTH']).optional().nullable(),
  preferences: z.string().optional().nullable(),
});

const updateClientSchema = clientSchema.partial();

const interactionSchema = z.object({
  type: z.enum(['CALL', 'SMS', 'EMAIL', 'MEETING', 'NOTE']).default('NOTE'),
  content: z.string().min(2),
  occurredAt: z.coerce.date().optional(),
});

const linkLeadSchema = z.object({
  leadId: z.string().min(5),
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

const parseHistory = (history) => {
  if (!history) return [];
  try {
    const parsed = JSON.parse(history);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toClientResponse = (client) => {
  const interactions = parseHistory(client.history);
  return {
    ...client,
    interactions,
    interactionsCount: interactions.length,
    history: undefined,
  };
};

export const listClients = async (_req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        leads: {
          select: {
            id: true,
            name: true,
            status: true,
            deal: {
              select: {
                id: true,
                title: true,
                stage: true,
              },
            },
          },
        },
      },
    });

    res.json({
      data: clients.map((client) => ({
        ...toClientResponse(client),
        dealsCount: client.leads.filter((lead) => Boolean(lead.deal)).length,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        leads: {
          include: {
            deal: true,
          },
        },
      },
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ data: toClientResponse(client) });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const payload = parseBody(clientSchema, req.body);
    const client = await prisma.client.create({ data: payload });
    res.status(201).json({ data: client });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const payload = parseBody(updateClientSchema, req.body);
    const client = await prisma.client.update({ where: { id: req.params.id }, data: payload });
    res.json({ data: client });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listClientInteractions = async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      select: { id: true, history: true },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ data: parseHistory(client.history) });
  } catch (error) {
    next(error);
  }
};

export const addClientInteraction = async (req, res, next) => {
  try {
    const payload = parseBody(interactionSchema, req.body);

    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      select: { id: true, history: true },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const interactions = parseHistory(client.history);
    const newEntry = {
      id: randomUUID(),
      type: payload.type,
      content: payload.content,
      occurredAt: (payload.occurredAt || new Date()).toISOString(),
      createdAt: new Date().toISOString(),
    };

    interactions.unshift(newEntry);

    await prisma.client.update({
      where: { id: req.params.id },
      data: { history: JSON.stringify(interactions) },
    });

    res.status(201).json({ data: newEntry });
  } catch (error) {
    next(error);
  }
};

export const linkLeadToClient = async (req, res, next) => {
  try {
    const payload = parseBody(linkLeadSchema, req.body);

    const client = await prisma.client.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const lead = await prisma.lead.findUnique({ where: { id: payload.leadId }, select: { id: true } });
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await prisma.lead.update({
      where: { id: payload.leadId },
      data: { clientId: client.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const unlinkLeadFromClient = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: {
        id: req.params.leadId,
        clientId: req.params.id,
      },
      select: { id: true },
    });

    if (!lead) {
      return res.status(404).json({ message: 'Linked lead not found' });
    }

    await prisma.lead.update({
      where: { id: req.params.leadId },
      data: { clientId: null },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listClientDeals = async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const deals = await prisma.deal.findMany({
      where: {
        lead: {
          clientId: req.params.id,
        },
      },
      include: {
        lead: {
          select: { id: true, name: true, status: true },
        },
        property: {
          select: { id: true, title: true, city: true },
        },
        agent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: deals });
  } catch (error) {
    next(error);
  }
};
