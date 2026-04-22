import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT']).default('AGENT'),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT']),
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

export const listUsers = async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const payload = parseBody(createUserSchema, req.body);
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const existing = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const payload = parseBody(updateUserRoleSchema, req.body);

    if (req.user.sub === req.params.id && payload.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Cannot downgrade your own admin role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: payload.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.user.sub === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
