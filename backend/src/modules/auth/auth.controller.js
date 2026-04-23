import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';

export const login = async (req, res, next) => {
  try {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const listAssignableUsers = async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['AGENT', 'MANAGER'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};

export const bootstrapAdmin = async (req, res, next) => {
  try {
    const configuredToken = process.env.BOOTSTRAP_TOKEN;
    const requestToken = req.get('x-bootstrap-token');

    if (!configuredToken) {
      return res.status(404).json({ message: 'Bootstrap endpoint is disabled' });
    }

    if (!requestToken || requestToken !== configuredToken) {
      return res.status(403).json({ message: 'Invalid bootstrap token' });
    }

    const passwordToSet = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await bcrypt.hash(passwordToSet, 10);

    await prisma.user.upsert({
      where: { email: 'admin@crm.local' },
      update: {
        name: 'System Admin',
        password: passwordHash,
        role: 'ADMIN',
      },
      create: {
        name: 'System Admin',
        email: 'admin@crm.local',
        password: passwordHash,
        role: 'ADMIN',
      },
    });

    return res.json({
      ok: true,
      message: 'Admin credentials reset successfully',
      email: 'admin@crm.local',
    });
  } catch (error) {
    next(error);
  }
};
