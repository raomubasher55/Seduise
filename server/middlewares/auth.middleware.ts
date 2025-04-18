import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { User } from "server/models/user.model";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET ;

// Initialize dotenv

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    token?: string;
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check session first
  if (req.session.userId) {
    return next();
  }

  // If no session, check JWT token
  const token = req.headers.authorization?.split(' ')[1];
  console.log("Token from headr"  , token) 
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log("Decoded JWT" , decoded)
    
    // Set session data from JWT
    req.session.userId = decoded.id ;
    req.session.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};


// Update session definition to include role
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    token?: string;
    role?: string;
  }
}

// Middleware to check if user is admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userId: string | undefined;
    let role: string | undefined;

    // 1. Check for session-based authentication
    if (req.session?.userId) {
      userId = req.session.userId;
      role = req.session.role;
    } 
    // 2. Fallback to token-based authentication
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      userId = decoded.userId;
      role = decoded.role;
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 3. Check cached role first
    if (role === "admin") {
      return next();
    }

    // 4. Fetch user from DB if role not available or uncertain
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Optionally store role in session
    if (req.session && !req.session.role) {
      req.session.role = user.role;
    }

    if (user.role === "admin") {
      return next();
    }

    return res.status(403).json({ message: "Forbidden - Admin access required" });

  } catch (error) {
    console.error("Error in isAdmin middleware:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

