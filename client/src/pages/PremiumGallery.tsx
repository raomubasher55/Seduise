import { useQuery } from '@tanstack/react-query';
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

  const { data: stories, isLoading, error } = useQuery<Story[]>(
    ['premiumStories'],
    async () => {
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
    { enabled: !!user && user.isPremium } // Only fetch if user is logged in and premium
  );

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
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Premium Story Gallery</h1>
        <p className="text-lg text-muted-foreground">
          Exclusive stories for our valued premium subscribers.
        </p>
      </div>

      {stories && stories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stories.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">No premium stories available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
