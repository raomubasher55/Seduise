import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Heart, MessageSquare, Play } from "lucide-react";
import { ForumTopic, CommunityStory } from "@/types";

const Community = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, navigate] = useLocation();
  
  // Fetch discussions
  const { data: discussions, isLoading: isLoadingDiscussions } = useQuery({
    queryKey: ['/api/community/discussions'],
  });
  
  // Fetch popular stories
  const { data: popularStories, isLoading: isLoadingStories } = useQuery({
    queryKey: ['/api/community/popular-stories'],
  });
  
  // Fetch stories by category (when a category is selected)
  const { data: categoryStories, isLoading: isLoadingCategoryStories } = useQuery({
    queryKey: ['/api/stories/by-category', selectedCategory],
    enabled: !!selectedCategory,
  });
  
  // Story categories
  const categories = [
    { id: "romance", name: "Romance", icon: "❤️", color: "#FF6B8B" },
    { id: "fantasy", name: "Fantasy", icon: "✨", color: "#8A4FFF" },
    { id: "historical", name: "Historical", icon: "📜", color: "#B78040" },
    { id: "contemporary", name: "Contemporary", icon: "🏙️", color: "#4A90E2" },
    { id: "adventure", name: "Adventure", icon: "🌋", color: "#50C878" },
    { id: "passionate", name: "Passionate", icon: "🔥", color: "#FF4500" },
    { id: "playful", name: "Playful", icon: "😏", color: "#FF9500" },
    { id: "intense", name: "Intense", icon: "⚡", color: "#9747FF" }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-['Playfair_Display'] font-bold">Community</h1>
          <Button className="bg-[#8B1E3F] hover:bg-[#A93B5B]">
            Create New Topic
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1E1E1E] border-b border-gray-800 p-0 mb-6 flex flex-wrap">
            <TabsTrigger 
              value="stories" 
              className={`px-6 py-3 ${activeTab === 'stories' ? 'border-b-2 border-[#D9B08C] text-[#D9B08C]' : 'text-gray-400'}`}
            >
              Popular Stories
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className={`px-6 py-3 ${activeTab === 'categories' ? 'border-b-2 border-[#D9B08C] text-[#D9B08C]' : 'text-gray-400'}`}
            >
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="discussions" 
              className={`px-6 py-3 ${activeTab === 'discussions' ? 'border-b-2 border-[#D9B08C] text-[#D9B08C]' : 'text-gray-400'}`}
            >
              Discussions
            </TabsTrigger>
            <TabsTrigger 
              value="writers" 
              className={`px-6 py-3 ${activeTab === 'writers' ? 'border-b-2 border-[#D9B08C] text-[#D9B08C]' : 'text-gray-400'}`}
            >
              Writers
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="discussions">
            {isLoadingDiscussions ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-[#1E1E1E] border-0 animate-pulse h-24"></Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {discussions && discussions.length > 0 ? (
                  discussions.map((topic: ForumTopic) => (
                    <DiscussionItem key={topic.id} topic={topic} />
                  ))
                ) : (
                  <Card className="bg-[#1E1E1E] border-0">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-400">No discussions found. Start a new topic!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stories">
            {isLoadingStories ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-[#1E1E1E] border-0 animate-pulse h-48"></Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {popularStories && popularStories.length > 0 ? (
                  popularStories.map((story: CommunityStory) => (
                    <PopularStoryItem key={story.id} story={story} />
                  ))
                ) : (
                  <Card className="bg-[#1E1E1E] border-0 col-span-2">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-400">No popular stories found yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="categories">
            {selectedCategory ? (
              // Show stories for selected category
              <div>
                <div className="mb-6 flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCategory(null)}
                    className="mr-4"
                  >
                    ← Back to Categories
                  </Button>
                  <h3 className="text-xl font-semibold">
                    {categories.find(c => c.id === selectedCategory)?.icon}{' '}
                    {categories.find(c => c.id === selectedCategory)?.name} Stories
                  </h3>
                </div>
                
                {isLoadingCategoryStories ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="bg-[#1E1E1E] border-0 animate-pulse h-48"></Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryStories && categoryStories.length > 0 ? (
                      categoryStories.map((story: CommunityStory) => (
                        <PopularStoryItem key={story.id} story={story} />
                      ))
                    ) : (
                      <Card className="bg-[#1E1E1E] border-0 col-span-2">
                        <CardContent className="p-6 text-center">
                          <p className="text-gray-400">No stories found in this category yet.</p>
                          <Button
                            className="mt-4 bg-[#8B1E3F] hover:bg-[#A93B5B]"
                            onClick={() => navigate("/create")}
                          >
                            Create the First Story
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Show category grid
              <div>
                <h3 className="text-xl font-semibold mb-6">Browse Stories by Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {categories.map(category => (
                    <Card 
                      key={category.id} 
                      className="bg-[#1E1E1E] border-0 hover:bg-[#2D2D2D] transition-colors cursor-pointer"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
                        <div 
                          className="text-4xl mb-2 w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }} // 20% opacity of the color
                        >
                          {category.icon}
                        </div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          View all stories
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="writers">
            <Card className="bg-[#1E1E1E] border-0">
              <CardContent className="p-6">
                <h3 className="text-xl font-['Playfair_Display'] mb-4">Coming Soon</h3>
                <p className="text-gray-400">
                  Writer profiles and leaderboards will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

interface DiscussionItemProps {
  topic: ForumTopic;
}

const DiscussionItem = ({ topic }: DiscussionItemProps) => {
  return (
    <Card className="bg-[#1E1E1E] border-0 hover:bg-[#2D2D2D] transition-colors">
      <CardContent className="p-4">
        <h4 className="font-semibold mb-1">{topic.title}</h4>
        <p className="text-sm text-gray-400 mb-2">{topic.content}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-[#574873]"></div>
            <span className="ml-2 text-xs text-gray-500">{topic.author}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <MessageSquare className="h-3 w-3 mr-1" />
            {topic.commentCount}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PopularStoryItemProps {
  story: CommunityStory;
}

const PopularStoryItem = ({ story }: PopularStoryItemProps) => {
  return (
    <Card className="bg-[#1E1E1E] border-0 hover:bg-[#2D2D2D] transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center mb-2">
          <Award className="text-[#D9B08C] mr-2" size={18} />
          <h4 className="font-semibold">{story.title}</h4>
        </div>
        <p className="text-sm text-gray-400 mb-4">{story.description}</p>
        <div className="flex justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Heart className="h-4 w-4 mr-1 text-[#A93B5B]" /> 
            <span className="mr-4">{story.likes}</span>
            <Play className="h-4 w-4 mr-1" /> 
            <span>{story.plays} plays</span>
          </div>
          <Button variant="outline" size="sm" className="text-[#D9B08C] border-[#D9B08C]">
            Read
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Community;
