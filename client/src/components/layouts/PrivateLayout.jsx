import Header from '../Header';

const PrivateLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Üst Navigasyon */}
      <Header showMenuButton={false} />

      {/* Ana içerik */}
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivateLayout;