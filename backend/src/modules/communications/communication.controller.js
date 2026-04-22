import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { sendEmail, sendSms } from '../../utils/notifier.js';

const activitySchema = z.object({
  leadId: z.string().min(5),
  channel: z.enum(['CALL', 'SMS', 'EMAIL']),
  content: z.string().min(2),
});

const followupSchema = z.object({
  leadId: z.string().min(5),
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

export const getTimeline = async (req, res, next) => {
  try {
    const leadId = req.query.leadId;
    const limit = Number(req.query.limit || 50);

    const timeline = await prisma.interaction.findMany({
      where: {
        ...(leadId ? { leadId } : {}),
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            assignedTo: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
    });

    res.json({ data: timeline });
  } catch (error) {
    next(error);
  }
};

export const logActivity = async (req, res, next) => {
  try {
    const payload = parseBody(activitySchema, req.body);

    const lead = await prisma.lead.findUnique({
      where: { id: payload.leadId },
      select: { id: true },
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const interaction = await prisma.interaction.create({
      data: {
        leadId: payload.leadId,
        type: payload.channel,
        content: payload.content,
      },
    });

    res.status(201).json({ data: interaction });
  } catch (error) {
    next(error);
  }
};

export const scheduleFollowup = async (req, res, next) => {
  try {
    const payload = parseBody(followupSchema, req.body);

    const lead = await prisma.lead.findUnique({
      where: { id: payload.leadId },
      select: { id: true },
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

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

export const getPendingNotifications = async (req, res, next) => {
  try {
    const windowHours = Number(req.query.windowHours || 24);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    const [overdue, upcoming] = await Promise.all([
      prisma.reminder.findMany({
        where: {
          completed: false,
          dueAt: { lt: now },
        },
        include: {
          lead: {
            select: { id: true, name: true, phone: true, email: true, status: true },
          },
        },
        orderBy: { dueAt: 'asc' },
        take: 100,
      }),
      prisma.reminder.findMany({
        where: {
          completed: false,
          dueAt: { gte: now, lte: windowEnd },
        },
        include: {
          lead: {
            select: { id: true, name: true, phone: true, email: true, status: true },
          },
        },
        orderBy: { dueAt: 'asc' },
        take: 100,
      }),
    ]);

    res.json({
      data: {
        windowHours,
        overdueCount: overdue.length,
        upcomingCount: upcoming.length,
        overdue,
        upcoming,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const dispatchPendingNotifications = async (req, res, next) => {
  try {
    const now = new Date();
    const dueReminders = await prisma.reminder.findMany({
      where: {
        completed: false,
        dueAt: { lte: now },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
          },
        },
      },
      take: 100,
      orderBy: { dueAt: 'asc' },
    });

    const results = [];

    for (const reminder of dueReminders) {
      const lead = reminder.lead;
      const message = `Follow-up pending: ${lead.name} - ${reminder.title}`;

      let smsStatus = { sent: false, reason: 'no-phone' };
      let emailStatus = { sent: false, reason: 'no-email' };

      if (lead.phone) {
        try {
          smsStatus = await sendSms({
            to: lead.phone,
            message,
            meta: { leadId: lead.id, reminderId: reminder.id },
          });
        } catch (error) {
          smsStatus = { sent: false, reason: error.message };
        }
      }

      if (lead.email) {
        try {
          emailStatus = await sendEmail({
            to: lead.email,
            subject: 'CRM Follow-up Reminder',
            message,
            meta: { leadId: lead.id, reminderId: reminder.id },
          });
        } catch (error) {
          emailStatus = { sent: false, reason: error.message };
        }
      }

      await prisma.interaction.create({
        data: {
          leadId: lead.id,
          type: 'AUTO_FOLLOWUP',
          content: `Reminder dispatched: ${reminder.title} | sms=${smsStatus.sent} email=${emailStatus.sent}`,
        },
      });

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { completed: true },
      });

      results.push({
        reminderId: reminder.id,
        leadId: lead.id,
        smsStatus,
        emailStatus,
      });
    }

    res.json({
      data: {
        processed: results.length,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};
