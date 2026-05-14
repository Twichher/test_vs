import { useState } from 'react';
import RegistrationNavbar from '../components/RegistrationNavbar';
import Footer from '../components/Footer';
import StepPersonal from './registration/StepPersonal';
import StepDistrict from './registration/StepDistrict';
import StepCategories from './registration/StepCategories';
import StepSuccess from './registration/StepSuccess';
import './RegistrationPage.css';

const RegistrationPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const handleStep1Complete = () => {
    setStep(2);
  };

  const handleStep2Complete = () => {
    setStep(3);
  };

  const handleStep3Complete = () => {
    setStep(4);
  };

  return (
    <div className="registration-page">
      <RegistrationNavbar />

      <main className="registration-page__main">
        {/* Step indicators */}
        <div className="registration-page__steps">
          <div className={`registration-page__step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="registration-page__step-num">1</span>
            <span className="registration-page__step-label">Личные данные</span>
          </div>
          <div className={`registration-page__step-connector ${step > 1 ? 'active' : ''}`} />
          <div className={`registration-page__step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="registration-page__step-num">2</span>
            <span className="registration-page__step-label">Район</span>
          </div>
          <div className={`registration-page__step-connector ${step > 2 ? 'active' : ''}`} />
          <div className={`registration-page__step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <span className="registration-page__step-num">3</span>
            <span className="registration-page__step-label">Увлечения</span>
          </div>
          <div className={`registration-page__step-connector ${step > 3 ? 'active' : ''}`} />
          <div className={`registration-page__step ${step >= 4 ? 'active' : ''}`}>
            <span className="registration-page__step-num">4</span>
            <span className="registration-page__step-label">Готово</span>
          </div>
        </div>

        {/* Step content */}
        <div className="registration-page__content">
          {step === 1 && (
            <StepPersonal onComplete={handleStep1Complete} />
          )}
          {step === 2 && (
            <StepDistrict onComplete={handleStep2Complete} />
          )}
          {step === 3 && (
            <StepCategories onComplete={handleStep3Complete} />
          )}
          {step === 4 && <StepSuccess />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegistrationPage;
