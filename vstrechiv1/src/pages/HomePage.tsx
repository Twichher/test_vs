import './HomePage.css'
import NavbarNoLogin from '../components/NavbarNoLogin';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import { useSelector } from 'react-redux';
import type { RootState } from '../slices/store';
import NavbarLogin from '../components/NavbarLogin';

function HomePage() {
  const { isAuth } = useSelector((state: RootState) => state.auth);
  return (
    <div className="main-page">
      {isAuth ? <NavbarLogin /> : <NavbarNoLogin />}
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}

export default HomePage