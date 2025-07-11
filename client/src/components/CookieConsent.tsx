import { useState, useEffect } from 'react';
import { Link } from 'wouter';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookiesConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookiesConsent', 'accepted');
    setShowBanner(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookiesConsent', 'rejected');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#29143f] text-[#f0e6dc] p-6 text-sm z-[10000] shadow-lg animate-slideUp">
      <p className="mb-3">
        This website uses cookies to enhance your experience. You can accept or reject cookies at any time.
        <Link href="/cookie-policy">
          <a className="ml-1 text-[#e4b58c] underline">Learn more</a>
        </Link>
      </p>
      <div className="flex justify-center flex-wrap gap-4">
        <button 
          onClick={acceptCookies}
          className="py-3 px-6 rounded-md font-bold cursor-pointer bg-[#e4b58c] text-[#1a0c2b] transition-colors hover:bg-[#f4c390]"
        >
          Accept
        </button>
        <button 
          onClick={rejectCookies}
          className="py-3 px-6 rounded-md font-bold cursor-pointer bg-[#e4b58c] text-[#1a0c2b] transition-colors hover:bg-[#f4c390]"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;