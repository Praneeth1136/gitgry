export function validateRequest(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors?.map(e => ({ path: e.path.join('.'), message: e.message })) || error.message,
      });
    }
  };
}

