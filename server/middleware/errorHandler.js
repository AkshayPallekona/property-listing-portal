const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message || 'Something went wrong';
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV !== 'production' && { details: err.details || err.stack }),
    },
  });
};

module.exports = errorHandler;
