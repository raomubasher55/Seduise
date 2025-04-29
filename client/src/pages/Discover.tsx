import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StoryCard from "@/components/StoryCard";
import { Search } from "lucide-react";
import { Story } from "@shared/schema";

const CATEGORIES = [
  "All",
  "Romance",
  "Fantasy",
  "Historical",
  "Contemporary",
  "Explicit",
];

const Discover = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");

  // Fetch stories
  const { data: stories, isLoading } = useQuery({
    queryKey: ['/api/stories'],
  });

  // Filter stories based on search term and category
  const filteredStories = stories?.filter((story: Story) => {
    const matchesSearch = searchTerm === "" || 
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === "All" || 
      (story.settings as any)?.writingTone === category || 
      (story.settings as any)?.atmosphere === category;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Discover Stories</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1E1E1E] border-gray-700 focus:border-[#D9B08C] text-white"
            />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[180px] bg-[#1E1E1E] border-gray-700 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-[#121212] border border-gray-700">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#1E1E1E] rounded-xl h-80 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {filteredStories && filteredStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story: Story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#1E1E1E] rounded-xl">
                <h3 className="text-xl font-['Playfair_Display'] mb-4">No Stories Found</h3>
                <p className="text-gray-400 mb-6">We couldn't find any stories matching your criteria.</p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setCategory("All");
                  }}
                  className="bg-[#8B1E3F] hover:bg-[#A93B5B]"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Discover;
