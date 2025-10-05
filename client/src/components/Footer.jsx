const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto bottom-0 sticky">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © 2024 MyApp. Tüm hakları saklıdır.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Gizlilik Politikası
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Kullanım Şartları
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              İletişim
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;