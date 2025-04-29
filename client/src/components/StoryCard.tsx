import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Story } from "@shared/schema";

interface StoryCardProps {
  story: Story;
}

const StoryCard = ({ story }: StoryCardProps) => {
  return (
    <Link href={`/story/${story.id}`}>
      <a>
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
                  {story.userId ? "U" + story.userId : "SG"}
                </div>
                <span className="ml-2 text-xs text-gray-400">by Author</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 text-[#A93B5B] mr-1" />
                <span className="text-xs text-gray-400">{story.likes}</span>
              </div>
            </div>
          </div>
        </Card>
      </a>
    </Link>
  );
};

export default StoryCard;
