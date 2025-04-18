import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Heart, MessageSquare, Play } from "lucide-react";
import { ForumTopic, CommunityStory } from "@/types";

const Community = () => {
  const [activeTab, setActiveTab] = useState("discussions");
  
  // Fetch discussions
  const { data: discussions, isLoading: isLoadingDiscussions } = useQuery({
    queryKey: ['/api/community/discussions'],
  });
  
  // Fetch popular stories
  const { data: popularStories, isLoading: isLoadingStories } = useQuery({
    queryKey: ['/api/community/popular-stories'],
  });

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
          <TabsList className="bg-[#1E1E1E] border-b border-gray-800 p-0 mb-6">
            <TabsTrigger 
              value="discussions" 
              className={`px-6 py-3 ${activeTab === 'discussions' ? 'border-b-2 border-[#D9B08C] text-[#D9B08C]' : 'text-gray-400'}`}
            >
              Discussions
            </TabsTrigger>
            <TabsTrigger 
              value="stories" 
              className={`px-6 py-3 ${activeTab === 'stories' ? 'border-b-2 border-[#D9B08C] text-[#D9B08C]' : 'text-gray-400'}`}
            >
              Popular Stories
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
