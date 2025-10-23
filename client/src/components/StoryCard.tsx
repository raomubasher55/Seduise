import { Heart, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Story } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StoryCardProps {
  story: Story;
}

const StoryCard = ({ story }: StoryCardProps) => {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/like`);
      if (!response.ok) {
        throw new Error("Failed to like story");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch stories and update like count
      queryClient.invalidateQueries({ queryKey: ['publicStories'] });
      queryClient.invalidateQueries({ queryKey: ['premiumStories'] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${story._id}`] });
    },
    onError: (error) => {
      console.error("Error liking story:", error);
      // Optionally show a toast notification
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/upvote`);
      if (!response.ok) {
        throw new Error("Failed to upvote story");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publicStories'] });
      queryClient.invalidateQueries({ queryKey: ['premiumStories'] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${story._id}`] });
    },
    onError: (error) => {
      console.error("Error upvoting story:", error);
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/downvote`);
      if (!response.ok) {
        throw new Error("Failed to downvote story");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['publicStories'] });
      queryClient.invalidateQueries({ queryKey: ['premiumStories'] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${story._id}`] });
    },
    onError: (error) => {
      console.error("Error downvoting story:", error);
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to story reader
    likeMutation.mutate(story._id);
  };

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    upvoteMutation.mutate(story._id);
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    downvoteMutation.mutate(story._id);
  };

  return (
    <div className="cursor-pointer" onClick={() => window.location.href = `/story/${story._id}`}>
      <Card className="story-card bg-[#1E1E1E] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div 
          className="h-48 bg-cover bg-center" 
          style={{ backgroundImage: `url('${story.imageUrl || 'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'}')` }}
        >
          <div className="w-full h-full bg-gradient-to-t from-[#121212] to-transparent p-4 flex flex-col justify-end">
            <div className="flex justify-between items-center">
              <span className="bg-[#8B1E3F]/80 text-white text-xs px-2 py-1 rounded-full">
                {(story.settings as any)?.writingTone || "Romance"}
              </span>
              <span className="bg-[#1E1E1E]/80 text-white text-xs px-2 py-1 rounded-full flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m-2.828-9.9a9 9 0 0112.728 0" />
                </svg>
                {Math.floor((story.content.length / 5) / 60)} min
              </span>
            </div>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-2">{story.title}</h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {story.content.substring(0, 120)}...
          </p>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-[#574873] flex items-center justify-center text-xs">
                {/* {story.userId ? "U" + story.userId : "SG"} */}
              </div>
              {/* <span className="ml-2 text-xs text-gray-400">by Author</span> */}
            </div>
            <div className="flex items-center">
              <button onClick={handleLike} disabled={likeMutation.isPending}>
                <Heart className="h-4 w-4 text-[#A93B5B] mr-1" fill={story.hasLiked ? "#A93B5B" : "none"} />
              </button>
              <span className="text-xs text-gray-400">{story.likes}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={handleUpvote} disabled={upvoteMutation.isPending}>
                <ThumbsUp className="h-4 w-4 text-blue-400" fill={story.hasUpvoted ? "#60A5FA" : "none"} />
              </button>
              <span className="text-xs text-gray-400">{story.upvotes}</span>
              <button onClick={handleDownvote} disabled={downvoteMutation.isPending}>
                <ThumbsDown className="h-4 w-4 text-red-400" fill={story.hasDownvoted ? "#F87171" : "none"} />
              </button>
              <span className="text-xs text-gray-400">{story.downvotes}</span>
            </div>
          </div>
          {story.authorBadges && (
            (Array.isArray(story.authorBadges) && (
              story.authorBadges.includes("Top Author" as any) ||
              (story.authorBadges as any[]).some((b: any) => typeof b === 'object' && b?.name === 'Top Author')
            ))
          ) && (
            <div className="mt-2 text-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Star className="-ml-0.5 mr-1 h-3 w-3" />
                Top Author
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StoryCard;
