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
        <h1 className="text-4xl font-bold mb-4">Credits</h1>
        <p className="text-lg text-muted-foreground">
          Purchase credits to generate more stories and audio narrations
        </p>
      </div>

      {user ? (
        <>
          <div className="flex justify-center mb-12">
            <CreditDisplay 
              credits={user.credits || 0} 
              isPremium={user.isPremium}
            />
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-center">Purchase Credit Packages</h2>
            <p className="text-center text-muted-foreground mb-8">
              Need more credits? Choose a package that suits your needs
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
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Story generation (short): {CREDIT_COSTS.generateStory.short} credit(s)</li>
                      <li>• Story generation (medium): {CREDIT_COSTS.generateStory.medium} credit(s)</li>
                      <li>• Story generation (long): {CREDIT_COSTS.generateStory.long} credit(s)</li>
                      <li>• Chapter continuation: 1 credit</li>
                      <li>• Audio narration: {CREDIT_COSTS.audioMinute} credit(s) per minute</li>
                    </ul>
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