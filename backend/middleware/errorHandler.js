export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    data: null,
  };
  
  res.status(statusCode).json(response);
}

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: null,
    data: null,
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
