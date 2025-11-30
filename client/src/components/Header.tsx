import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Crown, User, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
    <header className="sticky top-0 z-50 py-4 bg-[#1E1E1E] border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-['Playfair_Display'] text-[#D9B08C] font-bold">
              Séduise
            </Link>
         
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/discover" current={location} label="Discover" />
            <NavLink href="/create" current={location} label="Create" />
            {(user?.subscription === 'seduction' || user?.subscription === 'intimacy') && <NavLink href="/premium-gallery" current={location} label="Premium Gallery" />}
            {/* <NavLink href="/community" current={location} label="Community" /> */}
            {/* <NavLink href="#role-play" current={location} label="Role-Play" /> */}
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:inline-flex text-gray-400 hover:text-[#D9B08C] transition-colors"
            >
              {/* <Search size={20} /> */}
            </Button>
            
            {/* Premium button with current plan - hidden on small mobile screens */}
            {isPremium ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button className="flex items-center bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-white hover:from-purple-700 hover:to-pink-700 transition-all">
                  <Crown size={18} className="mr-2" />
                  <span>{user?.subscription || 'discovery'}</span>
                </Button>
             
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/premium-upgrade">
                  <Button className="flex items-center bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-white hover:from-purple-700 hover:to-pink-700 transition-all">
                    <Crown size={18} className="mr-2" />
                    <span>{user?.subscription || 'discovery'}</span>
                  </Button>
                </Link>
                
              </div>
            )}
            
            {/* Credits display */}
            {isAuthenticated && (
              <div className="hidden md:block">
                <div className="flex items-center gap-2 border border-amber-700/60 rounded-full px-3 py-1 text-amber-500 bg-[#1A120B]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path d="M9.5 9h5l-5 6h5" />
                  </svg>
                  <span className="text-xs font-semibold">T:{user?.textCredits || 0}</span>
                  <span className="text-gray-400 text-xs">|</span>
                  <span className="text-xs font-semibold">A:{user?.audioCredits || 0}</span>
                </div>
              </div>
            )}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative hidden md:flex w-10 h-10 rounded-full bg-[#574873] items-center justify-center cursor-pointer overflow-hidden">
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
                  <DropdownMenuItem className="hover:bg-[#282828] cursor-default">
                    <div className="w-full flex items-center text-amber-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <path d="M9.5 9h5l-5 6h5" />
                      </svg>
                      <span className="text-xs font-semibold">
                        T:{user?.textCredits || 0} / A:{user?.audioCredits || 0}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  {/* {!isPremium && (
                    <DropdownMenuItem className="hover:bg-[#282828]">
                      <Link href="/premium" className="w-full flex items-center">
                        <Crown size={16} className="mr-2 text-[#D9B08C]" />
                        Get Premium
                      </Link>
                    </DropdownMenuItem>
                  )} */}
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
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" 
                    className="text-[#D9B08C] border-[#D9B08C] hover:bg-[#D9B08C] hover:text-[#1E1E1E]"
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
              className="md:hidden text-gray-400 menu-button"
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
              {(user?.subscription === 'seduction' || user?.subscription === 'intimacy') && <MobileNavLink href="/premium-gallery" label="Premium Gallery" onClick={() => setMobileMenuOpen(false)} />}
              {/* <MobileNavLink href="/community" label="Community" onClick={() => setMobileMenuOpen(false)} /> */}
              {/* <MobileNavLink href="#role-play" label="Role-Play" onClick={() => setMobileMenuOpen(false)} /> */}
              
              {/* Premium link for mobile */}
              {!isPremium && (
                <MobileNavLink 
                  href="/premium-upgrade" 
                  label={
                    <div className="flex items-center">
                      <Crown size={16} className="mr-2 text-purple-400" />
                      <span>{user?.subscription || 'discovery'}</span>
                    </div>
                  } 
                  onClick={() => setMobileMenuOpen(false)} 
                />
              )}
              
              {/* Credits display for mobile when authenticated */}
              {isAuthenticated && (
                <div className="text-white px-4 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-500"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path d="M9.5 9h5l-5 6h5" />
                  </svg>
                  <span className="text-xs text-amber-400 font-semibold">
                    T:{user?.textCredits || 0} / A:{user?.audioCredits || 0}
                  </span>
                </div>
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
  label: React.ReactNode;
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
