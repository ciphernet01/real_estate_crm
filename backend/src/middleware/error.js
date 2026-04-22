export const notFound = (_req, _res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Always log server errors
  if (statusCode >= 500) {
    console.error(`[${req.requestId || '-'}] ${error.stack || error.message}`);
  }

  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    ...(isProduction ? {} : { stack: error.stack }),
    requestId: req.requestId,
  });
};
