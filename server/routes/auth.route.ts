import { Router } from "express";
import { login, logout, getCurrentUser, signup, googleCallback } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import passport from '../config/passport';

const router = Router();

// Local authentication routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/logout', logout);
router.get('/me', authMiddleware, getCurrentUser);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    successRedirect: '/',
    session: false 
  }),
  googleCallback
);

export default router;