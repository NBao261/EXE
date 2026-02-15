import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SmartReviewPage from './pages/SmartReviewPage';
import QuizPage from './pages/QuizPage';
import UpgradePage from './pages/UpgradePage';
import PaymentResultPage from './pages/PaymentResultPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MockDefensePage from './pages/MockDefensePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/smart-review" element={<SmartReviewPage />} />
        <Route path="/quiz/:id" element={<QuizPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/payment/success" element={<PaymentResultPage />} />
        <Route path="/payment/failed" element={<PaymentResultPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/mock-defense" element={<MockDefensePage />} />
        <Route path="/mock-defense/:id" element={<MockDefensePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

