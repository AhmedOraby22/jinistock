import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import AITools from "./pages/AITools.jsx";
import BuyCredits from "./pages/BuyCredits.jsx";
import PaymentCallback from "./pages/PaymentCallback.jsx";
import Admin from "./pages/Admin.jsx";
import CreateImage from "./pages/CreateImage.jsx";
import CreateVideo from "./pages/CreateVideo.jsx";
import CreateAudio from "./pages/CreateAudio.jsx";
import CreateAvatar from "./pages/CreateAvatar.jsx";

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="/create/image" element={<CreateImage />} />
        <Route path="/create/video" element={<CreateVideo />} />
        <Route path="/create/audio" element={<CreateAudio />} />
        <Route path="/create/avatar" element={<CreateAvatar />} />
        <Route path="/buy-credits" element={<BuyCredits />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}
