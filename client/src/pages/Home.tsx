import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen } from "lucide-react";
import StoryCard from "@/components/StoryCard";
import { useQuery } from "@tanstack/react-query";
import { Story } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  // Check for Google login token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const googleAuth = params.get('googleAuth');
    const error = params.get('error');
    
    // Handle Google auth error
    if (error) {
      toast({
        title: "Google authentication failed",
        description: error,
        variant: "destructive"
      });
      
      // Remove the error from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    // Log the search params for debugging
    console.log("URL search params:", { token: !!token, googleAuth, error });
    
    if (token && googleAuth === 'success') {
      // Store the token
      localStorage.setItem('token', token);
      
      // Remove the token from URL (for security)
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Refresh the user data
      refreshUser();
      
      // Invalidate the auth query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Show success message
      toast({
        title: "Login successful",
        description: "You're now signed in with Google!",
      });
    }
  }, [toast, refreshUser]);
  
  // Fetch public stories for homepage
  const { data: publicStories = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/stories/public'],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="relative mb-16 rounded-2xl overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#1E1E1E] to-[#2B2240] p-8 md:p-16 rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-20" 
               style={{ 
                 backgroundImage: `url('https://images.unsplash.com/photo-1551197544-69cdaac2a512?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                 backgroundSize: 'cover' 
               }}>
          </div>
          <div className="relative z-10 max-w-xl">
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold mb-6 leading-tight text-white">
              Unleash Your <span className="text-[#D9B08C]">Imagination</span>
            </h2>
            <p className="text-lg md:text-xl font-['Cormorant_Garamond'] mb-8 text-gray-300">
              Create personalized erotic stories with immersive AI-powered narration. Explore, share, and experience narratives tailored to your desires.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex items-center justify-center bg-[#8B1E3F] hover:bg-[#A93B5B] transition-colors px-6 py-3 rounded-lg text-white font-bold"
                asChild
              >
                <Link href="/create">
                  <Sparkles className="mr-2" size={18} />
                  Create Your Story
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center bg-transparent border border-[#D9B08C] hover:bg-[#D9B08C]/10 transition-colors px-6 py-3 rounded-lg text-[#D9B08C] font-bold"
                asChild
              >
                <Link href="/discover">
                  <BookOpen className="mr-2" size={18} />
                  Explore Library
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Public Stories */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-['Playfair_Display'] font-semibold">Public Stories</h2>
          <Link href="/discover" className="text-[#D9B08C] hover:underline">
            View all
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1E1E1E] rounded-xl h-80 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(publicStories) && publicStories.length > 0 ? (
              publicStories.map((story: any) => (
                <StoryCard key={story._id} story={story} />
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-400">No stories found. Be the first to create one!</p>
                <Button 
                  className="mt-4 bg-[#8B1E3F] hover:bg-[#A93B5B]"
                  asChild
                >
                  <Link href="/create">Create Story</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
      
      {/* Premium Features */}
      <section className="mb-16">
        <h2 className="text-2xl font-['Playfair_Display'] font-semibold mb-8">Premium Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumFeatureCard 
            icon="microphone" 
            title="HD Voice Narration" 
            description="Enjoy ultra-realistic voice narration with emotional expression and natural cadence." 
          />
          <PremiumFeatureCard 
            icon="book" 
            title="Extended Stories" 
            description="Generate longer, more detailed narratives with complex character development and plot lines." 
          />
          <PremiumFeatureCard 
            icon="users" 
            title="Interactive Role-Play" 
            description="Engage in immersive role-playing experiences with advanced AI characters that respond to your choices." 
          />
        </div>
      </section>
      
      {/* Community Section */}
      <section className="mb-16">
        <div className="bg-[#1E1E1E] rounded-2xl p-8">
          <h2 className="text-2xl font-['Playfair_Display'] font-semibold mb-4">Join Our Community</h2>
          <p className="text-gray-300 mb-8">Connect with others, share stories, and explore new possibilities.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#2D2D2D] rounded-xl p-6">
              <h3 className="font-['Playfair_Display'] text-xl mb-4">Latest Discussions</h3>
              <div className="space-y-4">
                <DiscussionItem 
                  title="Writing Techniques for Sensual Scenes" 
                  description="Tips and advice for creating evocative imagery in your stories." 
                  author="WriterGirl88" 
                  commentCount={24} 
                />
                <DiscussionItem 
                  title="Historical Settings That Inspire Passion" 
                  description="Exploring time periods that provide rich backdrops for romantic encounters." 
                  author="HistoryLover42" 
                  commentCount={18} 
                />
                <DiscussionItem 
                  title="Character Development: Creating Desire" 
                  description="How to build characters with chemistry and emotional depth." 
                  author="NovelistDreams" 
                  commentCount={31} 
                />
              </div>
              
              <div className="mt-4">
                <Link href="/community" className="text-[#D9B08C] hover:underline text-sm">
                  View all discussions →
                </Link>
              </div>
            </div>
            
            <div className="bg-[#2D2D2D] rounded-xl p-6">
              <h3 className="font-['Playfair_Display'] text-xl mb-4">Community Highlights</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Most Popular This Week</h4>
                  <div className="bg-[#121212] rounded-lg p-4">
                    <h5 className="font-medium mb-1">Midnight in Paris</h5>
                    <p className="text-sm text-gray-400 mb-2">A chance encounter beneath the Eiffel Tower leads to a night of passion...</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="flex items-center mr-3">
                        <Heart className="h-3 w-3 mr-1 text-[#A93B5B]" /> 487
                      </span>
                      <span className="flex items-center">
                        <Volume2 className="h-3 w-3 mr-1" /> 1.2k plays
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Editor's Choice</h4>
                  <div className="bg-[#121212] rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-[#D9B08C] mr-2">🏆</span>
                      <h5 className="font-medium">Desert Mirage</h5>
                    </div>
                    <p className="text-sm text-gray-400">Stranded in a luxurious desert resort, two strangers discover an unexpected connection...</p>
                  </div>
                </div>
                
                <Button className="w-full bg-[#8B1E3F] hover:bg-[#A93B5B] transition-colors mt-4 p-3 rounded-lg text-white font-bold">
                  Join Community
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Icon mapping for premium features
const iconMap: Record<string, JSX.Element> = {
  microphone: <svg xmlns="http://www.w3.org/2000/svg" className="text-[#D9B08C] text-3xl mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>,
  book: <svg xmlns="http://www.w3.org/2000/svg" className="text-[#D9B08C] text-3xl mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" className="text-[#D9B08C] text-3xl mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
};

interface PremiumFeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const PremiumFeatureCard = ({ icon, title, description }: PremiumFeatureCardProps) => {
  return (
    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] p-6 rounded-xl border border-[#8B1E3F]/30 hover:border-[#8B1E3F]/60 transition-colors">
      <div className="text-[#D9B08C] text-3xl mb-4">
        {iconMap[icon]}
      </div>
      <h3 className="font-['Playfair_Display'] text-xl mb-3">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="mt-auto">
        <span className="text-xs bg-[#8B1E3F]/20 text-[#A93B5B] px-2 py-1 rounded-full uppercase">Premium Feature</span>
      </div>
    </div>
  );
};

import { Heart, Volume2 } from "lucide-react";

interface DiscussionItemProps {
  title: string;
  description: string;
  author: string;
  commentCount: number;
}

const DiscussionItem = ({ title, description, author, commentCount }: DiscussionItemProps) => {
  return (
    <div className="border-b border-gray-800 pb-4">
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-400 mb-2">{description}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-[#574873]"></div>
          <span className="ml-2 text-xs text-gray-500">{author}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          {commentCount}
        </div>
      </div>
    </div>
  );
};

export default Home;
