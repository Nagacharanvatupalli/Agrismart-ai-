import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  CheckCircle2,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  X,
  SwitchCamera,
  ShieldCheck,
  Zap,
  Leaf,
  Bug,
  Activity,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import type { Farm, AIAskResponse, DiseaseReport } from '../services/api';
import { voiceService } from '../services/voice';

interface AskAgriScreenProps {
  selectedFarm: Farm | null;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  diseaseReport?: DiseaseReport;
  recommendations?: string[];
  evidence?: string;
}

export const AskAgriScreen: React.FC<AskAgriScreenProps> = ({ selectedFarm, onBack }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDiseaseMode, setIsDiseaseMode] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const currentLang = i18n.language || 'en';
  const defaultCrop = selectedFarm?.current_crops || 'Paddy';

  // Initial welcome greeting
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const welcomeText = currentLang === 'te'
      ? `నమస్కారం! నేను మీ అగ్రిస్మార్ట్ AI సహాయకుడిని. ${selectedFarm?.farm_name ? selectedFarm.farm_name + ' కోసం' : ''} పంటలు, ఎరువులు, వాతావరణం లేదా కెమెరా ద్వారా ఆకు ఫోటో తీసి తెగుళ్ల గుర్తింపు కోసం నన్ను అడగండి.`
      : currentLang === 'hi'
      ? `नमस्ते! मैं आपका एग्रीस्मार्ट AI सहायक हूँ। ${selectedFarm?.farm_name ? selectedFarm.farm_name + ' के लिए' : ''} फसलों, कीटों, उर्वरकों या कैमरे से पत्ती की फोटो खींचकर रोग पहचान हेतु पूछ सकते हैं।`
      : currentLang === 'ta'
      ? `வணக்கம்! நான் உங்கள் அக்ரிஸ்மார்ட் AI உதவியாளர். பயிர்கள், உரங்கள், அல்லது கேமரா மூலம் நோய் கண்டறிய என்னை கேளுங்கள்.`
      : currentLang === 'kn'
      ? `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಅಗ್ರಿಸ್ಮಾರ್ಟ್ AI ಸಹಾಯಕ. ಬೆಳೆಗಳು, ರಸಗೊಬ್ಬರಗಳು ಅಥವಾ ಕ್ಯಾಮೆರಾ ಮೂಲಕ ರೋಗ ಪತ್ತೆಗೆ ಕೇಳಿ.`
      : currentLang === 'mr'
      ? `नमस्कार! मी आपला ॲग्रीस्मार्ट AI सहाय्यक आहे. पीक, खते, कीड किंवा कॅमेऱ्याद्वारे रोग निदानासाठी विचारा.`
      : `Namaste! I am your AgriSmart AI Farming Assistant. Ask me anything about ${defaultCrop}, fertilizers, irrigation, or snap a leaf photo using the camera for instant disease & pest diagnosis.`;

    setMessages([
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: welcomeText,
        timestamp: timeStr,
        recommendations: [
          currentLang === 'te' ? 'వరి అగ్గి తెగులు నివారణ' : 'Scan for crop diseases',
          currentLang === 'te' ? 'యూరియా ఎరువుల మోతాదు' : 'Optimal fertilizer timing',
          currentLang === 'te' ? 'స్మార్ట్ నీటిపారుదల సలహా' : 'Irrigation schedule based on weather'
        ]
      }
    ]);
  }, [currentLang, selectedFarm]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Stop camera stream safely
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start live camera stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCameraStream();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by browser');
      }
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(t('cameraPermissionError', 'Camera access unavailable. Please choose a photo from gallery.'));
      // Fallback directly to file input
      fileInputRef.current?.click();
    }
  };

  // Close camera modal
  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  // Switch between front/back camera
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from live video
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage(dataUrl);
        setIsDiseaseMode(true);
        handleCloseCamera();
      }
    }
  };

  // Handle file picker upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result);
        setIsDiseaseMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice speech-to-text toggle
  const handleToggleListen = () => {
    if (isListening) {
      if (recognitionInstance) recognitionInstance.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      const rec = voiceService.startListening(
        currentLang,
        (transcript) => {
          setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        (err) => {
          console.error('Voice recognition error:', err);
          setIsListening(false);
        }
      );
      setRecognitionInstance(rec);
    }
  };

  // Send message to Gemini Multimodal AI
  const handleAsk = async (textToAsk?: string, imageToAnalyze?: string | null) => {
    const query = (textToAsk !== undefined ? textToAsk : question).trim();
    const imagePayload = imageToAnalyze !== undefined ? imageToAnalyze : selectedImage;

    if (!query && !imagePayload) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query || (imagePayload ? t('scanCropDisease', 'Scan this crop leaf for diseases & pests') : ''),
      timestamp: timeStr,
      imageUrl: imagePayload || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const isScan = isDiseaseMode || Boolean(imagePayload);
      const res: AIAskResponse = await api.askAI(
        query || 'Analyze this crop leaf for diseases, pests, and remedies',
        selectedFarm?.id,
        currentLang,
        imagePayload,
        defaultCrop,
        isScan
      );

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diseaseReport: res.disease_report,
        recommendations: res.recommendations || [],
        evidence: res.evidence
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('AI query error:', err);
      const fallbackMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: currentLang === 'te'
          ? 'క్షమించండి, సర్వర్‌తో కనెక్ట్ అవ్వడంలో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.'
          : currentLang === 'hi'
          ? 'क्षमा करें, सर्वर से जुड़ने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'I encountered an issue connecting to the AI diagnostic service. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: ['Retry with a clearer photo', 'Check your internet connection']
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Text to speech (TTS) for specific message
  const handleSpeakMessage = (msg: ChatMessage) => {
    if (speakingId === msg.id) {
      voiceService.stop();
      setSpeakingId(null);
    } else {
      voiceService.stop();
      setSpeakingId(msg.id);
      // Clean markdown tags for clear speech
      const cleanSpeech = msg.text.replace(/[*#_`]/g, '');
      voiceService.speak(cleanSpeech, currentLang, () => {
        setSpeakingId(null);
      });
    }
  };

  // Clear conversation
  const handleClearChat = () => {
    voiceService.stop();
    setSpeakingId(null);
    setMessages([]);
    setSelectedImage(null);
  };

  // Localized suggested sample questions
  const sampleQuestions = currentLang === 'te' ? [
    'వరిలో అగ్గి తెగులు (Blast) నివారణ ఎలా చేయాలి?',
    'మొక్కజొన్నలో కత్తెర పురుగుకు ఏ మందు పిచికారీ చేయాలి?',
    'మిరపలో ఆకుముడుత & బొబ్బర తెగులు నివారణ మందులు?',
    'పత్తిలో రసం పీల్చే పురుగుల సమగ్ర నివారణ పద్ధతులు'
  ] : currentLang === 'hi' ? [
    'धान में झुलसा (Blast) रोग की रोकथाम कैसे करें?',
    'मक्का में फॉल आर्मीवॉर्म कीट के लिए कौन सी दवा डालें?',
    'मिर्च में मरोड़िया (Leaf Curl) रोग की रोकथाम के उपाय?',
    'कपास में सफेद मक्खी एवं थ्रिप्स का जैविक नियंत्रण'
  ] : currentLang === 'ta' ? [
    'நெற்பயிரில் குலை நோய் கட்டுப்பாடு முறைகள்?',
    'மக்காச்சோள படைப்புழு தாக்குதலுக்கு என்ன மருந்து தெளிக்க வேண்டும்?',
    'பருத்தி இலை சுருட்டல் நோய் தடுப்பு முறைகள்?'
  ] : currentLang === 'kn' ? [
    'ಭತ್ತದ ಬೆಂಕಿ ರೋಗ ನಿಯಂತ್ರಣಕ್ಕೆ ಯಾವ ಔಷಧ ಬಳಸಬೇಕು?',
    'ಜೋಳದ ಸೈನಿಕ ಹುಳು ಬಾಧೆಗೆ ಯಾವ ಸಿಂಪಡಣೆ ಸೂಕ್ತ?',
    'ಹತ್ತಿ ಎಲೆ ಸುರುಟು ರೋಗ ನಿಯಂತ್ರಣ ಹೇಗೆ?'
  ] : currentLang === 'mr' ? [
    'भातावरील करपा रोगाच्या नियंत्रणासाठी काय उपाय करावेत?',
    'मक्यावरील लष्करी अळीसाठी कोणती फवारणी करावी?',
    'कापूस पाने आकसणे व रसशोषक किडींचे नियंत्रण कसे करावे?'
  ] : [
    'How to prevent leaf blast and sheath rot in paddy?',
    'Best chemical & organic remedy for Fall Armyworm in maize?',
    'How to treat leaf curl and thrips in chilli?',
    'Organic spray for whiteflies and sucking pests in cotton?'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] max-w-lg mx-auto bg-[#F6F8F7]">
      {/* Hidden File Input & Canvas */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 shadow-2xs flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#005B43] to-emerald-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-[#102344] leading-tight flex items-center gap-1.5">
              <span>{t('askAgriSmart', 'AgriSmart Gemini AI')}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-[#005B43] text-[10px] font-black uppercase tracking-wider">
                Vision
              </span>
            </h2>
            <p className="text-[11px] text-[#536783] font-medium">
              {selectedFarm
                ? `${selectedFarm.farm_name || selectedFarm.village} • ${defaultCrop}`
                : t('cameraInput', 'Voice, Camera & Disease Scanner')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xs font-semibold"
              title={t('clearChat', 'Clear Conversation')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Quick Camera & Action Bar */}
      <div className="bg-white border-b border-emerald-100/60 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => startCamera('environment')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E7F6E9] hover:bg-[#D5EFE0] text-[#005B43] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#005B43]" />
            <span>{t('takePhoto', 'Live Camera Scan')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-gray-600" />
            <span>{t('uploadPhoto', 'Upload Photo')}</span>
          </button>
        </div>

        <button
          onClick={() => setIsDiseaseMode(!isDiseaseMode)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
            isDiseaseMode
              ? 'bg-rose-50 border-rose-300 text-rose-700'
              : 'bg-emerald-50/50 border-emerald-200 text-[#005B43]'
          }`}
          title="Toggle Crop Disease Diagnostic Mode"
        >
          <Bug className="w-3.5 h-3.5" />
          <span>{isDiseaseMode ? t('diseaseScanMode', 'Disease Mode ON') : t('scanCropDisease', 'Disease Scan')}</span>
        </button>
      </div>

      {/* Camera Error Notice (if any) */}
      {cameraError && (
        <div className="mx-4 mt-2 bg-amber-50 border border-amber-200 p-2.5 rounded-2xl flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="p-1 text-amber-600 hover:text-amber-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-xs animate-in fade-in">
          {/* Top Controls */}
          <div className="w-full max-w-md flex items-center justify-between text-white pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold tracking-wide">
                {t('takePhoto', 'LIVE CROP DISEASE VIEWFINDER')}
              </span>
            </div>
            <button
              onClick={handleCloseCamera}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder Window */}
          <div className="relative w-full max-w-sm aspect-4/3 rounded-3xl overflow-hidden border-2 border-emerald-400/80 shadow-2xl bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Box Corners */}
            <div className="absolute inset-6 border border-white/40 rounded-2xl pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white/80 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                  {t('pointCameraAtLeaf', 'Point at affected leaf or pest spot')}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Shutter Bar */}
          <div className="w-full max-w-md flex items-center justify-around pb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title="Upload from gallery"
            >
              <ImageIcon className="w-6 h-6" />
            </button>

            {/* Shutter Button */}
            <button
              onClick={handleCapturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
              title={t('capture', 'Capture Photo')}
            >
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#005B43]">
                <Camera className="w-7 h-7" />
              </div>
            </button>

            <button
              onClick={handleSwitchCamera}
              className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              title="Switch camera"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const rep = msg.diseaseReport;

          return (
            <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#E7F6E9] text-[#005B43] flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-3xl p-4 shadow-2xs space-y-3 ${
                  isUser
                    ? 'bg-[#005B43] text-white rounded-br-sm'
                    : 'bg-white text-[#102344] border border-gray-200 rounded-bl-sm'
                }`}
              >
                {/* Uploaded / Captured Image in User Bubble */}
                {msg.imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden max-h-56 border border-black/10 shadow-inner bg-gray-900">
                    <img src={msg.imageUrl} alt="Crop Scan" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-emerald-400" />
                      <span>{t('cropPhotoAttached', 'Crop leaf analyzed')}</span>
                    </div>
                  </div>
                )}

                {/* Structured Disease Report Card (If detected) */}
                {!isUser && rep && (
                  <div className="bg-[#FAFDF9] border-2 border-emerald-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
                    {/* Disease Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-emerald-100 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#005B43]">
                            {t('diseaseDetected', 'Disease Diagnosis')}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#102344] leading-snug">
                          {rep.disease_name}
                        </h4>
                        <p className="text-[11px] text-[#536783] font-medium">
                          {rep.pathogen_type}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            rep.severity === 'Severe'
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : rep.severity === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : rep.severity === 'Mild'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {rep.severity}
                        </span>
                        <div className="text-[9px] text-[#536783] font-bold mt-1">
                          {Math.round(rep.confidence * 100)}% {t('confidence', 'Confidence')}
                        </div>
                      </div>
                    </div>

                    {/* Symptoms List */}
                    {rep.symptoms && rep.symptoms.length > 0 && (
                      <div className="space-y-1.5">
                        <h5 className="text-[11px] font-extrabold text-[#102344] flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('symptoms', 'Identified Symptoms')}:</span>
                        </h5>
                        <div className="space-y-1 pl-1">
                          {rep.symptoms.map((s, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-1.5 text-[11px] text-[#2C3E50]">
                              <span className="text-amber-500 font-bold">•</span>
                              <span className="leading-snug">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chemical Prescription */}
                    {rep.chemical_cure && rep.chemical_cure.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                        <h5 className="text-[11px] font-extrabold text-rose-800 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-rose-600" />
                          <span>{t('chemicalTreatment', 'Chemical Prescription (Exact Dosage)')}:</span>
                        </h5>
                        <div className="space-y-1 pl-1">
                          {rep.chemical_cure.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              className="text-[11px] bg-rose-50/70 border border-rose-100 p-2 rounded-xl text-rose-900 font-medium leading-relaxed"
                            >
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Organic Solution */}
                    {rep.organic_cure && rep.organic_cure.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                        <h5 className="text-[11px] font-extrabold text-[#005B43] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#005B43]" />
                          <span>{t('organicSolution', 'Organic & Biological Remedies')}:</span>
                        </h5>
                        <div className="space-y-1 pl-1">
                          {rep.organic_cure.map((o, oIdx) => (
                            <div
                              key={oIdx}
                              className="text-[11px] bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-[#005B43] font-medium leading-relaxed"
                            >
                              {o}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prevention Tips */}
                    {rep.prevention && rep.prevention.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                        <h5 className="text-[11px] font-extrabold text-[#536783] flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-[#536783]" />
                          <span>{t('preventionAdvisory', 'Field Prevention Advisory')}:</span>
                        </h5>
                        <div className="space-y-1 pl-1">
                          {rep.prevention.map((p, pIdx) => (
                            <div key={pIdx} className="text-[11px] text-[#536783] leading-snug">
                              • {p}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Explanation */}
                <div className="text-xs leading-relaxed whitespace-pre-line font-medium">
                  {msg.text}
                </div>

                {/* Recommendations Chips */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-[#536783] uppercase tracking-wider block">
                      {t('recommendedMitigation', 'Recommended Next Steps')}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.recommendations.map((rec, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleAsk(rec)}
                          className="text-[11px] bg-gray-50 hover:bg-emerald-50 text-[#005B43] font-semibold px-2.5 py-1 rounded-xl border border-gray-200 transition-colors flex items-center gap-1 cursor-pointer text-left"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#005B43] shrink-0" />
                          <span>{rec}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Footer with Timestamp & Audio button */}
                <div className="flex items-center justify-between pt-1 text-[10px] opacity-80">
                  <span className={isUser ? 'text-emerald-100' : 'text-[#536783]'}>
                    {msg.timestamp}
                  </span>

                  {!isUser && (
                    <button
                      onClick={() => handleSpeakMessage(msg)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors font-bold ${
                        speakingId === msg.id
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-gray-100 hover:bg-emerald-100 text-[#005B43]'
                      }`}
                      title={t('voiceReadout', 'Listen to voice readout')}
                    >
                      {speakingId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>{t('stop', 'Stop')}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>{t('listen', 'Listen')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#102344] text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-8 h-8 rounded-full bg-[#E7F6E9] text-[#005B43] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-emerald-100 p-3.5 rounded-2xl rounded-bl-sm flex items-center gap-2.5 text-xs text-[#005B43] font-bold shadow-xs">
              <Sparkles className="w-4 h-4 animate-spin text-[#005B43]" />
              <span>{t('analyzingDisease', 'AI Multimodal Vision is analyzing leaf pathology...')}</span>
            </div>
          </div>
        )}

        {/* Suggested Starter Questions (when conversation is short) */}
        {messages.length <= 1 && (
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-xs text-[#536783] px-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#005B43]" />
              <span>{t('quickDiseasePrompts', 'Suggested Crop Diagnostic Queries')}</span>
            </h4>
            <div className="space-y-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(q)}
                  className="w-full text-left p-3 rounded-2xl bg-white border border-gray-200 hover:border-[#005B43] text-xs font-semibold text-gray-700 hover:text-[#005B43] transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                >
                  <span>{q}</span>
                  <span className="text-gray-400 group-hover:text-[#005B43] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview Floating Pill */}
      {selectedImage && (
        <div className="mx-4 mb-2 bg-emerald-50 border-2 border-[#005B43] p-2 rounded-2xl shadow-md flex items-center justify-between animate-in slide-in-from-bottom-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-300 shrink-0 bg-gray-900">
              <img src={selectedImage} alt="Crop inspection" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-[#005B43] block">
                {t('cropPhotoAttached', 'Crop leaf photo attached')}
              </span>
              <span className="text-[10px] text-[#536783]">
                {t('scanCropDisease', 'Ready for instant disease detection')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAsk(undefined, selectedImage)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-[#005B43] hover:bg-[#004B37] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              {t('scanCropDisease', 'Scan Now')}
            </button>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1.5 rounded-full hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Input Controls */}
      <div className="bg-white border-t border-gray-200 p-3 shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          {/* Camera Trigger */}
          <button
            type="button"
            onClick={() => startCamera('environment')}
            className="p-2.5 rounded-2xl bg-[#E7F6E9] hover:bg-[#D5EFE0] text-[#005B43] border border-emerald-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title={t('takePhoto', 'Take Photo with Camera')}
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Voice Mic Trigger */}
          <button
            type="button"
            onClick={handleToggleListen}
            className={`p-2.5 rounded-2xl border transition-colors shadow-2xs shrink-0 cursor-pointer ${
              isListening
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
            }`}
            title={isListening ? t('listening', 'Listening...') : t('tapToSpeak', 'Speak Query')}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder={
              selectedImage
                ? t('askFarmerQuestion', 'Ask question about this plant or tap Send to scan...')
                : t('askFarmerQuestion', 'Ask anything or take leaf photo...')
            }
            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-gray-200 focus:outline-hidden focus:border-[#005B43] focus:ring-2 focus:ring-[#005B43]/20 text-xs font-semibold text-gray-800 placeholder:text-gray-400"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={(!question.trim() && !selectedImage) || loading}
            className="p-2.5 rounded-2xl bg-[#005B43] hover:bg-[#004B37] text-white disabled:opacity-40 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
