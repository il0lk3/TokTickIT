import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "../prisma.js";
import { Prisma } from "@prisma/client";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const adminRouter = Router();
const prisma = getPrisma();

// Apply auth middleware to all admin routes
adminRouter.use(authenticateToken);
adminRouter.use(requireRole(["ADMINISTRATOR"]));

// Helper for password validation
function validatePassword(password: string): boolean {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
  return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

// GET /api/admin/users
adminRouter.get("/users", async (req: Request, res: Response) => {
  const { search, role } = req.query;

  const where: Prisma.UserWhereInput = {};
  if (search && typeof search === 'string') {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (role) {
    if (!["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role as string)) {
      return res.status(400).json({ error: "Invalid role filter" });
    }
    where.role = role as string;
  }

  try {
    const users = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      items: users,
      filtersApplied: { role: role || undefined }
    });
  } catch (error) {
    console.error("GET /admin/users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users
adminRouter.post("/users", async (req: Request, res: Response) => {
  const { name, email, role, active, initialPassword } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: "Name is required" });
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  if (!role || !["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
    return res.status(400).json({ error: "Valid role is required" });
  }

  if (!initialPassword || typeof initialPassword !== 'string' || !validatePassword(initialPassword)) {
    return res.status(400).json({ error: "Password does not meet complexity requirements" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Duplicate email check
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);
    
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role,
        isActive: active !== undefined ? Boolean(active) : true,
        requiresPasswordChange: true,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("POST /admin/users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id
adminRouter.patch("/users/:id", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const currentAdminId = res.locals.user.id;
  const { name, email, role, active } = req.body;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (name && typeof name === 'string' && name.trim() !== '') {
      updateData.name = name.trim();
    }
    
    if (email && typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email)) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== targetUser.email) {
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
          return res.status(409).json({ error: "Email already in use" });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (role && ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      if (userId === currentAdminId && role !== targetUser.role) {
        return res.status(400).json({ error: "Cannot change your own role" });
      }
      updateData.role = role;
    }

    if (active !== undefined) {
      updateData.isActive = Boolean(active);
    }

    // Safety guard: self-deactivation
    if (userId === currentAdminId && updateData.isActive === false) {
      return res.status(409).json({ error: "Cannot deactivate your own account" });
    }

    // Safety guard: removing the last active administrator
    if (targetUser.role === 'ADMINISTRATOR' && targetUser.isActive) {
      const changingRole = updateData.role !== undefined && updateData.role !== 'ADMINISTRATOR';
      const deactivating = updateData.isActive === false;
      
      if (changingRole || deactivating) {
        // Count active administrators EXCLUDING this user
        const otherAdminsCount = await prisma.user.count({
          where: {
            id: { not: userId },
            role: 'ADMINISTRATOR',
            isActive: true
          }
        });
        
        if (otherAdminsCount === 0) {
          return res.status(409).json({ error: "Cannot remove or deactivate the last active administrator" });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("PATCH /admin/users/:id error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/:id/initial-password
adminRouter.post("/users/:id/initial-password", async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const { newInitialPassword } = req.body;

  if (!newInitialPassword || typeof newInitialPassword !== 'string' || !validatePassword(newInitialPassword)) {
    return res.status(400).json({ error: "Password does not meet complexity requirements" });
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(newInitialPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        requiresPasswordChange: true
      },
      select: {
        id: true,
        name: true,
        requiresPasswordChange: true
      }
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("POST /admin/users/:id/initial-password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default adminRouter;
