import { Request, Response } from "express";
import { login as loginService, signup as signupService } from "../services/auth.service";
import { User } from "../models/user.model";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const { user, token } = await loginService(email, password);
    
    // Set session data
    req.session.userId = user._id.toString();
    req.session.token = token;
    req.session.role = user.role;
    
    res.status(200).json({ 
      user: {
        ...user.toJSON(),
        isPremium: user.isPremium || false
      },
      token 
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Email, password, and name are required" });
  }
  try {
    const { user, token } = await signupService(email, password, name);
    
    // Set session data
    req.session.userId = user._id.toString();
    req.session.token = token;
    req.session.role = user.role;
    
    res.status(201).json({ 
      user: {
        ...user.toJSON(),
        isPremium: user.isPremium || false
      },
      token 
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie('seduise.sid');
    res.status(200).json({ message: "Logged out successfully" });
  });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Store role in session for future requests
    req.session.role = user.role;
    
    // Convert to JSON and ensure isPremium is included
    const userJson = user.toJSON();
    
    // Add isPremium field for compatibility with client
    res.status(200).json({
      ...userJson,
      isPremium: user.isPremium || false
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
};

// Handler for Google OAuth callback
export const googleCallback = (req: Request, res: Response) => {
  try {
    // The user should be authenticated by passport at this point
    if (!req.user) {
      console.error('Google OAuth callback: No user in request');
      return res.redirect('/?error=authentication-failed');
    }

    console.log('Google OAuth callback: User authenticated successfully');
    
    // Set session data
    const user = req.user as any;
    req.session.userId = user._id.toString();
    req.session.role = user.role;

    // Create a token for the client
    const token = user.generateAuthToken();
    
    // Store token in session for API calls
    req.session.token = token;
    
    // Log the token (first few chars for debugging)
    const tokenPreview = token.substring(0, 10) + '...';
    console.log(`Generated auth token: ${tokenPreview}`);
    
    // For SPA, redirect to homepage with token in query params
    
    // The Home component will handle storing it in localStorage
    res.redirect(`/?token=${token}&googleAuth=success`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect('/?error=google-auth-failed');
  }
};
