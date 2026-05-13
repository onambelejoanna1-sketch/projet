export function notFound(req, res) {
  res.status(404).json({
    error: { code: 'route/not-found', message: `Route ${req.method} ${req.originalUrl} introuvable.` },
  });
}
