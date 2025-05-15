// new  nwe
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "@/components/ui/separator";

// Signup form schema
const signupSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Invalid email address",
  }),
  phone: z.string().optional(),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (values: SignupFormValues) => {
      const response = await apiRequest("POST", "/api/auth/signup", values);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      console.log("Signup successful: ", data);
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Add to session storage as a fallback
        sessionStorage.setItem('token', data.token);
      }
      
      // Store user ID for additional reliability
      if (data.user && data.user._id) {
        localStorage.setItem('userId', data.user._id);
      }
      
      // Force immediate refresh of user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Account created successfully",
        description: "Welcome to Seduise!",
      });
      
      // Add short delay to ensure query invalidation completes
      setTimeout(() => navigate("/"), 100);
    },
    onError: (error) => {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SignupFormValues) => {
    signupMutation.mutate(values);
  };

  const handleGoogleSignup = () => {
    // Get the phone value if it's entered in the form
    const phoneValue = form.getValues("phone");
    
    // If phone number is provided, include it in the state parameter
    if (phoneValue) {
      const state = encodeURIComponent(JSON.stringify({ phone: phoneValue }));
      window.location.href = `/api/auth/google?state=${state}`;
    } else {
      // Regular Google OAuth redirect without phone
      window.location.href = "/api/auth/google";
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-['Playfair_Display'] text-[#D9B08C]">Create an Account</CardTitle>
          <CardDescription className="text-gray-400">
            Join our community to start creating and sharing stories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Signup Button */}
          <Button 
            type="button" 
            className="w-full bg-white text-gray-800 hover:bg-gray-100 mb-4 flex items-center justify-center"
            onClick={handleGoogleSignup}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign up with Google
          </Button>

          <div className="relative mb-4">
            <Separator className="bg-gray-700" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-[#1E1E1E] text-gray-400 text-sm">
              OR
            </span>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-[#121212] border-gray-700 text-white focus:border-[#D9B08C] focus:ring-[#D9B08C]"
                        placeholder="Enter your name"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Emailll   lllllll</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-[#121212] border-gray-700 text-white focus:border-[#D9B08C] focus:ring-[#D9B08C]"
                        placeholder="Enter your email"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">PhonEeee</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-[#121212] border-gray-700 text-white focus:border-[#D9B08C] focus:ring-[#D9B08C]"
                        placeholder="Enter your phone number"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        className="bg-[#121212] border-gray-700 text-white focus:border-[#D9B08C] focus:ring-[#D9B08C]"
                        placeholder="Create a password"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#8B1E3F] to-[#3D315B] hover:from-[#A93B5B] hover:to-[#574873] text-white"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 text-[#D9B08C] hover:text-[#E5C7AD]"
              onClick={() => navigate("/login")}
            >
              Log in
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}