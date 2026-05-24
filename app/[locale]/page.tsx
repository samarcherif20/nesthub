import {
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock3,
  Handshake,
  Home,
  KeyRound,
  MapPin,
  MapPinned,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

const heroImage =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=90";

const aboutImage =
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=90";

const showcaseImage =
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=90";

const properties = [
  {
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=90",
    tag: "For Sale",
    title: "Modern Luxury Villa",
    location: "Beverly Hills, CA",
    price: "$1,250,000",
    beds: "5 Beds",
    baths: "4 Baths",
    size: "4,200 sqft",
  },
  {
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=90",
    tag: "For Rent",
    title: "Elegant Family Home",
    location: "Austin, Texas",
    price: "$4,800/mo",
    beds: "4 Beds",
    baths: "3 Baths",
    size: "3,150 sqft",
  },
  {
    img: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=90",
    tag: "Featured",
    title: "Premium Lake House",
    location: "Miami, Florida",
    price: "$980,000",
    beds: "4 Beds",
    baths: "4 Baths",
    size: "3,600 sqft",
  },
];

const aboutPoints = [
  {
    icon: BadgeCheck,
    title: "Verified Properties",
    text: "Every listing is carefully reviewed by our expert team.",
  },
  {
    icon: CheckCircle2,
    title: "Trusted Experience",
    text: "15+ years helping families find the perfect home.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Process",
    text: "Transparent guidance from search to final closing.",
  },
];

const services = [
  {
    icon: Home,
    title: "Buy a Home",
    text: "Discover curated homes that match your lifestyle and budget.",
  },
  {
    icon: Building2,
    title: "Rent Property",
    text: "Find premium apartments, villas and family homes easily.",
  },
  {
    icon: KeyRound,
    title: "Property Management",
    text: "We handle tenants, maintenance and property marketing.",
  },
  {
    icon: Handshake,
    title: "Investment Deals",
    text: "Get high-return property opportunities with expert insights.",
  },
];

const whyItems = [
  {
    icon: Star,
    title: "Premium Listings",
    text: "Only high-quality homes in prime neighborhoods.",
  },
  {
    icon: Clock3,
    title: "Fast Closing",
    text: "Quick documentation and smooth transaction support.",
  },
  {
    icon: TrendingUp,
    title: "Market Experts",
    text: "Smart pricing guidance based on real market data.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Support",
    text: "Dedicated agents available through every step.",
  },
];

const cities = [
  {
    city: "New York",
    count: "85 Properties",
  },
  {
    city: "Los Angeles",
    count: "124 Properties",
  },
  {
    city: "Miami",
    count: "67 Properties",
  },
  {
    city: "Austin",
    count: "92 Properties",
  },
];

export default function HomePage() {
  return (
    <main className="site">
      <header className="header-wrap">
        <div className="container">
          <div className="header glass-3d">
            <a href="#" className="brand">
              <span className="brand-mark">
                <Home size={16} />
              </span>
              <span>Casa Vista</span>
            </a>

            <nav className="nav">
              <a className="active" href="#">
                Home
              </a>
              <a href="#about">About</a>
              <a href="#services">Services</a>
              <a href="#properties">Properties</a>
            </nav>

            <a href="#contact" className="nav-cta">
              Contact
            </a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg">
          <img src={heroImage} alt="Luxury house" />
        </div>

        <div className="container hero-inner">
          <div className="hero-content">
            <span className="hero-kicker">
              <Sparkles size={16} />
              Premium Real Estate Agency
            </span>

            <h1>
              Find Your Dream <span>Property</span> Today!
            </h1>

            <p>
              Explore handpicked villas, apartments and modern homes designed
              for comfort, style and long-term value.
            </p>
          </div>
        </div>
      </section>

      <section className="search-area">
        <div className="container">
          <div className="search-card card-3d">
            <div className="search-tabs">
              <button type="button" className="active">
                Buy
              </button>
              <button type="button">Rent</button>
              <button type="button">Sell</button>
            </div>

            <form className="search-grid">
              <div className="search-field">
                <span>Location</span>
                <strong>Los Angeles, CA</strong>
              </div>

              <div className="search-field">
                <span>Property Type</span>
                <strong>Modern Villa</strong>
              </div>

              <div className="search-field">
                <span>Price Range</span>
                <strong>$500k - $1.5M</strong>
              </div>

              <div className="search-field">
                <span>Bedrooms</span>
                <strong>3+ Rooms</strong>
              </div>

              <button type="button" className="search-btn">
                <Search size={18} />
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="section about-section" id="about">
        <div className="container about-grid">
          <div className="about-copy">
            <span className="kicker">About Us</span>
            <h2>Over 15 Years of Excellence in Real Estate Services</h2>
            <p>
              We help buyers, sellers and investors discover outstanding
              properties with transparent advice, trusted agents and a smooth
              experience from start to finish.
            </p>

            <div className="about-list">
              {aboutPoints.map(({ icon: Icon, title, text }) => (
                <div className="about-item card-3d" key={title}>
                  <span className="icon-pill">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="about-photo tilt-left">
            <img src={aboutImage} alt="Modern property exterior" />
            <div className="floating-stat">
              <strong>15+</strong>
              <span>Years Experience</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section featured-section" id="properties">
        <div className="container">
          <div className="section-top">
            <div>
              <span className="kicker">Featured</span>
              <h2>Explore Featured Properties</h2>
            </div>

            <a href="#" className="view-link">
              View All
            </a>
          </div>

          <div className="property-grid">
            {properties.map((property) => (
              <article className="property-card card-3d" key={property.title}>
                <div className="property-image">
                  <img src={property.img} alt={property.title} />
                  <span className="property-tag">{property.tag}</span>
                </div>

                <div className="property-body">
                  <h3>{property.title}</h3>

                  <p className="location">
                    <MapPin size={15} />
                    {property.location}
                  </p>

                  <p className="price">{property.price}</p>

                  <div className="property-meta">
                    <span>
                      <BedDouble size={15} />
                      {property.beds}
                    </span>
                    <span>
                      <Bath size={15} />
                      {property.baths}
                    </span>
                    <span>
                      <Ruler size={15} />
                      {property.size}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section services-section" id="services">
        <div className="container">
          <div className="solutions-shell">
            <div className="solutions-head">
              <div>
                <span className="kicker">Our Services</span>
                <h2>Comprehensive Real Estate Solutions</h2>
                <p>
                  From buying and selling to property management, our services
                  are built to make every real estate decision easier.
                </p>
              </div>

              <div className="solution-photo tilt-right">
                <img
                  src="https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=90"
                  alt="Real estate interior"
                />
              </div>
            </div>

            <div className="service-grid">
              {services.map(({ icon: Icon, title, text }) => (
                <article className="service-card card-3d" key={title}>
                  <span className="service-icon">
                    <Icon size={24} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section why-section">
        <div className="container">
          <div className="section-top center">
            <div>
              <span className="kicker">Why Us?</span>
              <h2>Why Work with Us?</h2>
            </div>
          </div>

          <div className="why-grid">
            {whyItems.map(({ icon: Icon, title, text }) => (
              <article className="why-card card-3d" key={title}>
                <span className="icon-pill">
                  <Icon size={21} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="showcase">
        <div className="container">
          <div className="showcase-frame tilt-soft">
            <img src={showcaseImage} alt="Luxury home with pool" />
          </div>
        </div>
      </section>

      <section className="section cities-section">
        <div className="container">
          <div className="section-top">
            <div>
              <span className="kicker">Locations</span>
              <h2>Browse Properties By City</h2>
            </div>

            <a href="#" className="view-link">
              View All
            </a>
          </div>

          <div className="city-grid">
            {cities.map((item) => (
              <article className="city-card card-3d" key={item.city}>
                <span className="city-icon">
                  <MapPinned size={22} />
                </span>
                <div>
                  <h3>{item.city}</h3>
                  <p>{item.count}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}