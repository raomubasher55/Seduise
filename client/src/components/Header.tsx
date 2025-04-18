import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Crown, User, Menu, X, LogOut, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isPremium, logout } = useAuth();
  const isMobile = useIsMobile();
  
  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mobile-menu') && !target.closest('.menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header className="py-4 bg-[#1E1E1E] border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-['Playfair_Display'] text-[#D9B08C] font-bold">
              Séduise
            </Link>
            <span className="ml-2 text-xs bg-[#8B1E3F] px-2 py-1 rounded-full uppercase tracking-wider">
              Beta
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/discover" current={location} label="Discover" />
            <NavLink href="/create" current={location} label="Create" />
            <NavLink href="/community" current={location} label="Community" />
            <NavLink href="#role-play" current={location} label="Role-Play" />
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#D9B08C] transition-colors">
              <Search size={20} />
            </Button>
            
            {/* Premium button - hidden on small mobile screens */}
            {isPremium ? (
              <Button className="hidden sm:flex items-center bg-gradient-to-r from-[#8B1E3F] to-[#3D315B] px-4 py-2 rounded-full text-white hover:from-[#A93B5B] hover:to-[#574873] transition-all">
                <Crown size={18} className="mr-2" />
                <span>Premium</span>
              </Button>
            ) : (
              <Link href="/premium">
                <Button className="hidden sm:flex items-center bg-gradient-to-r from-[#8B1E3F] to-[#3D315B] px-4 py-2 rounded-full text-white hover:from-[#A93B5B] hover:to-[#574873] transition-all">
                  <Crown size={18} className="mr-2" />
                  <span>Get Premium</span>
                </Button>
              </Link>
            )}
            
            {/* Credits button - always show when authenticated */}
            {isAuthenticated && (
              <Link href="/credits">
                <Button variant="outline" 
                  className={`flex items-center gap-1 border-amber-700 hover:bg-amber-700/20 group ${isMobile ? 'px-2' : 'px-3'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M9.5 9 h5 l-5 6 h5" />
                  </svg>
                  <span className="font-medium text-amber-500">{user?.credits || 0}</span>
                </Button>
              </Link>
            )}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative w-10 h-10 rounded-full bg-[#574873] flex items-center justify-center cursor-pointer overflow-hidden">
                    {/* If we had user avatars, they would go here */}
                    <User size={18} className="text-white" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#1E1E1E] border-gray-800 text-white">
                  <DropdownMenuLabel className="text-[#D9B08C]">
                    {user?.name}
                  </DropdownMenuLabel>
                  {isPremium && (
                    <div className="px-2 py-1 text-xs bg-gradient-to-r from-[#8B1E3F] to-[#3D315B] text-white rounded m-2 text-center">
                      Premium Member
                    </div>
                  )}
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem className="hover:bg-[#282828]">
                    <Link href="/profile" className="w-full">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#282828]">
                    <Link href="/dashboard" className="w-full">My Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#282828]">
                    <Link href="/credits" className="w-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mr-2">
                        <circle cx="12" cy="12" r="8" />
                        <path d="M9.5 9 h5 l-5 6 h5" />
                      </svg>
                      Credits: {user?.credits || 0}
                    </Link>
                  </DropdownMenuItem>
                  {!isPremium && (
                    <DropdownMenuItem className="hover:bg-[#282828]">
                      <Link href="/premium" className="w-full flex items-center">
                        <Crown size={16} className="mr-2 text-[#D9B08C]" />
                        Get Premium
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'admin' && (
                    <DropdownMenuItem className="hover:bg-[#282828]">
                      <Link href="/admin" className="w-full">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    className="hover:bg-[#282828] cursor-pointer text-[#F87171] flex items-center"
                    onClick={logout}
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" 
                    className={`text-[#D9B08C] border-[#D9B08C] hover:bg-[#D9B08C] hover:text-[#1E1E1E] ${isMobile ? 'px-3 text-sm' : ''}`}
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup" className="hidden sm:block">
                  <Button variant="default" className="bg-[#D9B08C] text-[#1E1E1E] hover:bg-[#E5C7AD]">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-gray-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 bg-[#1E1E1E] border-t border-gray-800 mobile-menu">
            <nav className="flex flex-col space-y-4">
              <MobileNavLink href="/discover" label="Discover" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink href="/create" label="Create" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink href="/community" label="Community" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink href="#role-play" label="Role-Play" onClick={() => setMobileMenuOpen(false)} />
              
              {/* Premium link for mobile */}
              {!isPremium && (
                <MobileNavLink 
                  href="/premium" 
                  label={
                    <div className="flex items-center">
                      <Crown size={16} className="mr-2 text-[#D9B08C]" />
                      <span>Get Premium</span>
                    </div>
                  } 
                  onClick={() => setMobileMenuOpen(false)} 
                />
              )}
              
              {/* Credits link for mobile when authenticated */}
              {isAuthenticated && (
                <MobileNavLink 
                  href="/credits" 
                  label={
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mr-2">
                        <circle cx="12" cy="12" r="8" />
                        <path d="M9.5 9 h5 l-5 6 h5" />
                      </svg>
                      <span>Credits: {user?.credits || 0}</span>
                    </div>
                  } 
                  onClick={() => setMobileMenuOpen(false)} 
                />
              )}
              
              {/* Auth links */}
              {!isAuthenticated ? (
                <>
                  <MobileNavLink href="/login" label="Login" onClick={() => setMobileMenuOpen(false)} />
                  <MobileNavLink href="/signup" label="Sign Up" onClick={() => setMobileMenuOpen(false)} />
                </>
              ) : (
                <>
                  <MobileNavLink href="/profile" label="My Profile" onClick={() => setMobileMenuOpen(false)} />
                  <MobileNavLink href="/dashboard" label="My Dashboard" onClick={() => setMobileMenuOpen(false)} />
                  {user?.role === 'admin' && (
                    <MobileNavLink href="/admin" label="Admin Dashboard" onClick={() => setMobileMenuOpen(false)} />
                  )}
                  <div 
                    className="text-[#F87171] px-4 cursor-pointer flex items-center" 
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  current: string;
  label: string;
}

const NavLink = ({ href, current, label }: NavLinkProps) => {
  const isActive = current === href;
  
  return (
    <Link 
      href={href} 
      className={`${isActive ? 'text-[#D9B08C]' : 'text-white hover:text-[#D9B08C]'} transition-colors`}
    >
      {label}
    </Link>
  );
};

interface MobileNavLinkProps {
  href: string;
  label: string;
  onClick: () => void;
}

const MobileNavLink = ({ href, label, onClick }: MobileNavLinkProps) => {
  return (
    <Link 
      href={href} 
      className="text-white hover:text-[#D9B08C] transition-colors px-4" 
      onClick={onClick}
    >
      {label}
    </Link>
  );
};

export default Header;
