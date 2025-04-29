import { SubscriptionPlans } from '../components/SubscriptionPlans';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const subscription = user?.subscription || 'free';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Choose Your Subscription Plan</h1>
        <p className="text-lg text-muted-foreground">
          Unlock premium features and enhance your storytelling experience
        </p>
      </div>

      {user ? (
        <>
          <div className="mb-8">
            <Alert className="bg-primary/20 border-primary">
              <InfoIcon className="h-4 w-4 text-primary" />
              <AlertDescription>
                You are currently on the <span className="font-bold capitalize">{subscription}</span> plan.
                {subscription !== 'free' && " You can upgrade or downgrade at any time."}
              </AlertDescription>
            </Alert>
          </div>

          <SubscriptionPlans currentPlan={subscription} />

          <div className="grid gap-8 mt-16">
            <Card>
              <CardHeader>
                <CardTitle>What's included in your subscription?</CardTitle>
                <CardDescription>All plans include the core features of Séduise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Story Generation</h3>
                    <p className="text-sm text-muted-foreground">Create personalized erotic stories based on your preferences</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Audio Narration</h3>
                    <p className="text-sm text-muted-foreground">Listen to your stories with realistic text-to-speech narration</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Story Continuation</h3>
                    <p className="text-sm text-muted-foreground">Extend and elaborate on stories with additional chapters</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Customization Options</h3>
                    <p className="text-sm text-muted-foreground">Tailor characters, settings, and plots to your desires</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Story Library</h3>
                    <p className="text-sm text-muted-foreground">Save and access your created stories anytime</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Credit System</h3>
                    <p className="text-sm text-muted-foreground">Use credits to create content beyond your monthly limits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg">Please log in to view and manage subscription plans.</p>
        </div>
      )}
    </div>
  );
}