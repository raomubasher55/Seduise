const CookiePolicy = () => {
  return (
    <div className="bg-[#1a0c2b] text-[#f0e6dc] min-h-screen px-5 py-10">
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-3xl md:text-4xl text-[#e4b58c] text-center mb-10 font-serif">Cookie Policy – Seduice</h1>

        <p className="leading-7 text-base mb-6">
          This Cookie Policy explains how Seduice ("we", "us", or "our") uses cookies and similar technologies 
          to recognize you when you visit our website at seduice.com. It explains what these technologies are 
          and why we use them, as well as your rights to control their use.
        </p>

        <h2 className="text-2xl text-[#e4b58c] mt-8 mb-4 font-serif">1. What are cookies?</h2>
        <p className="leading-7 text-base mb-6">
          Cookies are small data files placed on your computer or mobile device when you visit a website. 
          Cookies are widely used to make websites work, or to work more efficiently, as well as to provide 
          reporting information and personalize user experience.
        </p>

        <h2 className="text-2xl text-[#e4b58c] mt-8 mb-4 font-serif">2. Why do we use cookies?</h2>
        <p className="leading-7 text-base mb-3">
          We use first-party and third-party cookies for several reasons:
        </p>
        <ul className="list-disc pl-8 mb-6">
          <li className="mb-2">To enable basic functionality such as user authentication and session management.</li>
          <li className="mb-2">To store your preferences (e.g., language, theme).</li>
          <li className="mb-2">To collect analytical data to improve our service (via tools such as Google Analytics).</li>
        </ul>

        <h2 className="text-2xl text-[#e4b58c] mt-8 mb-4 font-serif">3. What types of cookies do we use?</h2>
        <p className="leading-7 text-base mb-6">
          <strong className="font-bold">Essential cookies:</strong> Required for the website to function properly.<br />
          <strong className="font-bold">Performance cookies:</strong> Help us understand how users interact with our site.<br />
          <strong className="font-bold">Functionality cookies:</strong> Remember your preferences and settings.<br />
          <strong className="font-bold">Third-party cookies:</strong> May be used for analytics or embedded media (e.g., Stripe, Google Analytics).
        </p>

        <h2 className="text-2xl text-[#e4b58c] mt-8 mb-4 font-serif">4. How can you control cookies?</h2>
        <p className="leading-7 text-base mb-6">
          You have the right to accept or reject cookies. You can change your cookie preferences at any time 
          via the cookie consent banner or your browser settings.
        </p>

        <h2 className="text-2xl text-[#e4b58c] mt-8 mb-4 font-serif">5. Changes to this Cookie Policy</h2>
        <p className="leading-7 text-base mb-6">
          We may update this Cookie Policy from time to time. Any changes will be posted on this page with 
          an updated revision date.
        </p>

        <h2 className="text-2xl text-[#e4b58c] mt-8 mb-4 font-serif">6. Contact</h2>
        <p className="leading-7 text-base mb-6">
          If you have any questions about our use of cookies, please contact us at support@seduice.com.
        </p>
      </div>
    </div>
  );
};

export default CookiePolicy;