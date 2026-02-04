import { Link } from 'react-router-dom';
import { Search, Shield, Clock, DollarSign } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section with Background Image */}
      <section 
        className="relative text-white py-20 overflow-hidden"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your Guide to Transportation in Bahir Dar
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Seamlessly connect with rides and drivers across the city. 
            Your journey, simplified.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Find a Ride
            </Link>
            <Link 
              to="/register?role=driver" 
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Drive with Us
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works with Subtle Transportation Pattern */}
      <section 
        className="relative py-16 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(249, 250, 251, 0.95), rgba(249, 250, 251, 0.98)),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%233b82f6' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 300px',
          backgroundPosition: 'center, center'
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Search, title: 'Search', desc: 'Enter your destination to find available rides' },
              { icon: Clock, title: 'Book', desc: 'Choose your preferred ride and confirm instantly' },
              { icon: Shield, title: 'Travel', desc: 'Meet your driver and enjoy a safe trip' },
              { icon: DollarSign, title: 'Pay', desc: 'Pay securely through the app' },
            ].map((step, index) => (
              <div key={index} className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-blue-50">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features with Road Map Background */}
      <section 
        className="relative py-16 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(243, 244, 246, 0.95), rgba(243, 244, 246, 0.97)),
            url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 100 Q100 20, 180 100' stroke='%233b82f6' stroke-width='2' stroke-opacity='0.1' fill='none'/%3E%3Cpath d='M20 120 Q100 40, 180 120' stroke='%233b82f6' stroke-width='2' stroke-opacity='0.1' fill='none'/%3E%3Ccircle cx='20' cy='100' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='100' cy='20' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='180' cy='100' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='20' cy='120' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='100' cy='40' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3Ccircle cx='180' cy='120' r='3' fill='%233b82f6' fill-opacity='0.2'/%3E%3C/svg%3E")
          `,
          backgroundSize: 'cover, 400px',
          backgroundPosition: 'center, center'
        }}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Real-Time Tracking',
                desc: 'Watch your ride approach on the map in real-time so you know exactly when to meet your driver.',
                icon: '📍'
              },
              {
                title: 'Safe & Secure',
                desc: 'All drivers are verified, and you can share your trip status with loved ones for peace of mind.',
                icon: '🛡️'
              },
              {
                title: 'Fair Pricing',
                desc: 'Get upfront, transparent pricing before you book. No hidden fees, no surprises.',
                icon: '💵'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="relative bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-1"
              >
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Section: Transportation Network */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Bahir Dar's Largest Transport Network</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
            Connecting every corner of the city with reliable, affordable, and comfortable transportation options.
            From the bustling marketplaces to serene lakeside views, we've got your journey covered.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-700">Active Vehicles</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-700">Service Availability</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-700">On-time Arrival</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-700">Routes Covered</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}