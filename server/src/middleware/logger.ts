import { Request, Response, NextFunction } from 'express';

// Simple logger middleware
export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    const timestamp = new Date().toISOString();
    
    console.log(
      `[${timestamp}] ${logLevel} ${req.method} ${req.originalUrl} - ` +
      `Status: ${res.statusCode} - Duration: ${duration}ms - ` +
      `IP: ${req.ip || req.connection.remoteAddress}`
    );
  });
  
  next();
};
