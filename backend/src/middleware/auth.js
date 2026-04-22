import jwt from 'jsonwebtoken';

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    const error = new Error('Invalid token');
    error.statusCode = 401;
    next(error);
  }
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    return next(error);
  }
  next();
};
