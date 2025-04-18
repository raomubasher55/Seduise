import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Zap, Star } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
  description: string;
}

interface CreditPackagesProps {
  isPremium?: boolean;
  onSelectPackage: (packageId: string) => void;
}

const CreditPackages = ({ isPremium = false, onSelectPackage }: CreditPackagesProps) => {
  // Define credit packages
  const packages: CreditPackage[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 10,
      price: isPremium ? 2.99 : 3.99,
      description: 'Perfect for casual story creation'
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      credits: 30,
      price: isPremium ? 6.99 : 9.99,
      popular: true,
      description: 'Most popular choice for regular users'
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      credits: 100,
      price: isPremium ? 14.99 : 19.99,
      bestValue: true,
      description: 'Best value for avid storytellers'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">Top Up Your Credits</h2>
        <p className="text-gray-400">Choose a package that suits your storytelling needs</p>
        {isPremium && (
          <Badge variant="outline" className="mt-2 bg-amber-500/20 text-amber-400 border-amber-500">
            Premium Discount Applied!
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`bg-[#222] border-gray-700 relative overflow-hidden 
            ${pkg.popular ? 'ring-2 ring-amber-500' : ''}
            ${pkg.bestValue ? 'ring-2 ring-emerald-500' : ''}`}>
            {pkg.popular && (
              <div className="absolute top-0 right-0 bg-amber-500 text-black px-3 py-1 text-xs font-semibold rounded-bl-lg">
                POPULAR
              </div>
            )}
            {pkg.bestValue && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-black px-3 py-1 text-xs font-semibold rounded-bl-lg">
                BEST VALUE
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center">
                {pkg.name}
                {pkg.bestValue && <Star size={16} className="ml-2 text-emerald-400" />}
              </CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold">${pkg.price}</span>
                {isPremium && <span className="text-xs text-emerald-400">Premium Price</span>}
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <Coins size={18} />
                <span className="text-xl font-semibold">{pkg.credits} Credits</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={pkg.popular || pkg.bestValue ? "default" : "outline"}
                onClick={() => onSelectPackage(pkg.id)}
              >
                <Zap size={16} className="mr-2" />
                Select Package
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CreditPackages;