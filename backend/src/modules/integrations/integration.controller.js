import { z } from 'zod';
import { prisma } from '../../config/prisma.js';

const leadWebhookSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  budget: z.coerce.number().nonnegative().optional().nullable(),
  preferences: z.string().optional().nullable(),
  source: z.string().optional(),
  notes: z.string().optional().nullable(),
});

const portalSyncSchema = z.object({
  propertyId: z.string().min(5),
  portal: z.enum(['MAGICBRICKS', '99ACRES', 'HOUSING', 'CUSTOM']).default('CUSTOM'),
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

export const getIntegrationStatus = async (_req, res) => {
  res.json({
    data: {
      leadWebhookEnabled: true,
      webhookSecretConfigured: Boolean(process.env.INTEGRATION_WEBHOOK_SECRET),
      portalSyncWebhookConfigured: Boolean(process.env.PORTAL_SYNC_WEBHOOK_URL),
      smsWebhookConfigured: Boolean(process.env.SMS_WEBHOOK_URL),
      emailWebhookConfigured: Boolean(process.env.EMAIL_WEBHOOK_URL),
    },
  });
};

export const receiveLeadWebhook = async (req, res, next) => {
  try {
    const configuredSecret = process.env.INTEGRATION_WEBHOOK_SECRET;
    const providedSecret = req.headers['x-integration-secret'];

    if (configuredSecret && providedSecret !== configuredSecret) {
      return res.status(401).json({ message: 'Invalid integration secret' });
    }

    const payload = parseBody(leadWebhookSchema, req.body);

    const lead = await prisma.lead.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        source: payload.source || 'Webhook',
        budget: payload.budget,
        preferences: payload.preferences,
        notes: payload.notes,
        status: 'NEW',
      },
    });

    res.status(201).json({ data: { id: lead.id } });
  } catch (error) {
    next(error);
  }
};

export const syncPropertyToPortal = async (req, res, next) => {
  try {
    const payload = parseBody(portalSyncSchema, req.body);

    const property = await prisma.property.findUnique({
      where: { id: payload.propertyId },
      include: { agent: { select: { id: true, name: true, email: true } } },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const syncPayload = {
      portal: payload.portal,
      property: {
        id: property.id,
        title: property.title,
        type: property.type,
        status: property.status,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        price: property.price,
        sizeSqFt: property.sizeSqFt,
        amenities: property.amenities,
        images: property.images,
        latitude: property.latitude,
        longitude: property.longitude,
      },
      agent: property.agent,
      syncedAt: new Date().toISOString(),
    };

    if (process.env.PORTAL_SYNC_WEBHOOK_URL) {
      const response = await fetch(process.env.PORTAL_SYNC_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload),
      });

      if (!response.ok) {
        return res.status(502).json({
          message: `Portal sync webhook failed with status ${response.status}`,
        });
      }
    }

    res.json({
      data: {
        synced: true,
        portal: payload.portal,
        propertyId: property.id,
        mode: process.env.PORTAL_SYNC_WEBHOOK_URL ? 'webhook' : 'dry-run',
      },
    });
  } catch (error) {
    next(error);
  }
};
