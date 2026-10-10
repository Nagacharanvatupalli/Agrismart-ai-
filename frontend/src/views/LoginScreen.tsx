import React, { useState } from 'react';
import { Sprout, Phone, CheckCircle2, Navigation, ArrowRight, Plus, Trash2, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import type { Farm } from '../services/api';

interface LoginScreenProps {
  onLoginComplete: (farms: Farm[]) => void;
}

// ── Defined OUTSIDE LoginScreen to prevent re-mount on every keystroke ─────────
interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  id: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ value, onChange, show, onToggle, placeholder, id }) => (
  <div className="relative flex items-center">
    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
    <input
      id={id}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-11 py-3 text-sm font-bold text-[#102D20] focus:border-[#087A3D] focus:outline-hidden"
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3.5 text-gray-400 hover:text-gray-600"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginComplete }) => {
  // "login" | "signup"
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Shared
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup-only
  const [farmerName, setFarmerName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 (farm setup, signup only)
  const [step, setStep] = useState(1);

  const [farmsList, setFarmsList] = useState<Partial<Farm>[]>([
    {
      farm_name: '',
      acreage: undefined,
      latitude: 16.5449,
      longitude: 81.5212,
      pincode: '',
      village: '',
      mandal: '',
      district: '',
      state: 'Andhra Pradesh',
      soil_ph: undefined
    }
  ]);
  const [currentFarmIndex, setCurrentFarmIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const currentFarm = farmsList[currentFarmIndex] || {};

  const handleUpdateCurrentFarm = (fields: Partial<Farm>) => {
    const updated = [...farmsList];
    updated[currentFarmIndex] = { ...updated[currentFarmIndex], ...fields };
    setFarmsList(updated);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          handleUpdateCurrentFarm({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            village: res.village,
            mandal: res.mandal,
            district: res.district,
            state: res.state,
            pincode: res.pincode || ''
          });
        } catch (err) {
          console.error(err);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        alert("GPS permission denied or unavailable. You can enter address manually.");
      }
    );
  };

  const handlePincodeLookup = async (pincode: string) => {
    handleUpdateCurrentFarm({ pincode });
    if (pincode.length === 6) {
      try {
        const data = await api.lookupPincode(pincode);
        handleUpdateCurrentFarm({
          village: data.village,
          mandal: data.mandal,
          district: data.district,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddAnotherFarm = () => {
    setFarmsList([
      ...farmsList,
      { farm_name: '', acreage: undefined, latitude: 16.54, longitude: 81.51, pincode: '', village: '', mandal: '', district: '', state: 'Andhra Pradesh' }
    ]);
    setCurrentFarmIndex(farmsList.length);
  };

  // ── LOGIN with password ────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!phone.trim() || phone.trim().length < 6) {
      alert("Please enter a valid mobile number.");
      return;
    }
    if (!password.trim()) {
      alert("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      await api.loginWithPassword(phone.trim(), password.trim());
      const farms = await api.getFarms();
      onLoginComplete(farms);
    } catch (err: any) {
      alert(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP step 1: save profile ────────────────────────────────────────────
  const handleSignupStep1 = async () => {
    if (!farmerName.trim()) {
      alert("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      alert("Please enter a valid mobile number.");
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.login(farmerName.trim(), phone.trim(), 'en', password.trim());
      setStep(2);
    } catch (err: any) {
      alert(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP step 2: create farms ────────────────────────────────────────────
  const handleFinishRegistration = async () => {
    setLoading(true);
    try {
      const createdFarms: Farm[] = [];
      for (const f of farmsList) {
        if (f.farm_name && f.farm_name.trim()) {
          const res = await api.createFarm({
            ...f,
            farm_name: f.farm_name.trim(),
            acreage: Number(f.acreage) || 1.0,
            soil_ph: f.soil_ph !== undefined && f.soil_ph !== null && !isNaN(Number(f.soil_ph)) ? Number(f.soil_ph) : null,
            village: f.village || 'Local Village',
            district: f.district || 'District',
            pincode: f.pincode || '500001',
            latitude: f.latitude || 16.54,
            longitude: f.longitude || 81.51
          });
          createdFarms.push(res);
        }
      }
      onLoginComplete(createdFarms);
    } catch (err: any) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-green-100 rounded-3xl p-6 shadow-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[#E7F7E4] text-[#087A3D] flex items-center justify-center mx-auto shadow-sm">
            <Sprout className="w-8 h-8 fill-[#087A3D]" />
          </div>
          <h1 className="text-2xl font-black text-[#102D20]">AgriSmart AI</h1>
          <p className="text-xs text-[#5A6E65] font-semibold">Farmer Portal</p>

          {/* Mode toggle — only on step 1 */}
          {!(mode === 'signup' && step === 2) && (
            <div className="flex bg-gray-100 rounded-2xl p-1 mt-3">
              <button
                onClick={() => { setMode('login'); setStep(1); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  mode === 'login' ? 'bg-[#087A3D] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
              <button
                onClick={() => { setMode('signup'); setStep(1); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  mode === 'signup' ? 'bg-[#087A3D] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </div>
          )}

          {/* Step indicators (signup only) */}
          {mode === 'signup' && (
            <div className="flex justify-center gap-1.5 pt-1">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === i ? 'w-8 bg-[#087A3D]' : step > i ? 'w-4 bg-green-300' : 'w-4 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── LOGIN FORM ─────────────────────────────────────────────────── */}
        {mode === 'login' && (
          <div className="space-y-4">
            <h2 className="font-extrabold text-base text-[#102D20]">Welcome Back 👋</h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Mobile Number</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  id="login-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 Mobile Number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-[#102D20] focus:border-[#087A3D] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Password</label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                placeholder="Enter your password"
              />
            </div>

            <button
              id="btn-login"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#087A3D] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#07552F] transition-colors shadow-md disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              <span>{loading ? 'Signing In...' : 'Login to Dashboard'}</span>
            </button>

            <p className="text-center text-xs text-gray-500">
              New farmer?{' '}
              <button onClick={() => setMode('signup')} className="text-[#087A3D] font-bold hover:underline">
                Create an account
              </button>
            </p>
          </div>
        )}

        {/* ── SIGNUP STEP 1 ──────────────────────────────────────────────── */}
        {mode === 'signup' && step === 1 && (
          <div className="space-y-4">
            <h2 className="font-extrabold text-base text-[#102D20]">Step 1: Farmer Details</h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Full Name</label>
              <input
                id="signup-name"
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#102D20] focus:border-[#087A3D] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Mobile Number (+91)</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  id="signup-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 Mobile Number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-[#102D20] focus:border-[#087A3D] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Create Password</label>
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Confirm Password</label>
              <PasswordInput
                id="signup-confirm-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                placeholder="Re-enter password"
              />
            </div>

            <button
              id="btn-signup-step1"
              onClick={handleSignupStep1}
              disabled={loading}
              className="w-full bg-[#087A3D] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#07552F] transition-colors shadow-md disabled:opacity-50"
            >
              <span>{loading ? 'Saving Profile...' : 'Continue to Farm Setup'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-center text-xs text-gray-500">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-[#087A3D] font-bold hover:underline">
                Login here
              </button>
            </p>
          </div>
        )}

        {/* ── SIGNUP STEP 2 (Farm Setup) ─────────────────────────────────── */}
        {mode === 'signup' && step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-extrabold text-base text-[#102D20]">
                Step 2: Farm Parcel ({currentFarmIndex + 1}/{farmsList.length})
              </h2>
              {farmsList.length > 1 && (
                <button
                  onClick={() => {
                    const filtered = farmsList.filter((_, i) => i !== currentFarmIndex);
                    setFarmsList(filtered);
                    setCurrentFarmIndex(Math.max(0, currentFarmIndex - 1));
                  }}
                  className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            <button
              onClick={handleGetLocation}
              disabled={locating}
              className="w-full bg-[#E7F7E4] border border-green-300 text-[#087A3D] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-100 transition-colors shadow-2xs"
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating GPS...' : '📍 Get My Location (GPS)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Farm Name</label>
                <input
                  type="text"
                  value={currentFarm.farm_name || ''}
                  onChange={(e) => handleUpdateCurrentFarm({ farm_name: e.target.value })}
                  placeholder="e.g. Green Valley Farm"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#102D20]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">Acreage (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={currentFarm.acreage !== undefined ? currentFarm.acreage : ''}
                  onChange={(e) => handleUpdateCurrentFarm({ acreage: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g. 2.5"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#102D20]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700">6-Digit Indian PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={currentFarm.pincode || ''}
                  onChange={(e) => handlePincodeLookup(e.target.value)}
                  placeholder="e.g. 534201"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#102D20]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-medium">Village</span>
                  <p className="font-bold text-[#102D20] truncate">{currentFarm.village || 'Auto-detected via GPS/PIN'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-medium">District</span>
                  <p className="font-bold text-[#102D20] truncate">{currentFarm.district || 'Auto-detected via GPS/PIN'}</p>
                </div>
              </div>
            </div>

            {/* Soil pH (Optional - No asterisk) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-700">
                  Soil pH <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-gray-400">Scale: 0.0 - 14.0</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={currentFarm.soil_ph !== undefined && currentFarm.soil_ph !== null ? currentFarm.soil_ph : ''}
                onChange={(e) => handleUpdateCurrentFarm({ soil_ph: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="e.g. 6.5 (leave blank to set later)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-[#102D20] focus:border-[#087A3D] focus:outline-hidden"
              />
              <p className="text-[10px] text-gray-400">
                Know your soil pH? Enter it here, or leave blank to use manual pH later in Soil Intelligence.
              </p>
            </div>

            <button
              onClick={handleAddAnotherFarm}
              className="w-full border border-dashed border-[#087A3D] text-[#087A3D] font-bold py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs hover:bg-green-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Farm Parcel</span>
            </button>

            <button
              id="btn-finish-registration"
              onClick={handleFinishRegistration}
              disabled={loading}
              className="w-full bg-[#087A3D] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#07552F] transition-colors shadow-md mt-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Finalizing Setup...' : 'Finish & Launch Dashboard'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
