import { useState, useEffect } from "react";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Edit, Crown, Clock, BookOpen, Eye, Heart, Save, ThumbsUp, ThumbsDown } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { updateUserProfile, getUserStories } from "@/lib/ai";

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
    queryFn: getUserStories,
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
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
    return <LoadingPage />;
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
            
            {user.badges && user.badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {user.badges.map((badge: any) => {
                  const key = badge?.id || badge?._id || badge?.name || String(badge);
                  const label = typeof badge === "string" ? badge : (badge?.name || "Badge");
                  const bg = typeof badge === "object" && badge?.color ? badge.color : "#2563eb"; // default blue-600
                  return (
                    <span
                      key={key}
                      className="px-3 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: bg }}
                      title={typeof badge === "object" ? badge?.description : undefined}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
            
            <div className="flex space-x-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs flex items-center ${
                user.role === "admin" ? "bg-[#8B1E3F] text-white" : "bg-gray-700 text-gray-200"
              }`}>
                {user.role === "admin" ? "Admin" : "User"}
              </span>
            </div>

            {/* Subscription Information */}
            <div className="w-full mb-4">
              <div className={`p-4 rounded-lg border-2 text-center ${
                user.subscription === 'intimacy' ? 'bg-gradient-to-r from-[#8B1E3F]/20 to-[#D9B08C]/20 border-[#8B1E3F]' :
                user.subscription === 'seduction' ? 'bg-gradient-to-r from-[#D9B08C]/20 to-[#8B1E3F]/20 border-[#D9B08C]' :
                user.subscription === 'essentiel' ? 'bg-[#D9B08C]/10 border-[#D9B08C]/50' :
                'bg-gray-700/20 border-gray-600'
              }`}>
                <div className="flex items-center justify-center mb-2">
                  {isPremium && <Crown className="mr-2" size={16} />}
                  <span className="font-semibold text-sm">
                    {user.subscription === 'intimacy' ? 'Intimacy Plan' :
                     user.subscription === 'seduction' ? 'Seduction Plan' :
                     user.subscription === 'essentiel' ? 'Essential Plan' :
                     'Free Plan'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {user.subscription === 'intimacy' ? 'The Ultimate Experience Without Limits' :
                   user.subscription === 'seduction' ? 'Your Pleasure Rendezvous' :
                   user.subscription === 'essentiel' ? 'Pleasure at Your Own Pace' :
                   'Explore Without Commitment'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/20 p-2 rounded">
                    <div className="font-semibold text-[#D9B08C]">{user.textCredits || 0}</div>
                    <div className="text-gray-400">Text Credits</div>
                  </div>
                  <div className="bg-black/20 p-2 rounded">
                    <div className="font-semibold text-[#8B1E3F]">{user.audioCredits || 0}</div>
                    <div className="text-gray-400">Audio Credits</div>
                  </div>
                </div>
                {!isPremium && (
                  <Button 
                    size="sm" 
                    className="mt-3 w-full bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] hover:from-[#8B1E3F] hover:to-[#D9B08C]"
                    onClick={() => navigate('/premium-upgrade')}
                  >
                    <Crown size={14} className="mr-1" />
                    Upgrade to Premium
                  </Button>
                )}
              </div>
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
                <ThumbsUp className="text-[#D9B08C] mb-2" size={24} />
                <div className="text-xl font-bold">
                  {userStories.reduce((total, story) => total + (story.upvotes || 0), 0)}
                </div>
                <div className="text-xs text-gray-400">Total Upvotes</div>
              </div>
              
              <div className="bg-[#2D2D2D] p-4 rounded-lg flex flex-col items-center">
                <ThumbsDown className="text-[#D9B08C] mb-2" size={24} />
                <div className="text-xl font-bold">
                  {userStories.reduce((total, story) => total + (story.downvotes || 0), 0)}
                </div>
                <div className="text-xs text-gray-400">Total Downvotes</div>
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

          {/* Subscription Management */}
          <Card className="bg-[#1E1E1E] p-6 mt-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Crown className="mr-2" size={20} />
              Subscription & Credits
            </h3>
            
            <div className="space-y-4">
              {/* Current Plan Display */}
              <div className={`p-4 rounded-lg border ${
                user.subscription === 'intimacy' ? 'bg-gradient-to-r from-[#8B1E3F]/10 to-[#D9B08C]/10 border-[#8B1E3F]' :
                user.subscription === 'seduction' ? 'bg-gradient-to-r from-[#D9B08C]/10 to-[#8B1E3F]/10 border-[#D9B08C]' :
                user.subscription === 'essentiel' ? 'bg-[#D9B08C]/5 border-[#D9B08C]/50' :
                'bg-gray-700/10 border-gray-600'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {user.subscription === 'intimacy' ? 'Intimacy Plan' :
                       user.subscription === 'seduction' ? 'Seduction Plan' :
                       user.subscription === 'essentiel' ? 'Essential Plan' :
                       'Free Plan'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {user.subscription === 'intimacy' ? 'The Ultimate Experience Without Limits' :
                       user.subscription === 'seduction' ? 'Your Pleasure Rendezvous' :
                       user.subscription === 'essentiel' ? 'Pleasure at Your Own Pace' :
                       'Explore Without Commitment'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {user.subscription === 'intimacy' ? '€24.99' :
                       user.subscription === 'seduction' ? '€11.99' :
                       user.subscription === 'essentiel' ? '€5.99' :
                       'Free'}
                    </div>
                    {isPremium && <div className="text-xs text-gray-400">per month</div>}
                  </div>
                </div>
                
                {/* Plan Features */}
                <div className="text-sm text-gray-300 mb-3">
                  {user.subscription === 'intimacy' && (
                    <div>✨ 25 text stories • 24 audio credits • Full premium access • Exclusive features</div>
                  )}
                  {user.subscription === 'seduction' && (
                    <div>✨ 12 text stories • 12 audio credits • Premium access • Advanced features</div>
                  )}
                  {user.subscription === 'essentiel' && (
                    <div>✨ 5 text stories • 6 audio credits • Basic premium access</div>
                  )}
                  {user.subscription === 'free' && (
                    <div>✨ 2 text stories • 1 audio credit • Public stories only</div>
                  )}
                </div>

                {/* Credits Display */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 p-3 rounded text-center">
                    <div className="text-xl font-bold text-[#D9B08C]">{user.textCredits || 0}</div>
                    <div className="text-xs text-gray-400">Text Credits</div>
                  </div>
                  <div className="bg-black/20 p-3 rounded text-center">
                    <div className="text-xl font-bold text-[#8B1E3F]">{user.audioCredits || 0}</div>
                    <div className="text-xs text-gray-400">Audio Credits</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isPremium ? (
                  <Button 
                    className="flex-1 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] hover:from-[#8B1E3F] hover:to-[#D9B08C]"
                    onClick={() => navigate('/premium-upgrade')}
                  >
                    <Crown size={16} className="mr-2" />
                    Upgrade to Premium
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      className="flex-1 border-[#D9B08C] text-[#D9B08C] hover:bg-[#D9B08C] hover:text-[#1E1E1E]"
                      onClick={() => navigate('/premium-upgrade')}
                    >
                      Change Plan
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-gray-600 hover:bg-gray-700"
                      onClick={() => navigate('/premium-upgrade')}
                    >
                      Buy More Credits
                    </Button>
                  </>
                )}
              </div>

              {/* Subscription Status */}
              <div className="text-xs text-gray-500 text-center">
                {isPremium ? (
                  <span>Your subscription is active and will renew automatically</span>
                ) : (
                  <span>Join thousands of users creating amazing stories with premium features</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
