// app/page.tsx
import { Search, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      
      {/* Header / Navigation */}
      <header className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-gray-100">
        <div className="text-2xl font-bold text-blue-600">Logo</div>
        <nav className="hidden md:flex gap-8 text-gray-500">
          <a href="#" className="hover:text-blue-600">Home</a>
          <a href="#" className="hover:text-blue-600">Properties</a>
          <a href="#" className="hover:text-blue-600">Services</a>
          <a href="#" className="hover:text-blue-600">Contact</a>
        </nav>
        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium">Sign In</button>
      </header>

      {/* Hero Section - "Find Your Ideal Property in Minutes." */}
      <section className="text-center py-20 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
          Find Your Ideal Property <br />
          <span className="text-blue-600">in Minutes.</span>
        </h1>
        <p className="text-gray-400 mt-4 text-lg">
          Your Trusted Partner in Property Investment & Management.
        </p>
        
        {/* Search Bar */}
        <div className="flex items-center justify-between max-w-2xl mx-auto mt-10 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
          <div className="flex items-center gap-2 pl-4 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search location" 
              className="outline-none bg-transparent w-full text-gray-700"
            />
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium">
            Search
          </button>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="px-6 md:px-12 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Properties</h2>
          <a href="#" className="text-blue-600 text-sm">View all →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="h-48 bg-gray-200 relative">
                <span className="absolute top-3 left-3 bg-white/90 text-xs px-2 py-1 rounded">Featured</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">Modern Villa</h3>
                <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>Los Angeles, CA</span>
                </div>
                <p className="text-blue-600 font-bold mt-2">$1,250,000</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section - "Take a brief look at some of the services we offer" */}
      <section className="bg-gray-50 py-16 px-6 md:px-12 mt-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Take a brief look at some of the services we offer
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { title: "Property Management", desc: "Full management for your properties" },
            { title: "Investment Advisory", desc: "Expert guidance for smart investments" },
            { title: "Market Analysis", desc: "Data-driven insights for better decisions" },
            { title: "Tenant Placement", desc: "Find quality tenants quickly" },
          ].map((service, idx) => (
            <div key={idx} className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-900">{service.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Most Sought-After Homes */}
      <section className="py-16 px-6 md:px-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
          Explore our most Sought-After Homes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {["Luxury Apartments", "Family Houses", "Modern Condos"].map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="h-52 bg-gray-200"></div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{item}</h3>
                <p className="text-gray-400 text-sm">Starting from $300k</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Explore Properties by City */}
      <section className="bg-gray-50 py-16 px-6 md:px-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
          Explore Properties by City
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {["New York", "Los Angeles", "Chicago", "Miami", "Dallas", "Seattle", "Boston", "Denver"].map((city) => (
            <div 
              key={city} 
              className="bg-white border border-gray-100 py-3 px-4 rounded-lg text-center text-gray-700 hover:border-blue-300 transition cursor-pointer shadow-sm"
            >
              {city}
            </div>
          ))}
        </div>
      </section>

      {/* Job Card - UI/UX Designers · Join Antixor */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-gray-900">UI/UX Designers · Join</h3>
                  <p className="text-gray-400 text-sm">Antixor · 4d · 🌐</p>
                </div>
                <button className="border border-blue-600 text-blue-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-50 transition">
                  Apply
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-3">
                At Antixor, we believe exceptional digital experience... See more
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6 md:px-12 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div>
            <h3 className="text-xl font-bold text-white mb-3">Logo</h3>
            <p className="text-gray-400 text-sm">Your trusted partner in property investment.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Properties</a></li>
              <li><a href="#" className="hover:text-white">Services</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white">FAQs</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white">Newsletter</h4>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 rounded-l-md w-full text-gray-900 outline-none"
              />
              <button className="bg-blue-600 px-4 rounded-r-md hover:bg-blue-700 transition">→</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}