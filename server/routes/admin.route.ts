import { Router } from "express";
import { isAdmin } from "../middlewares/auth.middleware";
import { User } from "../models/user.model";
import { Story } from "../models/story.model";
import { hash } from "bcrypt";

const router = Router();

// Get all users
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get a specific user
router.get("/users/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Create a new user
router.post("/users", isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, isPremium } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isPremium: isPremium || false
    });

    await newUser.save();
    
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

// Update a user
router.patch("/users/:id", isAdmin, async (req, res) => {
  try {
    const { name, email, role, isPremium } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is already used by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isPremium !== 'undefined') user.isPremium = isPremium;

    await user.save();
    
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete a user
router.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Also delete all stories by this user
    await Story.deleteMany({ userId: req.params.id });
    
    res.json({ message: "User and associated stories deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// Get all stories
router.get("/stories", isAdmin, async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    
    // Enhance stories with author names
    const enhancedStories = await Promise.all(stories.map(async (story) => {
      const user = await User.findById(story.userId).select("name");
      const storyObj = story.toObject();
      storyObj.userName = user ? user.name : "Unknown User";
      return storyObj;
    }));
    
    res.json(enhancedStories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

// Toggle story visibility
router.patch("/stories/:id/visibility", isAdmin, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const storyId = req.params.id;
    
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    story.isPublic = isPublic;
    await story.save();
    
    res.json(story);
  } catch (error) {
    console.error("Error updating story visibility:", error);
    res.status(500).json({ message: "Failed to update story visibility" });
  }
});

// Delete a story
router.delete("/stories/:id", isAdmin, async (req, res) => {
  try {
    const result = await Story.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ message: "Failed to delete story" });
  }
});

export default router;