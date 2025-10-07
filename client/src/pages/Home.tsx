import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Heart, Volume2, Mic, Book, Users, Lock, Palette, Infinity } from "lucide-react";
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
  const [demoText, setDemoText] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      {/* Hero Section with Demo Creator */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-['Playfair_Display'] font-light mb-8 leading-tight">
            <span className="text-white">Unleash Your</span><br/>
            <span className="text-[#8B1E3F] font-['Playfair_Display']">Imagination</span>
          </h1>
          <p className="text-lg md:text-xl font-['Cormorant_Garamond'] mb-12 text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Create personalized erotic stories with immersive AI-powered narration.
            Explore, share, and experience narratives tailored to your desires.
          </p>
          
          {/* Live Demo Creator */}
          <div className="bg-[#1E1E1E]/50 border border-[#8B1E3F]/20 rounded-2xl p-8 md:p-12 mx-auto max-w-3xl backdrop-blur-sm">
            <div className="flex items-center mb-8 gap-4">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <span className="text-gray-400 text-sm ml-auto">Create your story</span>
            </div>
            
            <div className="bg-[#121212]/60 border border-[#8B1E3F]/20 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 text-[#8B1E3F] text-sm mb-4">
                ✨ Describe your fantasy
              </div>
              <textarea 
                className="w-full bg-transparent border-none text-white text-base leading-relaxed resize-none outline-none placeholder-gray-500"
                rows={3}
                placeholder="A chance encounter in a Parisian café..."
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              {[
                { id: 'romantic', label: '💕 Romantic' },
                { id: 'sensual', label: '🔥 Sensual' },
                { id: 'mysterious', label: '🌙 Mysterious' }
              ].map((style) => (
                <button
                  key={style.id}
                  className={`px-6 py-3 border border-[#8B1E3F]/30 rounded-full text-white transition-all hover:border-[#8B1E3F] hover:bg-[#8B1E3F]/10 transform hover:-translate-y-1 ${
                    selectedStyles.includes(style.id) ? 'bg-[#8B1E3F] border-[#8B1E3F]' : ''
                  }`}
                  onClick={() => {
                    setSelectedStyles(prev => 
                      prev.includes(style.id) 
                        ? prev.filter(s => s !== style.id)
                        : [...prev, style.id]
                    );
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
            
            <button 
              className="w-full py-4 bg-[#8B1E3F] hover:bg-[#A93B5B] text-white font-semibold rounded-full transition-all transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#8B1E3F]/30 flex items-center justify-center gap-3"
              onClick={() => {
                setIsGenerating(true);
                setTimeout(() => {
                  setIsGenerating(false);
                  toast({
                    title: "Story preview would appear here!",
                    description: "This is a demo of the story creation interface."
                  });
                }, 3000);
              }}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  Creating your story...
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </>
              ) : (
                'Generate Story'
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-[#8B1E3F]/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] mb-6 bg-gradient-to-r from-white to-[#8B1E3F] bg-clip-text text-transparent">
              Experience the Magic
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Everything you need to bring your fantasies to life
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '✨', title: 'AI Creation', description: 'Advanced AI understands your desires and creates unique stories tailored perfectly to you.' },
              { icon: '🎧', title: 'Immersive Audio', description: 'Premium narration brings your stories to life with captivating, natural voices.' },
              { icon: '🔒', title: '100% Private', description: 'Your stories remain completely confidential with end-to-end encryption.' },
              { icon: '📚', title: 'Your Library', description: 'Save, organize, and revisit your favorite creations anytime, anywhere.' },
              { icon: '🎨', title: 'Full Control', description: 'Customize characters, settings, intensity, and every detail of your story.' },
              { icon: '♾️', title: 'Endless Stories', description: 'Continue your favorites, explore alternatives, create entire series.' }
            ].map((feature, index) => (
              <div key={index} className="bg-[#1E1E1E]/50 border border-[#8B1E3F]/10 rounded-2xl p-8 text-center transition-all hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 hover:-translate-y-2">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-['Playfair_Display'] mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 px-4 bg-[#8B1E3F]/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] mb-6">How It Works</h2>
            <p className="text-lg text-gray-400">Your perfect story in four simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '1', title: 'Describe', text: 'Share your desires' },
              { number: '2', title: 'Customize', text: 'Choose your style' },
              { number: '3', title: 'Generate', text: 'AI creates magic' },
              { number: '4', title: 'Enjoy', text: 'Read or listen' }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#8B1E3F] to-[#A93B5B] text-white text-2xl font-bold mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-['Playfair_Display'] mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] mb-6">Choose Your Experience</h2>
            <p className="text-lg text-gray-400">Start with 3 free stories, no credit card required</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🌱',
                name: 'Discovery',
                price: '€5.99',
                period: '/month',
                features: [
                  'Up to 2 personalized stories (text)',
                  '1 free audio (≈ 1 to 2 min)',
                  'Standard voice',
                  'No access to the premium library'
                ],
                bonus: '🎁 Welcome: +2 audios first month',
                featured: false
              },
              {
                icon: '🔥',
                name: 'Seduction',
                price: '€11.99',
                period: '/month',
                features: [
                  'Up to 12 personalized stories (text)',
                  '12 audio credits (≈ 30 minutes)',
                  'Expressive & realistic voices',
                  'Partial access to the premium audio library'
                ],
                bonus: '🎁 Most Popular',
                featured: true
              },
              {
                icon: '🌟',
                name: 'Intimacy',
                price: '€24.99',
                period: '/month',
                features: [
                  'Up to 25 personalized stories (text)',
                  '24 audio credits (≈ 60 minutes)',
                  'Expressive & immersive voices',
                  'Full access to the premium audio library'
                ],
                bonus: '🎁 Tailored suggestions & exclusive stories',
                featured: false
              }
            ].map((plan, index) => (
              <div key={index} className={`bg-[#1E1E1E]/50 border-2 rounded-2xl p-8 relative transition-all hover:-translate-y-2 ${
                plan.featured 
                  ? 'border-[#8B1E3F] bg-[#8B1E3F]/8 hover:border-[#A93B5B]' 
                  : 'border-[#8B1E3F]/20 hover:border-[#8B1E3F]/40'
              }`}>
                <div className="text-3xl mb-4">{plan.icon}</div>
                <h3 className="text-2xl font-['Playfair_Display'] mb-3 flex items-center gap-3">{plan.name}</h3>
                <div className="text-4xl font-bold text-[#8B1E3F] mb-6">
                  {plan.price}<span className="text-lg">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-gray-300 border-b border-gray-800/30 pb-3 last:border-b-0">
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="bg-gradient-to-r from-[#D9B08C] to-[#F4D03F] text-[#121212] px-4 py-2 rounded-full text-sm font-semibold mb-6 inline-block">
                  {plan.bonus}
                </div>
                <button className={`w-full py-4 border-2 rounded-full font-semibold transition-all ${
                  plan.featured 
                    ? 'bg-[#8B1E3F] border-[#8B1E3F] text-white hover:bg-[#A93B5B]' 
                    : 'border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white'
                }`}>
                  {plan.featured ? 'Most Popular' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Public Stories */}
      <section className="py-20 px-4 bg-[#8B1E3F]/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-['Playfair_Display'] font-semibold">Public Stories</h2>
            <Link href="/discover" className="text-[#D9B08C] hover:underline hover:text-[#8B1E3F] transition-colors">
              View all →
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
                <div className="col-span-3 text-center py-16">
                  <p className="text-gray-400 mb-6">No stories found. Be the first to create one!</p>
                  <Button 
                    className="bg-[#8B1E3F] hover:bg-[#A93B5B] px-8 py-4 rounded-full"
                    asChild
                  >
                    <Link href="/create">Create Story</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#8B1E3F]/20 to-[#A93B5B]/10 border border-[#8B1E3F]/20 rounded-3xl p-12">
            <h2 className="text-4xl font-['Playfair_Display'] mb-6">Ready to Start Your Journey?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Join thousands discovering the pleasure of personalized storytelling
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-[#8B1E3F] hover:bg-[#A93B5B] px-8 py-4 rounded-full font-semibold" asChild>
                <Link href="/create">Try 3 Stories Free</Link>
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold">
                View Plans
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const toggleStyle = (styleId: string, selectedStyles: string[], setSelectedStyles: (styles: string[]) => void) => {
  setSelectedStyles(
    selectedStyles.includes(styleId) 
      ? selectedStyles.filter(s => s !== styleId)
      : [...selectedStyles, styleId]
  );
};

export default Home;
