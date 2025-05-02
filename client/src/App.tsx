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

// Subscription and Payment Pages
import SubscriptionPage from "@/pages/SubscriptionPage";
import CreditsPage from "@/pages/CreditsPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";

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

              <Route path="/edit/:id">
                {(params) => (
                  <ProtectedRoute>
                    <EditStory />
                  </ProtectedRoute>
                )}
              </Route>
              
              {/* <Route path="/premium">
                <ProtectedRoute>
                  <PremiumUpgrade />
                </ProtectedRoute>
              </Route> */}
              
              <Route path="/subscription">
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              </Route>
              
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
                <PaymentSuccessPage />
              </Route>
              
              <Route path="/payment/cancel">
                <PaymentCancelPage />
              </Route>

              <Route component={NotFound} />
            </Switch>
          </main>
          <PremiumBanner />
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
