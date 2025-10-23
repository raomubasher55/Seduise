import { Router } from "express";
import { isAdmin } from "../middlewares/auth.middleware";
import { getAllUsers, getUser, createUser, updateUser, deleteUser, getAllStories, updateStoryVisibility, deleteStory, awardTopAuthor } from "../controllers/admin.controller";

const router = Router();

// Users
router.get("/users", isAdmin, getAllUsers);
router.get("/users/:id", isAdmin, getUser);
router.post("/users", isAdmin, createUser);
router.patch("/users/:id", isAdmin, updateUser);
router.delete("/users/:id", isAdmin, deleteUser);

// Stories
router.get("/stories", isAdmin, getAllStories);
router.patch("/stories/:id/visibility", isAdmin, updateStoryVisibility);
router.delete("/stories/:id", isAdmin, deleteStory);

// Awards
router.post("/award-top-author", isAdmin, awardTopAuthor);

export default router;
