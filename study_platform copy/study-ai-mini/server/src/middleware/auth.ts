// Auth middleware
import { Request, Response, NextFunction } from 'express';

const auth = (req: Request, res: Response, next: NextFunction) => {
	// Dummy middleware for JWT auth
	// Replace with actual JWT logic
	next();
};

export default auth;
