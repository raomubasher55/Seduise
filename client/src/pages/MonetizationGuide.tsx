import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Heart, 
  Zap, 
  Gift, 
  CreditCard, 
  Users, 
  BookOpen, 
  Mic, 
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Award,
  TrendingUp
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export default function MonetizationGuide() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('seduction');

  const plans = [
    {
      id: 'discovery',
      name: 'Discovery',
      price: 0,
      period: 'Free Forever',
      textCredits: 2,
      audioCredits: 1,
      description: 'Explore Without Commitment',
      color: 'from-gray-500 to-gray-600',
      features: [
        '🖋 Create up to 2 personalized stories (text)',
        '🎧 1 free audio (≈ 1 to 2 min)',
        '🎙 Standard voice',
        '📚 No access to the premium library',
        '✨ Perfect to explore the world of Seduice for free'
      ],
      badge: null
    },
    {
      id: 'essentiel',
      name: 'Essentiel',
      price: 5.99,
      period: 'per month',
      textCredits: 5,
      audioCredits: 6,
      description: 'Pleasure at Your Own Pace',
      color: 'from-blue-500 to-indigo-600',
      features: [
        '🖋 Create up to 5 personalized stories (text)',
        '🎧 6 audio credits (≈ 15 minutes total)',
        '🎙 Natural-sounding voices',
        '📚 Basic premium gallery access',
        '🔐 A soft and regular introduction to your intimate desires'
      ],
      badge: 'Popular'
    },
    {
      id: 'seduction',
      name: 'Seduction',
      price: 11.99,
      period: 'per month', 
      textCredits: 12,
      audioCredits: 12,
      description: 'Your Pleasure Rendezvous',
      color: 'from-purple-500 to-pink-500',
      features: [
        '🖋 Create up to 12 personalized stories (text)',
        '🎧 12 audio credits (≈ 30 minutes)',
        '🎙 Expressive & realistic voices',
        '📚 Premium gallery access (early access + exclusive)',
        '✨ Create premium exclusive stories',
        '🎁 New stories added monthly'
      ],
      badge: 'Recommended'
    },
    {
      id: 'intimacy',
      name: 'Intimacy',
      price: 24.99,
      period: 'per month',
      textCredits: 25,
      audioCredits: 24,
      description: 'The Ultimate Experience Without Limits',
      color: 'from-yellow-500 to-orange-500',
      features: [
        '🖋 Create up to 25 personalized stories (text)',
        '🎧 24 audio credits (≈ 60 minutes)',
        '🎙 Expressive & immersive voices',
        '📚 Full access to the premium audio library',
        '✨ Create premium exclusive stories',
        '💌 Tailored suggestions and exclusive stories',
        '🔴 The Ultimate Experience Without Limits'
      ],
      badge: 'Best Value'
    }
  ];

  const creditPacks = {
    text: [
      { name: 'Starter Pack', credits: 15, price: 2.99, description: 'Perfect for more story creation' },
      { name: 'Popular Pack', credits: 40, price: 6.99, description: 'Most popular text credits pack', popular: true },
      { name: 'Premium Pack', credits: 80, price: 11.99, description: 'Maximum text credits for heavy writers', bestValue: true }
    ],
    audio: [
      { name: 'Starter Pack', credits: 10, price: 4.99, description: 'Perfect for more audio experiences' },
      { name: 'Popular Pack', credits: 25, price: 9.99, description: 'Most popular audio credits pack', popular: true },
      { name: 'Premium Pack', credits: 50, price: 17.99, description: 'Maximum audio credits for audio lovers', bestValue: true }
    ],
    combo: [
      { name: 'Starter Combo', textCredits: 10, audioCredits: 8, price: 5.99, description: 'Best value starter combo pack' },
      { name: 'Popular Combo', textCredits: 25, audioCredits: 20, price: 12.99, description: 'Best value combo pack', popular: true },
      { name: 'Premium Combo', textCredits: 50, audioCredits: 40, price: 22.99, description: 'Ultimate combo pack for power users', bestValue: true }
    ]
  };

  const badges = [
    { name: 'Storyteller', reward: 'Achievement Badge', trigger: 'Create your first story' },
    { name: 'First Heart', reward: '+4 text + 1 audio credits', trigger: 'Get your first like' },
    { name: 'Popular Author', reward: '+18 text + 7 audio credits', trigger: '50+ total likes' },
    { name: 'Prolific Writer', reward: '+35 text + 15 audio credits', trigger: 'Write 10 stories' },
    { name: 'Community Favorite', reward: '+28 text + 12 audio credits', trigger: 'High upvote ratio (70%+)' },
    { name: 'Legend Author', reward: '+350 text + 150 audio credits + 30 premium days', trigger: '1000+ total likes' }
  ];

  const useCases = [
    {
      name: 'Light User (Sarah)',
      usage: '2-3 stories per month, some audio',
      recommendation: 'Essentiel Plan',
      price: '€5.99/month',
      reasoning: '5 text + 6 audio credits monthly covers your needs perfectly'
    },
    {
      name: 'Regular User (Mike)', 
      usage: '8-10 stories per month, loves audio, wants premium access',
      recommendation: 'Seduction Plan',
      price: '€11.99/month',
      reasoning: '12 text + 12 audio credits + premium gallery access'
    },
    {
      name: 'Power User (Emma)',
      usage: '15+ stories per month, creates premium content',
      recommendation: 'Intimacy Plan',
      price: '€24.99/month',
      reasoning: '25 text + 24 audio credits + full access + creator features'
    },
    {
      name: 'Occasional User (David)',
      usage: 'Uses free plan, buys credits when needed',
      recommendation: 'Discovery + Combo Packs',
      price: '€0 + €5.99-€22.99 occasionally',
      reasoning: 'Free plan with credit packs when you need extra content'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] p-3 rounded-full">
            <Crown className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-['Playfair_Display'] font-bold mb-4 bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F] bg-clip-text text-transparent">
          Monetization Guide
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Your complete guide to credits, subscriptions, and premium features on Seduice
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-[#2D2D2D] mb-8">
          <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
          <TabsTrigger value="plans" className="text-sm">Plans</TabsTrigger>
          <TabsTrigger value="credits" className="text-sm">Credits</TabsTrigger>
          <TabsTrigger value="badges" className="text-sm">Earn Free</TabsTrigger>
          <TabsTrigger value="examples" className="text-sm">Examples</TabsTrigger>
          <TabsTrigger value="faq" className="text-sm">FAQ</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* How Seduice Works */}
            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-[#D9B08C]" />
                  <CardTitle className="text-xl">How Seduice Works</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">
                  Seduice operates on a <strong className="text-[#D9B08C]">credit-based system</strong> with 
                  <strong className="text-[#8B1E3F]"> premium subscriptions</strong> that give you monthly credits and exclusive features.
                </p>
                <p className="text-gray-400">
                  Think of it like a streaming service, but for personalized romantic stories!
                </p>
              </CardContent>
            </Card>

            {/* Credit System */}
            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-[#8B1E3F]" />
                  <CardTitle className="text-xl">Credit System</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[#D9B08C] mb-2">🖋️ Text Credits</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Short story: 1 credit</li>
                    <li>• Medium story: 2 credits</li>
                    <li>• Long story: 4 credits</li>
                    <li>• Continue story: 1 credit</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#8B1E3F] mb-2">🎧 Audio Credits</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Short audio (~2.5 min): 2 credits</li>
                    <li>• Medium audio (~5 min): 3 credits</li>
                    <li>• Long audio (~8-10 min): 5 credits</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current User Status */}
          {user && (
            <Card className="bg-gradient-to-r from-[#8B1E3F]/20 to-[#D9B08C]/20 border-[#8B1E3F]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8B1E3F] flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Your Current Status</CardTitle>
                      <CardDescription>Account overview and recommendations</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] text-white">
                    {user.subscription?.charAt(0).toUpperCase() + user.subscription?.slice(1) || 'Free'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#D9B08C]">{user.textCredits || 0}</div>
                    <div className="text-sm text-gray-400">Text Credits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#8B1E3F]">{user.audioCredits || 0}</div>
                    <div className="text-sm text-gray-400">Audio Credits</div>
                  </div>
                  <div className="text-center">
                    <Button asChild className="bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C]">
                      <Link href="/premium-upgrade">
                        {user.subscription === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-4">Subscription Plans</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your storytelling needs. All plans include monthly credits and exclusive features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative bg-[#1E1E1E] border-gray-800 hover:border-[#8B1E3F] transition-all duration-300 ${
                  selectedPlan === plan.id ? 'ring-2 ring-[#8B1E3F] border-[#8B1E3F]' : ''
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${
                      plan.badge === 'Recommended' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                      plan.badge === 'Best Value' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    } text-white px-3 py-1`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-['Playfair_Display']">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                  <div className="pt-4">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-bold text-[#D9B08C]">Free</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-[#D9B08C]">€{plan.price}</span>
                        <span className="text-gray-400">/{plan.period.split(' ')[1]}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#D9B08C]">{plan.textCredits}</div>
                      <div className="text-xs text-gray-400">Text Credits</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#8B1E3F]">{plan.audioCredits}</div>
                      <div className="text-xs text-gray-400">Audio Credits</div>
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    asChild 
                    className={`w-full ${
                      plan.id === 'discovery' ? 'bg-gray-600 hover:bg-gray-700' :
                      `bg-gradient-to-r ${plan.color} hover:opacity-90`
                    }`}
                  >
                    <Link href={plan.id === 'discovery' ? '/signup' : '/premium-upgrade'}>
                      {plan.id === 'discovery' ? 'Get Started Free' : 'Choose Plan'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-4">One-Time Credit Packs</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Perfect for topping up when you've used your monthly allowance. Credits never expire!
            </p>
          </div>

          <Tabs defaultValue="combo" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#2D2D2D] max-w-md mx-auto">
              <TabsTrigger value="combo">Combo Packs</TabsTrigger>
              <TabsTrigger value="text">Text Credits</TabsTrigger>
              <TabsTrigger value="audio">Audio Credits</TabsTrigger>
            </TabsList>

            <TabsContent value="combo" className="mt-8">
              <div className="grid md:grid-cols-3 gap-6">
                {creditPacks.combo.map((pack, index) => (
                  <Card key={index} className="bg-[#1E1E1E] border-gray-800 relative">
                    {pack.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Most Popular
                      </Badge>
                    )}
                    {pack.bestValue && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        Best Value
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{pack.name}</CardTitle>
                      <CardDescription>{pack.description}</CardDescription>
                      <div className="text-2xl font-bold text-[#D9B08C] pt-2">€{pack.price}</div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex justify-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-[#D9B08C]">{pack.textCredits}</div>
                          <div className="text-xs text-gray-400">Text Credits</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-[#8B1E3F]">{pack.audioCredits}</div>
                          <div className="text-xs text-gray-400">Audio Credits</div>
                        </div>
                      </div>
                      
                      <Button asChild className="w-full bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C]">
                        <Link href="/credits">Purchase Pack</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-8">
              <div className="grid md:grid-cols-3 gap-6">
                {creditPacks.text.map((pack, index) => (
                  <Card key={index} className="bg-[#1E1E1E] border-gray-800 relative">
                    {pack.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Most Popular
                      </Badge>
                    )}
                    {pack.bestValue && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        Best Value
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <BookOpen className="h-12 w-12 text-[#D9B08C] mx-auto mb-4" />
                      <CardTitle className="text-xl">{pack.name}</CardTitle>
                      <CardDescription>{pack.description}</CardDescription>
                      <div className="text-2xl font-bold text-[#D9B08C] pt-2">€{pack.price}</div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#D9B08C]">{pack.credits}</div>
                        <div className="text-gray-400">Text Credits</div>
                      </div>
                      
                      <Button asChild className="w-full bg-gradient-to-r from-[#D9B08C] to-[#8B1E3F]">
                        <Link href="/credits">Purchase Pack</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-8">
              <div className="grid md:grid-cols-3 gap-6">
                {creditPacks.audio.map((pack, index) => (
                  <Card key={index} className="bg-[#1E1E1E] border-gray-800 relative">
                    {pack.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Most Popular
                      </Badge>
                    )}
                    {pack.bestValue && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        Best Value
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <Mic className="h-12 w-12 text-[#8B1E3F] mx-auto mb-4" />
                      <CardTitle className="text-xl">{pack.name}</CardTitle>
                      <CardDescription>{pack.description}</CardDescription>
                      <div className="text-2xl font-bold text-[#D9B08C] pt-2">€{pack.price}</div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#8B1E3F]">{pack.credits}</div>
                        <div className="text-gray-400">Audio Credits</div>
                      </div>
                      
                      <Button asChild className="w-full bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C]">
                        <Link href="/credits">Purchase Pack</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-4">Earn Free Credits</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Get rewarded for being an active member of the Seduice community. Earn badges and receive bonus credits!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge, index) => (
              <Card key={index} className="bg-[#1E1E1E] border-gray-800 hover:border-[#8B1E3F] transition-colors">
                <CardHeader className="text-center">
                  <Award className="h-12 w-12 text-[#D9B08C] mx-auto mb-4" />
                  <CardTitle className="text-lg">{badge.name}</CardTitle>
                  <CardDescription className="text-green-400 font-semibold">{badge.reward}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">{badge.trigger}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-[#8B1E3F]/20 to-[#D9B08C]/20 border-[#8B1E3F]/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-[#D9B08C]" />
                <CardTitle>How to Earn More Badges</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[#8B1E3F]" />
                  <span><strong>Write engaging stories</strong> to get more likes and hearts</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[#8B1E3F]" />
                  <span><strong>Create quality content</strong> to earn upvotes from the community</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[#8B1E3F]" />
                  <span><strong>Stay active</strong> - the more you write, the more milestone badges you unlock</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[#8B1E3F]" />
                  <span><strong>Check your profile</strong> to see your badge collection and progress</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-4">Find Your Perfect Plan</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See which plan works best for different types of users and their storytelling habits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="bg-[#1E1E1E] border-gray-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{useCase.name}</CardTitle>
                      <CardDescription className="text-gray-400">{useCase.usage}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-[#2D2D2D] p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-[#D9B08C]">Recommended:</span>
                      <Badge className="bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C] text-white">
                        {useCase.recommendation}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-[#D9B08C] mb-2">{useCase.price}</div>
                    <p className="text-sm text-gray-400">{useCase.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Smart Spending Tips */}
          <Card className="bg-[#1E1E1E] border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-[#D9B08C]" />
                <CardTitle>Smart Spending Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-[#D9B08C] mb-3">💡 For New Users</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Start with Discovery (Free) to try the platform</li>
                    <li>• Upgrade to Essentiel for regular use</li>
                    <li>• Buy Combo Packs if you need extra credits occasionally</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#8B1E3F] mb-3">💡 For Regular Users</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Choose Seduction for premium content access</li>
                    <li>• Premium gallery has exclusive stories worth the upgrade</li>
                    <li>• Creating premium stories gives you creator benefits</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#D9B08C] mb-3">💡 For Power Users</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Intimacy gives best value for heavy usage</li>
                    <li>• Full premium access + exclusive creator features</li>
                    <li>• Priority support for any issues</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-['Playfair_Display'] font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about credits, subscriptions, and payments.
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">What happens to unused credits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Monthly subscription credits reset each month, but purchased credit packs never expire! 
                  You can use them anytime, even after canceling your subscription.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Yes! You can upgrade immediately and changes take effect right away. 
                  Downgrades take effect at your next billing cycle so you don't lose any benefits.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Do I get refunds if I cancel?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  We don't offer refunds, but you keep all benefits until your current period ends. 
                  Any purchased credit packs remain in your account permanently.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Can I share credits with friends?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Credits are tied to your individual account and cannot be transferred. 
                  However, you can gift subscription plans to friends through our gift system.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">What if I run out of credits mid-month?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  You can purchase one-time credit packs or upgrade your subscription for more monthly credits. 
                  Combo packs offer the best value for extra credits!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  We accept all major credit/debit cards (Visa, Mastercard, American Express) and PayPal. 
                  All payments are processed securely through Stripe with auto-renewal (can be turned off anytime).
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Support */}
          <Card className="bg-gradient-to-r from-[#8B1E3F]/20 to-[#D9B08C]/20 border-[#8B1E3F]/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-[#D9B08C]" />
                <CardTitle>Need More Help?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Our support team is here to help with any questions about plans, credits, or payments.
              </p>
              <div className="flex gap-4">
                <Button asChild variant="outline" className="border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white">
                  <Link href="/faq">Visit FAQ</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-[#8B1E3F] to-[#D9B08C]">
                  <a href="mailto:support@seduice.com">Contact Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}