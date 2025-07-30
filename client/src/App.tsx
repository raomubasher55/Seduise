import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PremiumBanner from "@/components/PremiumBanner";
import Home from "@/pages/Home";
import CreateStory from "@/pages/CreateStory";
import StoryReader from "@/pages/StoryReader";
import EditStory from "@/pages/EditStory";
import Profile from "@/pages/Profile";
import Discover from "@/pages/Discover";
import Community from "@/pages/Community";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ProtectedRoute from "@/components/ProtectedRoute";
import AgeVerification from "@/components/AgeVerification";
import CookieConsent from "@/components/CookieConsent";
import FAQ from "@/pages/FAQ";
import CookiePolicy from "@/pages/CookiePolicy";
import TermsOfUse from "@/pages/TermsOfUse";

// Subscription and Payment Pages
import CreditsPage from "@/pages/CreditsPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";
import PaymentCreditSuccess from "@/pages/PaymentCreditSuccess";
import PaymentSubscriptionSuccess from "@/pages/PaymentSubscriptionSuccess";
import PremiumGallery from "./pages/PremiumGallery";
import PremiumUpgrade from "./pages/PremiumUpgrade";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#121212] text-[#F5F5F5]">
          <Header />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />


              <Route path="/create">
                <ProtectedRoute>
                  <CreateStory />
                </ProtectedRoute>
              </Route>


              <Route path="/story/:id">
                {(params) => (
                  // <ProtectedRoute>
                    <StoryReader params={params} />
                  // </ProtectedRoute>
                )}
              </Route>

              <Route path="/discover" component={Discover} />
              {/* <Route path="/community" component={Community} /> */}

              <Route path="/dashboard">
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Route>

              <Route path="/admin">
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              </Route>

              <Route path="/profile">
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Route>

              <Route path="/premium-gallery">
                <ProtectedRoute minimumTier="passion">
                  <PremiumGallery />
                </ProtectedRoute>
              </Route>

              <Route path="/edit/:id">
                {(params) => (
                  <ProtectedRoute>
                    <EditStory />
                  </ProtectedRoute>
                )}
              </Route>
              
              <Route path="/premium-upgrade">
                <ProtectedRoute>
                  <PremiumUpgrade />
                </ProtectedRoute>
              </Route>
              
              {/* <Route path="/subscription">
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              </Route> */}
              
              <Route path="/credits">
                <ProtectedRoute>
                  <CreditsPage />
                </ProtectedRoute>
              </Route>
              
              <Route path="/checkout/:type/:id">
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              </Route>

              <Route path="/payment/success">
                <PaymentSuccessPage />
              </Route>

              <Route path="/payment/credit-success">
                {/* <ProtectedRoute> */}
                  <PaymentCreditSuccess />
                {/* </ProtectedRoute> */}
              </Route>

              <Route path="/payment/subscription-success">
                <PaymentSubscriptionSuccess />
              </Route>
              
              <Route path="/payment/cancel">
                <PaymentCancelPage />
              </Route>

              {/* New routes for FAQ and Cookie Policy */}
              <Route path="/faq" component={FAQ} />
              <Route path="/cookie-policy" component={CookiePolicy} />
              <Route path="/terms-of-use" component={TermsOfUse} />

              <Route component={NotFound} />
            </Switch>
          </main>
          <PremiumBanner />
          <Footer />
        </div>
        
        {/* Age verification and cookie consent components */}
        <AgeVerification />
        <CookieConsent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
