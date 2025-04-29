import { User } from "../models/user.model";

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid password");
  }
  const token = user.generateAuthToken();
  return { user, token };
};

export const signup = async (email: string, password: string, name: string) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Create new user
  const user = new User({
    email,
    password,
    name,
    role: "user"
  });

  await user.save();
  const token = user.generateAuthToken();
  return { user, token };
};




