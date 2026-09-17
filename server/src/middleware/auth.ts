import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";

const prisma = getPrisma();

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");

    const decoded = jwt.verify(token, secret) as { id: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized: Invalid or inactive user" });
      return;
    }

    // AC-02: Block normal application screens if requiresPasswordChange is true
    if (user.requiresPasswordChange) {
      const allowedPaths = ["/api/auth/change-password", "/api/auth/logout", "/api/auth/me"];
      const currentPath = req.originalUrl.split('?')[0];
      if (!allowedPaths.includes(currentPath)) {
        res.status(403).json({ error: "Forbidden: Password change required" });
        return;
      }
    }

    res.locals.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient role permissions" });
      return;
    }
    next();
  };
};
