import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Edit, Crown, Clock, BookOpen, Eye, Heart, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isPremium } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: ""
  });

  // Get user stories count
  const { data: userStories = [] } = useQuery<any[]>({
    queryKey: ["/api/user/stories"],
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update password");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set initial profile data from user context
  useEffect(() => {
    if (user) {
      setUserProfile({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Handle profile update
  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ name: userProfile.name });
  };

  if (!user) {
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
        <h1 className="text-3xl font-['Playfair_Display'] font-bold mb-2">Your Profile</h1>
        <p className="text-gray-400">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="md:col-span-1">
          <Card className="bg-[#1E1E1E] p-6 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-[#574873] flex items-center justify-center text-3xl mb-4">
              <Avatar className="h-32 w-32">
                <AvatarFallback className="bg-[#574873] text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
            <p className="text-gray-400 mb-3">{user.email}</p>
            
            <div className="flex space-x-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs flex items-center ${
                user.role === "admin" ? "bg-[#8B1E3F] text-white" : "bg-gray-700 text-gray-200"
              }`}>
                {user.role === "admin" ? "Admin" : "User"}
              </span>
              
              <span className={`px-3 py-1 rounded-full text-xs flex items-center ${
                isPremium ? "bg-[#D9B08C] text-gray-900" : "bg-gray-700 text-gray-200"
              }`}>
                {isPremium ? (
                  <>
                    <Crown className="mr-1" size={12} />
                    Premium
                  </>
                ) : "Free"}
              </span>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#2D2D2D] p-3 rounded-lg text-center">
                <div className="text-xl font-bold">{userStories.length}</div>
                <div className="text-xs text-gray-400">Stories</div>
              </div>
              <div className="bg-[#2D2D2D] p-3 rounded-lg text-center">
                <div className="text-xl font-bold">{userStories.filter(s => s.isPublic).length}</div>
                <div className="text-xs text-gray-400">Published</div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full border-gray-700 hover:bg-[#2D2D2D]"
              onClick={() => navigate("/dashboard")}
            >
              <BookOpen size={16} className="mr-2" />
              View My Stories
            </Button>
          </Card>
        </div>
        
        {/* Right Column - Settings */}
        <div className="md:col-span-2">
          <Card className="bg-[#1E1E1E] p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Profile Information</h3>
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 hover:bg-[#2D2D2D]"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit size={16} className="mr-2" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  disabled={!isEditing}
                  className="bg-[#2D2D2D] border-gray-700 mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={userProfile.email}
                  disabled
                  className="bg-[#2D2D2D] border-gray-700 text-gray-500 mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support for assistance.</p>
              </div>
              
              {isEditing && (
                <div className="flex justify-end mt-4">
                  <Button 
                    className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save size={16} className="mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
          
          {/* Account Statistics */}
          <Card className="bg-[#1E1E1E] p-6">
            <h3 className="text-xl font-semibold mb-6">Account Statistics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#2D2D2D] p-4 rounded-lg flex flex-col items-center">
                <BookOpen className="text-[#D9B08C] mb-2" size={24} />
                <div className="text-xl font-bold">{userStories.length}</div>
                <div className="text-xs text-gray-400">Total Stories</div>
              </div>
              
              <div className="bg-[#2D2D2D] p-4 rounded-lg flex flex-col items-center">
                <Eye className="text-[#D9B08C] mb-2" size={24} />
                <div className="text-xl font-bold">
                  {userStories.reduce((total, story) => total + (story.plays || 0), 0)}
                </div>
                <div className="text-xs text-gray-400">Total Plays</div>
              </div>
              
              <div className="bg-[#2D2D2D] p-4 rounded-lg flex flex-col items-center">
                <Heart className="text-[#D9B08C] mb-2" size={24} />
                <div className="text-xl font-bold">
                  {userStories.reduce((total, story) => total + (story.likes || 0), 0)}
                </div>
                <div className="text-xs text-gray-400">Total Likes</div>
              </div>
              
              <div className="bg-[#2D2D2D] p-4 rounded-lg flex flex-col items-center">
                <Clock className="text-[#D9B08C] mb-2" size={24} />
                <div className="text-xl font-bold">
                  {Math.floor(userStories.reduce((total, story) => {
                    // Estimate reading time (words / 200 words per minute)
                    const words = story.content ? story.content.split(/\s+/).length : 0;
                    return total + (words / 200);
                  }, 0))}
                </div>
                <div className="text-xs text-gray-400">Minutes Created</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}