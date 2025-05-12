import { useState, useEffect } from 'react';

const AgeVerification = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const ageVerified = localStorage.getItem('ageVerified');
    if (ageVerified !== 'true') {
      setShowPopup(true);
    }
  }, []);

  const acceptAge = () => {
    localStorage.setItem('ageVerified', 'true');
    setShowPopup(false);
  };

  const rejectAge = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[9999]">
      <div className="bg-[#1a0c2b] rounded-2xl p-7 max-w-[420px] w-[90%] text-center text-[#f0e6dc] font-serif">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl text-[#e4b58c] m-0">Seduice</h1>
          <span className="bg-transparent border-2 border-[#e4b58c] py-1 px-2.5 rounded-md font-bold text-[#e4b58c]">18+</span>
        </div>
        <p className="mb-2">This website contains adult content and is intended for users aged 18 and over only.</p>
        <p className="mb-6">By continuing, you confirm that you are of legal age.</p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={acceptAge}
            className="bg-[#b42146] text-white py-3 px-4 rounded-lg text-base font-bold cursor-pointer"
          >
            I am 18 or older – Enter
          </button>
          <button 
            onClick={rejectAge}
            className="bg-black text-[#f0e6dc] py-3 px-4 rounded-lg text-base cursor-pointer"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeVerification;