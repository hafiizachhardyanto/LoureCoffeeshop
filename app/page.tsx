import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <main className="flex min-h-screen w-full flex-col items-center justify-center py-20 px-4 bg-gradient-to-br from-base-100 to-base-200">
        <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-xl">
            <span className="text-4xl font-bold text-white">L</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-neutral">
            Loure Coffee Shop
          </h1>
          
          <p className="text-lg md:text-xl leading-relaxed text-neutral/70 max-w-lg">
            Experience the finest coffee in town. Freshly brewed with passion and served with love.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <a
              className="btn btn-primary btn-lg rounded-full px-8 shadow-lg hover:shadow-xl transition-all"
              href="#menu"
            >
              View Menu
            </a>
            <a
              className="btn btn-outline btn-lg rounded-full px-8 border-2 hover:bg-neutral hover:text-white transition-all"
              href="#about"
            >
              About Us
            </a>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="card-title text-neutral">Open Daily</h3>
              <p className="text-neutral/60">7:00 AM - 10:00 PM</p>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body items-center text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="card-title text-neutral">Location</h3>
              <p className="text-neutral/60">123 Coffee Street</p>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="card-title text-neutral">Contact</h3>
              <p className="text-neutral/60">+62 123 4567 890</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}