  import dotenv from "dotenv";
  dotenv.config();
  import express, { type Request, Response, NextFunction } from "express";
  import path from "path";
  import { registerRoutes } from "./routes";
  import { setupVite, serveStatic, log } from "./vite";
  import fs from "fs";
  import session from "express-session";
  import { nanoid } from "nanoid";
  import connectDB from "./config/database";
  import passport from './config/passport';


  const app = express();

  // Connect to MongoDB
  connectDB();

  

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'seduise-story-app-secret-123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // In Replit dev environment, disable secure as we're using HTTP
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
      maxAge: 24 * 60 * 60 * 1000
    },    
    name: 'seduise.sid',
    genid: () => nanoid()
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // For Replit environment, we need to completely disable CSP for development purposes
  // This is not recommended for production!
  if (process.env.REPL_ID) {
    app.use((req, res, next) => {
      // Completely disable CSP in the Replit environment to avoid issues with cross-origin requests
      // Note: This is ONLY for development and would be a security risk in production
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Content-Security-Policy-Report-Only');
      next();
    });
  } else {
    // Add CSP headers for Stripe and other resources in non-Replit environments
    app.use((req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' https://*.stripe.com 'unsafe-inline' 'unsafe-eval'; frame-src https://*.stripe.com; connect-src 'self' http://localhost:* https://*.stripe.com; font-src 'self' data:;"
      );
      next();
    });
  }

  // API error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      console.error('API Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      return res.status(status).json({ message });
    }
    next(err);
  });

  // Serve static audio files
  const publicDirPath = path.join(process.cwd(), 'dist', 'public');
  app.use('/audio', express.static(path.join(publicDirPath, 'audio')));

  // Add debug logging for audio file requests
  app.use('/audio', (req, res, next) => {
    log(`Audio file request: ${req.path}`);
    const fullPath = path.join(publicDirPath, 'audio', req.path);
    log(`Looking for file at: ${fullPath}`);

    if (fs.existsSync(fullPath)) {
      log(`File exists: ${fullPath}`);
    } else {
      log(`File not found: ${fullPath}`);
    }

    next();
  });

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  (async () => {
    // Register API routes first
    const server = await registerRoutes(app);

    // Then set up Vite or static serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    const port = 5000;
    server.listen(port, () => {
      log(`serving on port ${port}`);
    });
  })();