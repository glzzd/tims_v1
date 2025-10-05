import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLogin } from "@/hooks/useLogin";
import AppDetail from "@/components/AppDetail";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { formData, handleChange, handleLogin, loading, error } = useLogin();

  return (
    <div className="bg-[linear-gradient(224deg,#AF9DC1_10.18%,#41638A_80.35%)] min-h-screen flex gap-x-50">
      <div className="flex-1 relative flex items-center justify-center">
        <img
          src="/008.png"
          alt="Logo"
          className="absolute top-6 left-6 w-[250px] h-auto z-20"
        />
        <div className="flex flex-col">
         <AppDetail appName={import.meta.env.VITE_APP_NAME} appDescription={import.meta.env.VITE_APP_DESCRIPTION}/>
          <div className="scale-120 h-auto object-contain translate-x-[45%] translate-y-[20%] z-10">
            <img src="/shape.png" alt="Shape" className="animate-floaty" />
          </div>
        </div>
      </div>

      <div className="flex-2 rounded-[50px_0_0_50px] bg-white flex flex-col justify-center items-center gap-10 ">
        <div className="flex flex-col w-full max-w-2xl">
          <span className="text-[#525252] font-bold text-[40px] ">
            Hesaba daxil ol
          </span>
          <span className="text-[#525252]  text-[15px]  ">
            Hesabınıza daxil olmaq üçün istifadəçi məlumatlarını daxil edin
          </span>
        </div>
        <div className="w-2xl">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                E-poçt adresiniz
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="xxx.xxx@scis.gov.az"
                  className={`pl-10 h-12 rounded-xl border-2 transition-all duration-200 `}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Şifrəniz
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  onChange={handleChange}
                  value={formData.password}
                  name="password"
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-12 rounded-xl border-2 transition-all duration-200 `}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600 font-medium">Məni xatırla</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[#41638A] hover:underline font-medium"
              >
                Şifrənizi unutmusunuz?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className=" w-full h-12 rounded-xl font-semibold bg-[#41638A] text-white border-2 border-[#41638A] transition-all duration-200 transform hover:cursor-pointer hover:bg-transparent hover:text-[#41638A] disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
              
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{loading ? 'Giriş edilir...' : 'Daxil ol'}</span>
                {!loading && <ArrowRight className="w-5 h-5" />}
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
              </div>
            </Button>
          </form>
        </div>
        <div>
          <span className="text-sm text-gray-500">
            © {new Date().getFullYear()} Bütün hüquqları EXTŞ tərəfindən qorunur
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
