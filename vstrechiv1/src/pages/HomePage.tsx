import './HomePage.css'
import NavbarNoLogin from '../components/NavbarNoLogin';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';

function HomePage() {
  return (
  <div className="main-page">
    <NavbarNoLogin />
    <HeroSection />
    <FeaturesSection />
    <Footer />
  </div>
  )
}

export default HomePage