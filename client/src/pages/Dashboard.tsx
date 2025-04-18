import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { Clock, Search, Eye, EyeOff, Plus, Trash2, Heart, Edit, BookOpen } from "lucide-react";

interface Story {
  _id: string;
  title: string;
  content: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  likes: number;
  plays: number;
  imageUrl?: string;
  audioUrl?: string;
  settings: any;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Get user stories
  const { data: stories = [], isLoading, error } = useQuery<Story[]>({
    queryKey: ["/api/user/stories"],
    enabled: isAuthenticated,
  });

  // Mutation for toggling story visibility
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const response = await fetch(`/api/stories/${id}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isPublic }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update story visibility");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Story Updated",
        description: "Visibility settings have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stories"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update story visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a story
  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete story");
      }
      
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: "Story Deleted",
        description: "Your story has been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stories"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleVisibility = (id: string, currentStatus: boolean) => {
    toggleVisibilityMutation.mutate({ id, isPublic: !currentStatus });
  };

  const handleDeleteStory = (id: string) => {
    if (window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      deleteStoryMutation.mutate(id);
    }
  };

  // Filter stories based on search term and active tab
  const filteredStories = stories.filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "public") return matchesSearch && story.isPublic;
    if (activeTab === "private") return matchesSearch && !story.isPublic;
    return matchesSearch;
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
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
        <h1 className="text-3xl font-['Playfair_Display'] font-bold mb-2">My Stories</h1>
        <p className="text-gray-400">Manage your personal collection of stories.</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search stories..."
            className="pl-10 bg-[#2D2D2D] border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          className="bg-[#8B1E3F] hover:bg-[#A93B5B] flex items-center"
          onClick={() => navigate("/create")}
        >
          <Plus className="mr-2" size={16} />
          Create New Story
        </Button>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="bg-[#2D2D2D] mb-6">
          <TabsTrigger value="all">All Stories ({stories.length})</TabsTrigger>
          <TabsTrigger value="public">Public ({stories.filter(s => s.isPublic).length})</TabsTrigger>
          <TabsTrigger value="private">Private ({stories.filter(s => !s.isPublic).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredStories.length === 0 ? (
            <Card className="bg-[#1E1E1E] p-8 text-center">
              <h3 className="text-xl font-['Playfair_Display'] mb-2">No stories found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm 
                  ? "No stories match your search criteria. Try a different search term." 
                  : "You haven't created any stories yet."}
              </p>
              <Button onClick={() => navigate("/create")}>Create Your First Story</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <StoryCard 
                  key={story._id} 
                  story={story} 
                  onToggleVisibility={handleToggleVisibility}
                  onDelete={handleDeleteStory}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StoryCardProps {
  story: Story;
  onToggleVisibility: (id: string, isPublic: boolean) => void;
  onDelete: (id: string) => void;
}

const StoryCard = ({ story, onToggleVisibility, onDelete }: StoryCardProps) => {
  const [, navigate] = useLocation();
  
  // Truncate content for display
  const truncatedContent = story.content.length > 100 
    ? `${story.content.substring(0, 100)}...` 
    : story.content;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="bg-[#2D2D2D] border-0 overflow-hidden flex flex-col h-full">
      <div 
        className="h-40 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${story.imageUrl || "https://images.unsplash.com/photo-1575299899528-a8a3dbcf8e5e?q=80&w=2070&auto=format&fit=crop"})` 
        }}
      >
        <div className="w-full h-full bg-black bg-opacity-30 flex items-end p-4">
          <div className="flex justify-between w-full items-center">
            <span className={`px-2 py-1 rounded text-xs ${story.isPublic ? 'bg-green-800' : 'bg-gray-700'}`}>
              {story.isPublic ? 'Public' : 'Private'}
            </span>
            <div className="flex space-x-1">
              <span className="bg-gray-800 px-2 py-1 rounded text-xs flex items-center">
                <Heart size={12} className="mr-1" />
                {story.likes || 0}
              </span>
              <span className="bg-gray-800 px-2 py-1 rounded text-xs flex items-center">
                <Clock size={12} className="mr-1" />
                {Math.floor((story.content.length / 5) / 60)}m
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-2 line-clamp-1">{story.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{truncatedContent}</p>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Switch 
                id={`visibility-${story._id}`} 
                checked={story.isPublic}
                onCheckedChange={() => onToggleVisibility(story._id, story.isPublic)}
              />
              <Label 
                htmlFor={`visibility-${story._id}`} 
                className="ml-2 text-sm"
              >
                {story.isPublic ? 'Public' : 'Private'}
              </Label>
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(story.createdAt || new Date().toISOString())}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 bg-[#1E1E1E] border-gray-700 hover:bg-[#2D2D2D]"
              onClick={() => navigate(`/story/${story._id}`)}
            >
              <BookOpen size={16} className="mr-1" />
              Read
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 bg-[#1E1E1E] border-gray-700 hover:bg-[#2D2D2D]"
              onClick={() => navigate(`/edit/${story._id}`)}
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 bg-[#1E1E1E] border-gray-700 hover:bg-[#2D2D2D] hover:text-red-500"
              onClick={() => onDelete(story._id)}
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};