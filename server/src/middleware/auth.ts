import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import User from "../models/User";

interface AuthenticatedRequest extends Request {
  user?: any;
}

interface JwtPayload {
  user_id: number;
  email: string;
  role: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.log("❌ Auth middleware: No token provided");
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.user = decoded;
    console.log(
      "✅ Auth middleware: Token verified for user",
      decoded.email,
      "role:",
      decoded.role
    );
    next();
  } catch (error: any) {
    console.log("❌ Auth middleware: Invalid token -", error.message);

    // Provide specific error message for expired tokens
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Invalid token.",
        details: "Token has expired. Please login again.",
      });
    }

    res.status(401).json({
      message: "Invalid token.",
      details: error.message,
    });
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

export const coordinatorOnly = roleMiddleware(["coordinator"]);
export const teacherOnly = roleMiddleware(["teacher"]);
export const studentOnly = roleMiddleware(["student"]);
export const teacherOrCoordinator = roleMiddleware(["teacher", "coordinator"]);

export default authMiddleware;
