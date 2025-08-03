import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreditPackages from '../components/CreditPackages';
import CreditDisplay from '../components/CreditDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CREDIT_COSTS } from '../../../server/constants/plans';

export default function CreditsPage() {
  const { user } = useAuth();



  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Buy Additional Credits</h1>
        <p className="text-lg text-muted-foreground">
          Top up your account with extra credits when you've used your monthly allowance
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          💡 Need a monthly plan? <a href="/premium-upgrade" className="text-primary hover:underline">Check out our subscriptions</a>
        </p>
      </div>

      {user ? (
        <>
          <div className="flex justify-center mb-12">
            <CreditDisplay 
              textCredits={user.textCredits || 0}
              audioCredits={user.audioCredits || 0}
              isPremium={user.isPremium}
            />
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-center">One-Time Credit Packages</h2>
            <p className="text-center text-muted-foreground mb-8">
              Credits never expire and can be used anytime • Perfect for topping up your account
            </p>
            
            <CreditPackages 
              isPremium={user.isPremium} 
            />
          </div>

          <Separator className="my-12" />

          <div className="grid gap-8 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>How do credits work?</CardTitle>
                <CardDescription>Understanding our credit system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      Credits are consumed when you generate stories, create additional chapters, or narrate your stories with our voice narration technology.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Premium Benefits</h3>
                    <p className="text-sm text-muted-foreground">
                      Premium subscribers receive monthly credits as part of their plan and enjoy discounted rates when purchasing additional credit packages.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Credit Costs</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-[#D9B08C] mb-1">Text Credits</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                          <li>• Short story: {CREDIT_COSTS.text.generateStory.short} credit</li>
                          <li>• Medium story: {CREDIT_COSTS.text.generateStory.medium} credits</li>
                          <li>• Long story: {CREDIT_COSTS.text.generateStory.long} credits</li>
                          <li>• Chapter continuation: {CREDIT_COSTS.text.continueStory} credit</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[#8B1E3F] mb-1">Audio Credits</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                          <li>• Short audio (~2.5 min): {CREDIT_COSTS.audio.generateAudio.short} credits</li>
                          <li>• Medium audio (~5 min): {CREDIT_COSTS.audio.generateAudio.medium} credits</li>
                          <li>• Long audio (~8-10 min): {CREDIT_COSTS.audio.generateAudio.long} credits</li>
                          <li>• Per minute rate: {CREDIT_COSTS.audio.perMinute} credit</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">Expiration</h3>
                    <p className="text-sm text-muted-foreground">
                      Credits do not expire and remain in your account until used.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg">Please log in to view and purchase credits.</p>
        </div>
      )}
    </div>
  );
}