import Header from '../Header';
import Footer from '../Footer';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
     

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      
    </div>
  );
};

export default PublicLayout;