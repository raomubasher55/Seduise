import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Search, PlusCircle, Trash2, Edit, Check, Lock, EyeOff, Eye, AlertCircle, User, Award, ChevronDown, Shield, BookOpen, HelpCircle, Heart } from "lucide-react";

// Define interfaces for our data types
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isPremium: boolean;
  createdAt: string;
}

interface Story {
  _id: string;
  title: string;
  userId: string;
  userName?: string;
  isPublic: boolean;
  createdAt: string;
  likes: number;
  plays: number;
  settings?: any;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [storySearchTerm, setStorySearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userPremiumFilter, setUserPremiumFilter] = useState("all");
  const [storyVisibilityFilter, setStoryVisibilityFilter] = useState("all");
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isPremium: false
  });

  const queryClient = useQueryClient();

  // Fetch users
  const { 
    data: users = [], 
    isLoading: usersLoading 
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch stories
  const { 
    data: stories = [], 
    isLoading: storiesLoading 
  } = useQuery<Story[]>({
    queryKey: ["/api/admin/stories"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (newUserData: typeof newUser) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUserData),
      });
      
      if (!response.ok) throw new Error("Failed to create user");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateUserDialogOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
        isPremium: false
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { _id: string }) => {
      const { _id, ...updateData } = userData;
      const response = await fetch(`/api/admin/users/${_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) throw new Error("Failed to update user");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete user");
      return userId;
    },
    onSuccess: (userId) => {
      toast({
        title: "User Deleted",
        description: "User has been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle story visibility mutation
  const toggleStoryVisibilityMutation = useMutation({
    mutationFn: async ({ storyId, isPublic }: { storyId: string; isPublic: boolean }) => {
      const response = await fetch(`/api/admin/stories/${storyId}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic }),
      });
      
      if (!response.ok) throw new Error("Failed to update story visibility");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Updated",
        description: "Story visibility has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update story visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await fetch(`/api/admin/stories/${storyId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete story");
      return storyId;
    },
    onSuccess: () => {
      toast({
        title: "Story Deleted",
        description: "Story has been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
    
    const matchesPremium = 
      userPremiumFilter === "all" || 
      (userPremiumFilter === "premium" && user.isPremium) ||
      (userPremiumFilter === "free" && !user.isPremium);
    
    return matchesSearch && matchesRole && matchesPremium;
  });

  // Filter stories based on search term and visibility filter
  const filteredStories = stories.filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(storySearchTerm.toLowerCase());
    
    const matchesVisibility = 
      storyVisibilityFilter === "all" || 
      (storyVisibilityFilter === "public" && story.isPublic) ||
      (storyVisibilityFilter === "private" && !story.isPublic);
    
    return matchesSearch && matchesVisibility;
  });

  // Handle create user
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  // Handle edit user
  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUserMutation.mutate(selectedUser);
    }
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Handle toggle story visibility
  const handleToggleStoryVisibility = (storyId: string, currentStatus: boolean) => {
    toggleStoryVisibilityMutation.mutate({ 
      storyId, 
      isPublic: !currentStatus 
    });
  };

  // Handle delete story
  const handleDeleteStory = (storyId: string) => {
    if (window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      deleteStoryMutation.mutate(storyId);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (isAuthenticated && user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      navigate("/");
    } else if (!isAuthenticated && !usersLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, user, usersLoading, navigate]);

  if (usersLoading || storiesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9B08C]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-['Playfair_Display'] font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage users, stories, and platform settings.</p>
          </div>
          <Button
            className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
            onClick={() => navigate("/")}
          >
            Back to Main Site
          </Button>
        </div>
      </div>

      <Card className="bg-[#1E1E1E] p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-[#D9B08C] bg-opacity-20">
            <Shield className="text-[#D9B08C]" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-['Playfair_Display']">Admin Tools</h2>
            <p className="text-gray-400 text-sm">You have full access to manage all aspects of the platform.</p>
          </div>
        </div>
      </Card>

      <Tabs
        defaultValue="users"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="bg-[#2D2D2D] mb-6">
          <TabsTrigger value="users">
            <User className="mr-2" size={16} />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="stories">
            <BookOpen className="mr-2" size={16} />
            Stories ({stories.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-0">
          <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search users..."
                  className="pl-10 bg-[#2D2D2D] border-gray-700"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={userRoleFilter}
                  onValueChange={setUserRoleFilter}
                >
                  <SelectTrigger className="w-32 bg-[#2D2D2D] border-gray-700">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={userPremiumFilter}
                  onValueChange={setUserPremiumFilter}
                >
                  <SelectTrigger className="w-36 bg-[#2D2D2D] border-gray-700">
                    <SelectValue placeholder="Subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="bg-[#8B1E3F] hover:bg-[#A93B5B] flex items-center"
              onClick={() => setIsCreateUserDialogOpen(true)}
            >
              <PlusCircle className="mr-2" size={16} />
              Add User
            </Button>
          </div>

          <Card className="bg-[#2D2D2D] border-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-[#3D3D3D] border-gray-700">
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Plan</TableHead>
                    <TableHead className="text-gray-300">Joined</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-400">
                        No users found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id} className="hover:bg-[#3D3D3D] border-gray-700">
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2 bg-[#574873]">
                              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="ml-2">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            user.role === "admin" ? "bg-[#8B1E3F] text-white" : "bg-gray-700 text-gray-200"
                          }`}>
                            {user.role === "admin" ? (
                              <Shield className="mr-1" size={12} />
                            ) : (
                              <User className="mr-1" size={12} />
                            )}
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            user.isPremium ? "bg-[#D9B08C] text-gray-900" : "bg-gray-700 text-gray-200"
                          }`}>
                            {user.isPremium ? (
                              <Award className="mr-1" size={12} />
                            ) : null}
                            {user.isPremium ? "Premium" : "Free"}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-[#1E1E1E] border-gray-700 hover:bg-[#2D2D2D]"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditUserDialogOpen(true);
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-[#1E1E1E] border-gray-700 hover:bg-[#2D2D2D] hover:text-red-500"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="mt-0">
          <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search stories..."
                  className="pl-10 bg-[#2D2D2D] border-gray-700"
                  value={storySearchTerm}
                  onChange={(e) => setStorySearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={storyVisibilityFilter}
                onValueChange={setStoryVisibilityFilter}
              >
                <SelectTrigger className="w-36 bg-[#2D2D2D] border-gray-700">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stories</SelectItem>
                  <SelectItem value="public">Public Only</SelectItem>
                  <SelectItem value="private">Private Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="bg-[#2D2D2D] border-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-[#3D3D3D] border-gray-700">
                    <TableHead className="text-gray-300">Title</TableHead>
                    <TableHead className="text-gray-300">Author</TableHead>
                    <TableHead className="text-gray-300">Visibility</TableHead>
                    <TableHead className="text-gray-300">Engagement</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-400">
                        No stories found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStories.map((story) => (
                      <TableRow key={story._id} className="hover:bg-[#3D3D3D] border-gray-700">
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="w-10 h-10 mr-3 rounded bg-gray-800 flex items-center justify-center text-xs">
                              {story.title.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[200px]">{story.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {story.userName || `User ${story.userId.substring(0, 6)}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Switch 
                              id={`visibility-${story._id}`} 
                              checked={story.isPublic}
                              onCheckedChange={() => handleToggleStoryVisibility(story._id, story.isPublic)}
                              className="mr-2"
                            />
                            <Label htmlFor={`visibility-${story._id}`}>
                              {story.isPublic ? (
                                <span className="flex items-center text-green-400">
                                  <Eye size={14} className="mr-1" />
                                  Public
                                </span>
                              ) : (
                                <span className="flex items-center text-gray-400">
                                  <EyeOff size={14} className="mr-1" />
                                  Private
                                </span>
                              )}
                            </Label>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center text-sm">
                              <Heart size={14} className="mr-1 text-red-400" />
                              {story.likes || 0}
                            </span>
                            <span className="flex items-center text-sm">
                              <Eye size={14} className="mr-1 text-blue-400" />
                              {story.plays || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(story.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-[#1E1E1E] border-gray-700 hover:bg-[#2D2D2D]"
                              onClick={() => navigate(`/story/${story._id}`)}
                            >
                              <BookOpen size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-[#1E1E1E] border-gray-700 hover:bg-[#2D2D2D] hover:text-red-500"
                              onClick={() => handleDeleteStory(story._id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-['Playfair_Display']">Create New User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new user to the platform. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Full Name"
                  className="bg-[#2D2D2D] border-gray-700"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  className="bg-[#2D2D2D] border-gray-700"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="bg-[#2D2D2D] border-gray-700"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger id="role" className="bg-[#2D2D2D] border-gray-700">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPremium"
                  checked={newUser.isPremium}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, isPremium: checked })}
                />
                <Label htmlFor="isPremium">Premium Account</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateUserDialogOpen(false)}
                className="bg-[#2D2D2D] border-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-['Playfair_Display']">Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditUser}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="Full Name"
                    className="bg-[#2D2D2D] border-gray-700"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Email Address"
                    className="bg-[#2D2D2D] border-gray-700"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                  >
                    <SelectTrigger id="edit-role" className="bg-[#2D2D2D] border-gray-700">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isPremium"
                    checked={selectedUser.isPremium}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, isPremium: checked })
                    }
                  />
                  <Label htmlFor="edit-isPremium">Premium Account</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditUserDialogOpen(false);
                    setSelectedUser(null);
                  }}
                  className="bg-[#2D2D2D] border-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}