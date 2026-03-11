interface FeatureItem {
    src: string;
    label: string;
  }
  
  const features: FeatureItem[] = [
    {
      src: "/src/assets/bookmark_heart_1.svg",
      label: "Новые знакомства",
    },
    {
      src: "/src/assets/bookmark_heart_2.svg",
      label: "Преодолей страх",
    },
    {
      src: "/src/assets/bookmark_heart_3.svg",
      label: "Просто весело",
    },
  ];
  
  const FeaturesSection: React.FC = () => {
    return (
      <>
        <div className="features-header">Что мы предлагаем</div>
        <section className="features">
          <div className="features-grid">
            {features.map((feature: FeatureItem) => (
              <div className="feature-card" key={feature.label}>
                <img src={feature.src} alt="закладка" className="icon" />
                <span className="feature-label">{feature.label}</span>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };
  
  export default FeaturesSection;
  