import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Loader2, Lock } from 'lucide-react';
import StoryCard from '@/components/StoryCard';

interface Story {
  _id: string;
  title: string;
  imageUrl?: string;
  content?: string;
  userName?: string;
  likes?: number;
  plays?: number;
}

export default function PremiumGallery() {
  const { user, isLoading: isUserLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: stories, isLoading, error } = useQuery<Story[]>({
    queryKey: ['premiumStories'],
    queryFn: async () => {
      const response = await fetch('/api/stories/premium-stories');
      if (!response.ok) {
        // If the user is not premium, the backend will return 403
        if (response.status === 403) {
          throw new Error('Premium subscription required');
        }
        throw new Error('Failed to fetch premium stories');
      }
      return response.json();
    },
    enabled: !!user && user.isPremium // Only fetch if user is logged in and premium
  });

  if (isUserLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading premium stories...</p>
      </div>
    );
  }

  if (!user || !user.isPremium) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-[#1E1E1E] p-8 text-center">
          <div className="flex justify-center mb-6">
            <Lock className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Premium Content</h2>
          <p className="text-gray-400 mb-6">
            This section contains exclusive stories available only to premium subscribers.
          </p>
          <Button asChild>
            <Link href="/subscription">Upgrade to Premium</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-[#1E1E1E] p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Stories</h2>
          <p className="text-gray-400 mb-6">{error.message}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['premiumStories'] })}>Try Again</Button>
        </Card>
      </div>
    );
  }

  const getTierInfo = () => {
    if (user?.subscription === 'passion') {
      return {
        title: 'Premium Gallery - Passion Access',
        description: 'Early access stories that will become public later',
        badge: 'Partial Access',
        color: 'from-purple-500 to-indigo-500'
      };
    } else if (user?.subscription === 'escape') {
      return {
        title: 'Premium Gallery - Escape Access',
        description: 'Full access to all exclusive premium content',
        badge: 'Full Access',
        color: 'from-yellow-500 to-orange-500'
      };
    }
    return {
      title: 'Premium Story Gallery',
      description: 'Exclusive stories for our valued premium subscribers',
      badge: 'Premium',
      color: 'from-purple-500 to-pink-500'
    };
  };

  const tierInfo = getTierInfo();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {tierInfo.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          {tierInfo.description}
        </p>
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${tierInfo.color} text-white`}>
            {tierInfo.badge}
          </span>
        </div>
      </div>

      {stories && stories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {stories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
          
          {user?.subscription === 'passion' && (
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/20 p-6 text-center">
                <CardHeader>
                  <CardTitle className="text-xl bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Want More Premium Content?
                  </CardTitle>
                  <CardDescription>
                    Upgrade to Escape for full access to all exclusive premium stories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                    <Link href="/premium-upgrade">Upgrade to Escape</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">No premium stories available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
