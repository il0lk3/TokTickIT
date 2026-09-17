import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPrisma } from "../prisma.js";
import { authenticateToken } from "../middleware/auth.js";

export const authRouter = Router();
const prisma = getPrisma();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // AC-07, BR-01: generic failure without exposing account status
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: "2h" });

    res.cookie("accessToken", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      requiresPasswordChange: user.requiresPasswordChange
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  res.status(200).json({ success: true });
});

authRouter.get("/me", authenticateToken, (req, res) => {
  const user = res.locals.user;
  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    requiresPasswordChange: user.requiresPasswordChange
  });
});

authRouter.post("/change-password", authenticateToken, async (req, res) => {
  const user = res.locals.user;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ error: "Current, new, and confirm passwords are required" });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: "New passwords do not match" });
    return;
  }

  try {
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid current password" });
      return;
    }

    // Password strength validation
    const hasMinLength = newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword);

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      res.status(400).json({ error: "Password does not meet complexity requirements" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        requiresPasswordChange: false
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
