import { prisma } from '../../config/prisma.js';
import { z } from 'zod';

const propertyType = ['RESIDENTIAL', 'COMMERCIAL'];
const propertyStatus = ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED'];

const toOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const parseImagesInput = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value)) return value.filter(Boolean).join(',');
  if (typeof value === 'string') return value;
  return null;
};

const propertySchema = z.object({
  title: z.string().min(3),
  type: z.enum(propertyType),
  status: z.enum(propertyStatus).optional(),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  sizeSqFt: z.coerce.number().nonnegative().optional().nullable(),
  amenities: z.string().optional().nullable(),
  images: z.any().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

const updatePropertySchema = propertySchema.partial();

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

const normalizePropertyPayload = async (payload, requester) => {
  const resolvedAgentId = await resolveAgentId(requester, payload.agentId);

  const normalized = {
    ...payload,
    agentId: resolvedAgentId,
  };

  if (payload.price !== undefined) {
    normalized.price = Number(payload.price);
  }

  if (payload.sizeSqFt !== undefined) {
    normalized.sizeSqFt = toOptionalNumber(payload.sizeSqFt);
  }

  if (payload.latitude !== undefined) {
    normalized.latitude = toOptionalNumber(payload.latitude);
  }

  if (payload.longitude !== undefined) {
    normalized.longitude = toOptionalNumber(payload.longitude);
  }

  if (payload.images !== undefined) {
    normalized.images = parseImagesInput(payload.images);
  }

  return normalized;
};

export const listProperties = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const type = req.query.type;
    const status = req.query.status;
    const city = req.query.city;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

    const where = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { amenities: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { agent: true },
    });
    res.json({ data: properties });
  } catch (error) {
    next(error);
  }
};

export const getProperty = async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { agent: true, deals: true },
    });
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json({ data: property });
  } catch (error) {
    next(error);
  }
};

export const createProperty = async (req, res, next) => {
  try {
    const payload = parseBody(propertySchema, req.body);
    const normalized = await normalizePropertyPayload(payload, req.user);

    const property = await prisma.property.create({
      data: normalized,
      include: { agent: true },
    });
    res.status(201).json({ data: property });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req, res, next) => {
  try {
    const payload = parseBody(updatePropertySchema, req.body);

    const existingProperty = await prisma.property.findUnique({
      where: { id: req.params.id },
      select: { id: true, agentId: true },
    });

    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const normalized = await normalizePropertyPayload(
      {
        ...payload,
        agentId: payload.agentId === undefined ? existingProperty.agentId : payload.agentId,
      },
      req.user
    );

    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: normalized,
      include: { agent: true },
    });
    res.json({ data: property });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (req, res, next) => {
  try {
    await prisma.property.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const uploadPropertyImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const host = `${req.protocol}://${req.get('host')}`;
    const url = `${host}/uploads/properties/${req.file.filename}`;

    res.status(201).json({ data: { url } });
  } catch (error) {
    next(error);
  }
};
