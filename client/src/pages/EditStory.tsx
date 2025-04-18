import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { Save, ArrowLeft, Eye, EyeOff, Trash2, Book } from "lucide-react";

interface StoryParams {
  id: string;
}

export default function EditStory() {
  const [, navigate] = useLocation();
  const params = useParams<StoryParams>();
  const { isAuthenticated } = useAuth();
  const [story, setStory] = useState({
    title: "",
    content: "",
    isPublic: true,
  });

  // Get story data
  const { data: storyData, isLoading } = useQuery({
    queryKey: [`/api/stories/${params.id}`],
    enabled: Boolean(params.id) && isAuthenticated,
    onSuccess: (data) => {
      if (data) {
        setStory({
          title: data.title || "",
          content: data.content || "",
          isPublic: data.isPublic || true,
        });
      }
    },
  });

  // Update story mutation
  const updateStoryMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; isPublic: boolean }) => {
      const response = await fetch(`/api/stories/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update story");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Updated",
        description: "Your story has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stories"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete story mutation
  const deleteStoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${params.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete story");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Deleted",
        description: "Your story has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stories"] });
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${params.id}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: !story.isPublic }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update story visibility");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setStory(prev => ({ ...prev, isPublic: data.isPublic }));
      toast({
        title: "Visibility Updated",
        description: `Story is now ${data.isPublic ? "public" : "private"}.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stories"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoryMutation.mutate(story);
  };

  // Handle delete story
  const handleDeleteStory = () => {
    if (window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      deleteStoryMutation.mutate();
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9B08C]"></div>
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-[#1E1E1E] p-6 max-w-xl mx-auto">
          <h2 className="text-xl font-['Playfair_Display'] mb-4">Story Not Found</h2>
          <p className="text-gray-400 mb-6">Sorry, we couldn't find the story you're looking for.</p>
          <Button asChild>
            <div onClick={() => navigate("/dashboard")}>Back to Dashboard</div>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-['Playfair_Display'] font-bold mb-2">Edit Story</h1>
          <p className="text-gray-400">Update your story content and settings.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D]"
            onClick={() => navigate(`/story/${params.id}`)}
          >
            <Book size={16} className="mr-2" />
            View Story
          </Button>
          <Button 
            variant="outline" 
            className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D] hover:text-red-500"
            onClick={handleDeleteStory}
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="bg-[#1E1E1E] p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-lg">Story Title</Label>
                  <Input 
                    id="title" 
                    value={story.title}
                    onChange={(e) => setStory({...story, title: e.target.value})}
                    className="bg-[#2D2D2D] border-gray-700 mt-2 text-lg"
                    placeholder="Enter a captivating title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="content" className="text-lg">Story Content</Label>
                  <Textarea 
                    id="content" 
                    value={story.content}
                    onChange={(e) => setStory({...story, content: e.target.value})}
                    className="bg-[#2D2D2D] border-gray-700 mt-2 h-96 text-base"
                    placeholder="Your story content..."
                    required
                  />
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D]"
                    onClick={() => navigate("/dashboard")}
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Dashboard
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
                    disabled={updateStoryMutation.isPending}
                  >
                    <Save size={16} className="mr-2" />
                    {updateStoryMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="bg-[#1E1E1E] p-6 sticky top-8">
            <h3 className="text-xl font-semibold mb-4">Story Settings</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="visibility" className="font-medium">Visibility</Label>
                  <Switch 
                    id="visibility" 
                    checked={story.isPublic}
                    onCheckedChange={() => toggleVisibilityMutation.mutate()}
                  />
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  {story.isPublic ? (
                    <>
                      <Eye size={14} className="mr-2 text-green-400" />
                      <span>Public - Everyone can see this story</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} className="mr-2" />
                      <span>Private - Only you can see this story</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  <p className="mb-2">Words: {story.content.split(/\s+/).length}</p>
                  <p className="mb-2">Characters: {story.content.length}</p>
                  <p>Estimated reading time: {Math.max(1, Math.ceil(story.content.split(/\s+/).length / 200))} min</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}