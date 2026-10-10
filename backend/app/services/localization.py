"""
Centralized Multilingual Localization and Translation Engine for AgriSmart AI.
Supports English (en), Telugu (te), Hindi (hi), Tamil (ta), Kannada (kn), Marathi (mr).
Translates all AI-generated content, weather conditions, advisories, crop data, irrigation plans, and climate hazards.
"""

from typing import Dict, Any, List, Optional
import re

# Crop Names Translations
CROP_NAME_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "paddy": {
        "te": "వరి (Paddy)",
        "hi": "धान (Paddy)",
        "ta": "நெல் (Paddy)",
        "kn": "ಭತ್ತ (Paddy)",
        "mr": "भात (Paddy)",
        "en": "Paddy (Rice)"
    },
    "maize": {
        "te": "మొక్కజొన్న (Maize)",
        "hi": "मक्का (Maize)",
        "ta": "மக்காச்சோளம் (Maize)",
        "kn": "ಮೆಕ್ಕೆಜೋಳ (Maize)",
        "mr": "मका (Maize)",
        "en": "Maize (Corn)"
    },
    "cotton": {
        "te": "పత్తి (Cotton)",
        "hi": "कपास (Cotton)",
        "ta": "பருத்தி (Cotton)",
        "kn": "ಹತ್ತಿ (Cotton)",
        "mr": "कापूस (Cotton)",
        "en": "Cotton"
    },
    "chilli": {
        "te": "మిర్చి (Chilli)",
        "hi": "मिर्च (Chilli)",
        "ta": "மிளகாய் (Chilli)",
        "kn": "ಮೆಣಸಿನಕಾಯಿ (Chilli)",
        "mr": "मिरची (Chilli)",
        "en": "Chilli"
    },
    "groundnut": {
        "te": "వేరుశనగ (Groundnut)",
        "hi": "मूंगफली (Groundnut)",
        "ta": "நிலக்கடலை (Groundnut)",
        "kn": "ಕಡಲೆಕಾಯಿ (Groundnut)",
        "mr": "भुईमूग (Groundnut)",
        "en": "Groundnut (Peanut)"
    },
    "sugarcane": {
        "te": "చెరకు (Sugarcane)",
        "hi": "गन्ना (Sugarcane)",
        "ta": "கரும்பு (Sugarcane)",
        "kn": "ಕಬ್ಬು (Sugarcane)",
        "mr": "ऊस (Sugarcane)",
        "en": "Sugarcane"
    },
    "tomato": {
        "te": "టమోటా (Tomato)",
        "hi": "टमाटर (Tomato)",
        "ta": "தக்காளி (Tomato)",
        "kn": "ಟೊಮ್ಯಾಟೊ (Tomato)",
        "mr": "टोमॅटो (Tomato)",
        "en": "Tomato"
    },
    "blackgram": {
        "te": "మినుములు (Blackgram)",
        "hi": "उड़द (Blackgram)",
        "ta": "உளுந்து (Blackgram)",
        "kn": "ಉದ್ದು (Blackgram)",
        "mr": "उडीद (Blackgram)",
        "en": "Blackgram"
    },
    "greengram": {
        "te": "పెసలు (Greengram)",
        "hi": "मूंग (Greengram)",
        "ta": "பாசிப்பயறு (Greengram)",
        "kn": "ಹೆಸರುಕಾಳು (Greengram)",
        "mr": "मूग (Greengram)",
        "en": "Greengram"
    },
    "redgram": {
        "te": "కందులు (Redgram)",
        "hi": "अरहर / तुअर (Redgram)",
        "ta": "துவரை (Redgram)",
        "kn": "ತೊಗರಿ (Redgram)",
        "mr": "तूर (Redgram)",
        "en": "Redgram"
    },
    "turmeric": {
        "te": "పసుపు (Turmeric)",
        "hi": "हल्दी (Turmeric)",
        "ta": "மஞ்சள் (Turmeric)",
        "kn": "ಅರಿಶಿನ (Turmeric)",
        "mr": "हळद (Turmeric)",
        "en": "Turmeric"
    },
    "onion": {
        "te": "ఉల్లిపాయ (Onion)",
        "hi": "प्याज (Onion)",
        "ta": "வெங்காயம் (Onion)",
        "kn": "ಈರುಳ್ಳಿ (Onion)",
        "mr": "कांदा (Onion)",
        "en": "Onion"
    },
    "sesame": {
        "te": "నువ్వులు (Sesame)",
        "hi": "तिल (Sesame)",
        "ta": "எள் (Sesame)",
        "kn": "ಎಳ್ಳು (Sesame)",
        "mr": "तीळ (Sesame)",
        "en": "Sesame"
    }
}

# Weather Conditions
WEATHER_CONDITION_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "clear sky": {
        "te": "నిర్మలమైన ఆకాశం",
        "hi": "साफ आसमान",
        "ta": "தெளிவான வானம்",
        "kn": "ಸ್ವಚ್ಛ ಆಕಾಶ",
        "mr": "निरभ्र आकाश",
        "en": "Clear Sky"
    },
    "mainly clear": {
        "te": "ఎక్కువగా నిర్మలంగా",
        "hi": "मुख्यतः साफ",
        "ta": "பெரும்பாலும் தெளிவானது",
        "kn": "ಹೆಚ್ಚಾಗಿ ಸ್ಪಷ್ಟ",
        "mr": "मुख्यत्वे निरभ्र",
        "en": "Mainly Clear"
    },
    "partly cloudy": {
        "te": "పాక్షికంగా మేఘావృతం",
        "hi": "आंशिक रूप से बादल",
        "ta": "பகுதி மேகமூட்டம்",
        "kn": "ಭಾಗಶಃ ಮೋಡ",
        "mr": "अंशतः ढगाळ",
        "en": "Partly Cloudy"
    },
    "overcast": {
        "te": "పూర్తిగా మేఘావృతం",
        "hi": "घने बादल",
        "ta": "முழு மேகமூட்டம்",
        "kn": "ಮೋಡ ಕವಿದ ವಾತಾವರಣ",
        "mr": "ढगाळ वातावरण",
        "en": "Overcast"
    },
    "light drizzle": {
        "te": "తేలికపాటి జల్లులు",
        "hi": "हल्की बूंदाबांदी",
        "ta": "லேசான தூறல்",
        "kn": "ತೆಳುವಾದ ತುಂತುರು",
        "mr": "हलकी रिमझिम",
        "en": "Light Drizzle"
    },
    "dense drizzle": {
        "te": "దట్టమైన జల్లులు",
        "hi": "घनी बूंदाबांदी",
        "ta": "அடர்ந்த தூறல்",
        "kn": "ದಟ್ಟ ತುಂತುರು",
        "mr": "दाट रिमझिम",
        "en": "Dense Drizzle"
    },
    "light rain": {
        "te": "తేలికపాటి వర్షం",
        "hi": "हल्की बारिश",
        "ta": "லேசான மழை",
        "kn": "ಸಣ್ಣ ಮಳೆ",
        "mr": "हलका पाऊस",
        "en": "Light Rain"
    },
    "moderate rain": {
        "te": "మోస్తరు వర్షం",
        "hi": "मध्यम बारिश",
        "ta": "மிதமான மழை",
        "kn": "ಮಧ್ಯಮ ಮಳೆ",
        "mr": "मध्यम पाऊस",
        "en": "Moderate Rain"
    },
    "heavy rain": {
        "te": "భారీ వర్షం",
        "hi": "भारी बारिश",
        "ta": "கனமழை",
        "kn": "ಭಾರಿ ಮಳೆ",
        "mr": "मुसळधार पाऊस",
        "en": "Heavy Rain"
    },
    "thunderstorm": {
        "te": "ఉరుములతో కూడిన వర్షం",
        "hi": "गरज के साथ बारिश",
        "ta": "இடி மின்னலுடன் மழை",
        "kn": "ಗುಡುಗು ಸಹಿತ ಮಳೆ",
        "mr": "वादळी पाऊस",
        "en": "Thunderstorm"
    }
}

# Common General Phrases
PHRASE_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "high suitability": {
        "te": "అత్యంత అనుకూలం",
        "hi": "अत्यधिक उपयुक्त",
        "ta": "மிகவும் பொருத்தமானது",
        "kn": "ಹೆಚ್ಚು ಸೂಕ್ತವಾಗಿದೆ",
        "mr": "अत्यंत योग्य",
        "en": "High suitability"
    },
    "alternative option": {
        "te": "ప్రత్యామ్నాయ పంట",
        "hi": "वैकल्पिक फसल",
        "ta": "மாற்று பயிர்",
        "kn": "ಪರ್ಯಾಯ ಬೆಳೆ",
        "mr": "पर्यायी पीक",
        "en": "Alternative option"
    },
    "highly suitable": {
        "te": "అత్యంత అనుకూలం",
        "hi": "अत्यधिक उपयुक्त",
        "ta": "மிகவும் பொருத்தமானது",
        "kn": "ಹೆಚ್ಚು ಸೂಕ್ತವಾಗಿದೆ",
        "mr": "अत्यंत योग्य",
        "en": "Highly Suitable"
    },
    "suitable": {
        "te": "అనుకూలం",
        "hi": "उपयुक्त",
        "ta": "பொருத்தமானது",
        "kn": "ಸೂಕ್ತವಾಗಿದೆ",
        "mr": "योग्य",
        "en": "Suitable"
    },
    "moderately suitable": {
        "te": "మధ్యస్థ అనుకూలం",
        "hi": "मध्यम उपयुक्त",
        "ta": "மிதமான பொருத்தம்",
        "kn": "ಮಧ್ಯಮ ಸೂಕ್ತ",
        "mr": "मध्यम योग्य",
        "en": "Moderately Suitable"
    },
    "high": {
        "te": "ఎక్కువ",
        "hi": "उच्च / अधिक",
        "ta": "அதிகம்",
        "kn": "ಹೆಚ್ಚು",
        "mr": "जास्त",
        "en": "High"
    },
    "moderate": {
        "te": "మధ్యస్థం",
        "hi": "मध्यम",
        "ta": "மிதமானது",
        "kn": "ಮಧ್ಯಮ",
        "mr": "मध्यम",
        "en": "Moderate"
    },
    "low": {
        "te": "తక్కువ",
        "hi": "कम",
        "ta": "குறைவு",
        "kn": "ಕಡಿಮೆ",
        "mr": "कमी",
        "en": "Low"
    },
    "today": {
        "te": "నేడు",
        "hi": "आज",
        "ta": "இன்று",
        "kn": "ಇಂದು",
        "mr": "आज",
        "en": "Today"
    },
    "tomorrow": {
        "te": "రేపు",
        "hi": "कल",
        "ta": "நாளை",
        "kn": "ನಾಳೆ",
        "mr": "उद्या",
        "en": "Tomorrow"
    }
}

class LocalizationService:
    def translate_crop_name(self, name: str, lang: str = "en") -> str:
        if lang == "en" or not name:
            return name
        clean_key = re.sub(r'[^a-z0-9]', '', name.strip().lower())
        for k, mapping in CROP_NAME_TRANSLATIONS.items():
            clean_k = re.sub(r'[^a-z0-9]', '', k.lower())
            if clean_k in clean_key or clean_key in clean_k:
                return mapping.get(lang, mapping.get("en", name))
        return name

    def translate_weather_condition(self, condition: str, lang: str = "en") -> str:
        if lang == "en" or not condition:
            return condition
        clean_key = re.sub(r'[^a-z0-9]', '', condition.strip().lower())
        for k, mapping in WEATHER_CONDITION_TRANSLATIONS.items():
            clean_k = re.sub(r'[^a-z0-9]', '', k.lower())
            if clean_k in clean_key or clean_key in clean_k:
                return mapping.get(lang, condition)
        return condition

    def translate_phrase(self, phrase: str, lang: str = "en") -> str:
        if lang == "en" or not phrase:
            return phrase
        clean_key = re.sub(r'[^a-z0-9]', '', phrase.strip().lower())
        for k, mapping in PHRASE_TRANSLATIONS.items():
            clean_k = re.sub(r'[^a-z0-9]', '', k.lower())
            if clean_k in clean_key or clean_key in clean_k:
                return mapping.get(lang, phrase)
        return phrase

    def localize_weather_insights(self, insights: List[Dict[str, Any]], lang: str = "en") -> List[Dict[str, Any]]:
        if lang == "en" or not insights:
            return insights
        localized = []
        for item in insights:
            title = item.get("title", "")
            msg = item.get("message", "")
            t_type = item.get("type", "info")
            icon = item.get("icon", "sprout")

            if "rain" in title.lower() or "rain" in msg.lower():
                if lang == "te":
                    title_loc = "వర్ష సూచన హెచ్చరిక"
                    msg_loc = "రాబోయే రోజుల్లో వర్షం కురిసే అవకాశం ఉంది. పొలంలో నీటిపారుదల షెడ్యూల్‌ను తదనుగుణంగా సర్దుబాటు చేయండి."
                elif lang == "hi":
                    title_loc = "वर्षा का पूर्वानुमान"
                    msg_loc = "आगामी दिनों में बारिश की संभावना है। तदनुसार सिंचाई कार्यक्रम में बदलाव करें।"
                elif lang == "ta":
                    title_loc = "மழை எச்சரிக்கை"
                    msg_loc = "அடுத்த சில நாட்களில் மழை பெய்ய வாய்ப்புள்ளது. நீர்ப்பாசனத்தை அதற்கேற்ப மாற்றவும்."
                elif lang == "kn":
                    title_loc = "ಮಳೆ ಮುನ್ಸೂಚನೆ"
                    msg_loc = "ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ನೀರಾವರಿಯನ್ನು ಅದಕ್ಕೆ ತಕ್ಕಂತೆ ಸರಿಹೊಂದಿಸಿ."
                elif lang == "mr":
                    title_loc = "पावसाचा अंदाज"
                    msg_loc = "पुढील दिवसांत पावसाची शक्यता आहे. त्यानुसार सिंचनाचे नियोजन करा."
                else:
                    title_loc, msg_loc = title, msg
            elif "clear" in title.lower() or "dry" in msg.lower():
                if lang == "te":
                    title_loc = "అనుకూలమైన పొడి వాతావరణం"
                    msg_loc = "రాబోయే 3 రోజులు పొడి వాతావరణం ఉంటుంది. పురుగుమందుల పిచికారీ మరియు కోత పనులకు ఇది అత్యంత అనుకూలం."
                elif lang == "hi":
                    title_loc = "अनुकूल शुष्क मौसम"
                    msg_loc = "अगले 3 दिनों में अनुकूल शुष्क स्थिति रहेगी। कीटनाशक छिड़काव और कटाई के लिए उपयुक्त।"
                elif lang == "ta":
                    title_loc = "சாதகமான உலர் வானிலை"
                    msg_loc = "அடுத்த 3 நாட்களுக்கு உலர் வானிலை நிலவும். பூச்சிக்கொல்லி தெளிப்பு மற்றும் அறுவடைக்கு உகந்தது."
                elif lang == "kn":
                    title_loc = "ಅನುಕೂಲಕರ ಒಣ ಹವಾಮಾನ"
                    msg_loc = "ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ ಒಣ ಹವಾಮಾನ ಇರುತ್ತದೆ. ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆ ಮತ್ತು ಕೊಯ್ಲಿಗೆ ಸೂಕ್ತ."
                elif lang == "mr":
                    title_loc = "अनुकूल कोरडे हवामान"
                    msg_loc = "पुढील ३ दिवस कोरडे हवामान राहील. कीटकनाशक फवारणी आणि काढणीसाठी आदर्श."
                else:
                    title_loc, msg_loc = title, msg
            else:
                if lang == "te":
                    title_loc = "పంట పెరుగుదలకు అనుకూల పరిస్థితులు"
                    msg_loc = "ప్రస్తుత ఉష్ణోగ్రత మరియు తేమ శాతాలు కిరణజన్య సంయోగక్రియకు మరియు మొక్కల ఆరోగ్యకరమైన పెరుగుదలకు అనుకూలంగా ఉన్నాయి."
                elif lang == "hi":
                    title_loc = "फसल वृद्धि के लिए अनुकूल स्थिति"
                    msg_loc = "वर्तमान तापमान और आर्द्रता प्रकाश संश्लेषण और फसल के समुचित विकास के लिए उत्कृष्ट है।"
                elif lang == "ta":
                    title_loc = "பயிர் வளர்ச்சிக்கு உகந்த சூழல்"
                    msg_loc = "தற்போதைய வெப்பநிலை மற்றும் ஈரப்பதம் பயிர் வளர்ச்சிக்கு மிகவும் சாதகமாக உள்ளது."
                elif lang == "kn":
                    title_loc = "ಬೆಳೆ ಬೆಳವಣಿಗೆಗೆ ಸೂಕ್ತ ಪರಿಸ್ಥಿತಿ"
                    msg_loc = "ಪ್ರಸ್ತುತ ತಾಪಮಾನ ಮತ್ತು ಆರ್ದ್ರತೆಯು ಬೆಳೆ ಬೆಳವಣಿಗೆಗೆ ಅತ್ಯುತ್ತಮವಾಗಿದೆ."
                elif lang == "mr":
                    title_loc = "पीक वाढीसाठी अनुकूल स्थिती"
                    msg_loc = "सध्याचे तापमान आणि आर्द्रता पिकांच्या निरोगी वाढीसाठी उत्तम आहे."
                else:
                    title_loc, msg_loc = title, msg

            localized.append({
                "title": title_loc,
                "message": msg_loc,
                "type": t_type,
                "icon": icon
            })
        return localized

    def localize_weather_advisory(self, advisory: str, condition: str, temp: float, humidity: int, wind_speed: float, lang: str = "en") -> str:
        if lang == "en" or not advisory:
            return advisory
        
        is_rain = "rain" in advisory.lower() or "drizzle" in condition.lower() or "rain" in condition.lower()
        is_heat = "heat" in advisory.lower() or temp > 33
        is_wind = "wind" in advisory.lower() or wind_speed > 15

        if lang == "te":
            if is_rain:
                return f"వర్ష సూచన ఉన్నందున పురుగుమందుల పిచికారీ మరియు నీరు పెట్టడం తాత్కాలికంగా ఆపండి. పొలంలో నీరు నిల్వ ఉండకుండా కాల్వలను సిద్ధం చేయండి."
            elif is_heat:
                return f"ఎండ తీవ్రత ({temp}°C) ఎక్కువగా ఉంది - నేల తేమ ఆరిపోకుండా ఉదయం వేళల్లో నీటి తడులు ఇవ్వండి."
            elif is_wind:
                return f"గాలి వేగం ({wind_speed} km/h) ఎక్కువగా ఉన్నందున మందుల పిచికారీ చేయవద్దు."
            return f"వాతావరణం అనుకూలంగా ఉంది. పంట పెరుగుదలకు మరియు ఎరువుల వినియోగానికి మంచి సమయం."
        
        elif lang == "hi":
            if is_rain:
                return f"बारिश की संभावना के कारण कीटनाशक छिड़काव और सिंचाई रोकें। खेत से जल निकासी की व्यवस्था करें।"
            elif is_heat:
                return f"तापमान अधिक ({temp}°C) है - नमी बनाए रखने के लिए सुबह के समय हल्की सिंचाई करें।"
            elif is_wind:
                return f"हवा की गति ({wind_speed} km/h) तेज है - दवा का छिड़काव न करें।"
            return f"मौसम अनुकूल है। फसल वृद्धि और पोषण प्रबंधन के लिए उपयुक्त समय है।"

        elif lang == "ta":
            if is_rain:
                return f"மழை வாய்ப்பு உள்ளதால் மருந்து தெளிப்பதையும் பாசனத்தையும் ஒத்திவைக்கவும்."
            return f"வானிலை சாதகமாக உள்ளது. பயிர் வளர்ச்சிக்கு உகந்த சூழல்."

        elif lang == "kn":
            if is_rain:
                return f"ಮಳೆ ಸಾಧ್ಯತೆ ಇರುವುದರಿಂದ ಔಷಧಿ ಸಿಂಪಡಣೆ ಮತ್ತು ನೀರಾವರಿಯನ್ನು ಮುಂದೂಡಿ."
            return f"ಹವಾಮಾನವು ಅನುಕೂಲಕರವಾಗಿದೆ. ಬೆಳೆ ಬೆಳವಣಿಗೆಗೆ ಸೂಕ್ತವಾಗಿದೆ."

        elif lang == "mr":
            if is_rain:
                return f"पावसाची शक्यता असल्याने फवारणी आणि सिंचन थांबवा."
            return f"हवामान पिकांच्या वाढीसाठी अनुकूल आहे."

        return advisory

    def generate_localized_audio_summary(self, village: str, temp: float, condition: str, humidity: int, lang: str = "en") -> str:
        trans_cond = self.translate_weather_condition(condition, lang)
        if lang == "te":
            return f"{village} లో ప్రస్తుత ఉష్ణోగ్రత {temp} డిగ్రీల సెల్సియస్, వాతావరణం {trans_cond}. గాలిలో తేమ {humidity} శాతం. పంట పనులకు అనుకూలం."
        elif lang == "hi":
            return f"{village} में वर्तमान तापमान {temp} डिग्री सेल्सियस है, मौसम {trans_cond}। हवा में नमी {humidity} प्रतिशत है।"
        elif lang == "ta":
            return f"{village} வானிலை: வெப்பநிலை {temp} டிகிரி செல்சியஸ், {trans_cond}, ஈரப்பதம் {humidity} சதவீதம்."
        elif lang == "kn":
            return f"{village} ಹವಾಮಾನ: ತಾಪಮಾನ {temp} ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್, {trans_cond}, ಆರ್ದ್ರತೆ {humidity} ಪ್ರತಿಶತ."
        elif lang == "mr":
            return f"{village} हवामान: तापमान {temp} अंश सेल्सिअस, {trans_cond}, आर्द्रता {humidity} टक्के."
        return f"Current weather in {village}: {temp}°C, {condition}. Humidity is {humidity} percent."

    def localize_crop_suitability_reason(self, crop_name: str, ph: float, temp: float, soil_type: str, lang: str = "en") -> str:
        trans_crop = self.translate_crop_name(crop_name, lang)
        if lang == "te":
            return f"మీ పొలం నేల pH {ph} మరియు ప్రస్తుత {temp}°C ఉష్ణోగ్రత {trans_crop} వేరు వ్యవస్థ ఎదుగుదలకు అత్యంత అనుకూలం."
        elif lang == "hi":
            return f"आपकी मिट्टी का pH {ph} और वर्तमान {temp}°C तापमान {trans_crop} की अच्छी पैदावार के लिए आदर्श है।"
        elif lang == "ta":
            return f"மண் pH {ph} மற்றும் வெப்பநிலை {temp}°C {trans_crop} பயிரிட மிகவும் உகந்தது."
        elif lang == "kn":
            return f"ಮಣ್ಣಿನ pH {ph} ಮತ್ತು ತಾಪಮಾನ {temp}°C {trans_crop} ಬೆಳೆಗೆ ಅತ್ಯುತ್ತಮವಾಗಿದೆ."
        elif lang == "mr":
            return f"मातीचा pH {ph} आणि तापमान {temp}°C {trans_crop} पिकासाठी अत्यंत योग्य आहे."
        return f"Optimal soil pH {ph} and current {temp}°C climate provides ideal root growth conditions for {crop_name}."

    def localize_crop_bullets(
        self,
        crop_name: str,
        soil_ph: float,
        soil_type: str,
        season: str,
        suitability_type: str,
        yield_estimate: str,
        lang: str = "en"
    ) -> List[str]:
        """Generate translated bullet points for crop recommendation cards."""
        if lang == "en":
            return [
                f"Matches your soil pH ({soil_ph:.1f})",
                f"Ideal for {soil_type} soil",
                f"Expected yield {yield_estimate}"
            ]

        trans_crop = self.translate_crop_name(crop_name, lang)

        if lang == "te":
            suit_label = {
                "best": "అత్యంత అనుకూలం",
                "good": "అనుకూలం",
                "alternative": "ప్రత్యామ్నాయ పంట"
            }.get(suitability_type, "అనుకూలం")
            return [
                f"మీ నేల pH {soil_ph:.1f}కు సరిపోతుంది",
                f"{soil_type} నేలకు {suit_label}",
                f"నిరీక్షిత దిగుబడి: {yield_estimate}"
            ]
        elif lang == "hi":
            suit_label = {
                "best": "अत्यधिक उपयुक्त",
                "good": "उपयुक्त",
                "alternative": "वैकल्पिक फसल"
            }.get(suitability_type, "उपयुक्त")
            return [
                f"आपकी मिट्टी pH {soil_ph:.1f} के अनुकूल",
                f"{soil_type} मिट्टी के लिए {suit_label}",
                f"अपेक्षित उपज: {yield_estimate}"
            ]
        elif lang == "ta":
            suit_label = {
                "best": "மிகவும் பொருத்தமானது",
                "good": "பொருத்தமானது",
                "alternative": "மாற்று பயிர்"
            }.get(suitability_type, "பொருத்தமானது")
            return [
                f"உங்கள் மண் pH {soil_ph:.1f}க்கு பொருந்தும்",
                f"{soil_type} மண்ணுக்கு {suit_label}",
                f"எதிர்பார்க்கப்படும் விளைச்சல்: {yield_estimate}"
            ]
        elif lang == "kn":
            suit_label = {
                "best": "ಹೆಚ್ಚು ಸೂಕ್ತ",
                "good": "ಸೂಕ್ತ",
                "alternative": "ಪರ್ಯಾಯ ಬೆಳೆ"
            }.get(suitability_type, "ಸೂಕ್ತ")
            return [
                f"ನಿಮ್ಮ ಮಣ್ಣಿನ pH {soil_ph:.1f}ಗೆ ಸೂಕ್ತ",
                f"{soil_type} ಮಣ್ಣಿಗೆ {suit_label}",
                f"ನಿರೀಕ್ಷಿತ ಇಳುವರಿ: {yield_estimate}"
            ]
        elif lang == "mr":
            suit_label = {
                "best": "अत्यंत योग्य",
                "good": "योग्य",
                "alternative": "पर्यायी पीक"
            }.get(suitability_type, "योग्य")
            return [
                f"तुमच्या मातीच्या pH {soil_ph:.1f}साठी योग्य",
                f"{soil_type} मातीसाठी {suit_label}",
                f"अपेक्षित उत्पन्न: {yield_estimate}"
            ]

        return [
            f"Matches your soil pH ({soil_ph:.1f})",
            f"Ideal for {soil_type} soil",
            f"Expected yield {yield_estimate}"
        ]

    def localize_irrigation_advice(self, action: str, pump_mins: int, water_saved_liters: int, soil_status: str, lang: str = "en") -> Dict[str, str]:
        if lang == "te":
            if "delay" in action.lower() or "postpone" in action.lower():
                msg = "వర్ష సూచన లేదా తగినంత నేల తేమ ఉన్నందున నేడు నీరు పెట్టడం వాయిదా వేయండి."
            elif pump_mins > 0:
                msg = f"నేల తేమ తగ్గినందున మోటారును {pump_mins} నిమిషాలు నడపడం మంచిది."
            else:
                msg = "నేలలో సరిపడా తేమ ఉంది - అదనపు నీరు అవసరం లేదు."
            return {
                "headline": "స్మార్ట్ నీటి పారుదల సిఫార్సు",
                "message": msg,
                "status_label": "తగినంత తేమ" if "optimal" in soil_status.lower() else "నీరు అవసరం",
                "water_saved_label": f"నేడు ఆదా చేసిన నీరు: {water_saved_liters:,} లీటర్లు"
            }
        elif lang == "hi":
            if "delay" in action.lower() or "postpone" in action.lower():
                msg = "बारिश की संभावना या पर्याप्त नमी के कारण आज सिंचाई टालें।"
            elif pump_mins > 0:
                msg = f"नमी कम होने के कारण पंप को {pump_mins} मिनट चलाने की सलाह दी जाती है।"
            else:
                msg = "खेत में पर्याप्त नमी है - अतिरिक्त सिंचाई की आवश्यकता नहीं है।"
            return {
                "headline": "स्मार्ट सिंचाई सिफारिश",
                "message": msg,
                "status_label": "पर्याप्त नमी" if "optimal" in soil_status.lower() else "सिंचाई आवश्यक",
                "water_saved_label": f"आज बचाया गया पानी: {water_saved_liters:,} लीटर"
            }
        return {
            "headline": "Smart Irrigation Recommendation",
            "message": f"Run irrigation pump for {pump_mins} minutes" if pump_mins > 0 else "Optimal moisture present - postpone pumping.",
            "status_label": soil_status,
            "water_saved_label": f"Water Saved Today: {water_saved_liters:,} L"
        }

    def translate_stage(self, stage: str, lang: str = "en") -> str:
        if lang == "en" or not stage:
            return stage
        s_lower = stage.strip().lower()
        if "vegetative" in s_lower:
            return {"te": "శాకీయ దశ (Vegetative)", "hi": "वानस्पतिक अवस्था", "ta": "வளர்ச்சி நிலை", "kn": "ಬೆಳವಣಿಗೆ ಹಂತ", "mr": "शाकीय वाढ अवस्था"}.get(lang, stage)
        if "flowering" in s_lower or "reproduct" in s_lower:
            return {"te": "పూత మరియు పునరుత్పత్తి దశ", "hi": "फूल आने की अवस्था", "ta": "பூக்கும் நிலை", "kn": "ಹೂಬಿಡುವ ಹಂತ", "mr": "फुलोरा अवस्था"}.get(lang, stage)
        if "initial" in s_lower or "sowing" in s_lower or "emergence" in s_lower:
            return {"te": "ప్రారంభ / మొలకెత్తే దశ", "hi": "प्रारंभिक / अंकुरण अवस्था", "ta": "முளைக்கும் நிலை", "kn": "ಮೊಳಕೆಯೊಡೆಯುವ ಹಂತ", "mr": "अंकुरण अवस्था"}.get(lang, stage)
        if "matur" in s_lower or "harvest" in s_lower or "grain" in s_lower:
            return {"te": "పరిపక్వత / కోత దశ", "hi": "परिपक्वता / कटाई अवस्था", "ta": "அறுவடை நிலை", "kn": "ಕೊಯ್ಲು ಹಂತ", "mr": "पक्वता / काढणी अवस्था"}.get(lang, stage)
        return stage

    def translate_crop_status(self, status: str, lang: str = "en") -> str:
        if lang == "en" or not status:
            return status
        s_lower = status.strip().lower()
        if "healthy" in s_lower or "good" in s_lower:
            return {"te": "ఆరోగ్యకరం", "hi": "स्वस्थ", "ta": "ஆரோக்கியமானது", "kn": "ಆರೋಗ್ಯಕರ", "mr": "निरोगी"}.get(lang, status)
        if "attention" in s_lower:
            return {"te": "శ్రద్ధ అవసరం", "hi": "ध्यान देने योग्य", "ta": "கவனம் தேவை", "kn": "ಗಮನ ಅಗತ್ಯವಿದೆ", "mr": "लक्ष देणे आवश्यक"}.get(lang, status)
        if "critical" in s_lower or "poor" in s_lower or "risk" in s_lower:
            return {"te": "ప్రమాదకరం", "hi": "गंभीर स्थिति", "ta": "ஆபத்தானது", "kn": "ಅಪಾಯಕಾರಿ", "mr": "गंभीर"}.get(lang, status)
        return status

    def localize_climate_summary_headline(self, village: str, overall_level: str, lang: str = "en") -> str:
        if lang == "te":
            if overall_level == "High":
                return f"{village} ప్రాంతంలో అధిక వాతావరణ ముప్పులు గుర్తించబడ్డాయి"
            elif overall_level == "Moderate":
                return f"{village} లో మధ్యస్థ ఉష్ణోగ్రత మరియు తేమ ముప్పులు క్రియాశీలంగా ఉన్నాయి"
            return f"{village} లో వాతావరణం స్థిరంగా మరియు సాగుకు అనుకూలంగా ఉంది"
        elif lang == "hi":
            if overall_level == "High":
                return f"{village} क्षेत्र में उच्च जलवायु जोखिम पाए गए हैं"
            elif overall_level == "Moderate":
                return f"{village} में मध्यम तापमान एवं आर्द्रता जोखिम सक्रिय हैं"
            return f"{village} में मौसम अनुकूल एवं कृषि कार्य हेतु उपयुक्त है"
        elif lang == "ta":
            if overall_level == "High":
                return f"{village} பகுதியில் தீவிர வானிலை அபாயங்கள் கண்டறியப்பட்டுள்ளன"
            return f"{village} பகுதியில் வானிலை விவசாயத்திற்கு உகந்ததாக உள்ளது"
        elif lang == "kn":
            if overall_level == "High":
                return f"{village} ಪ್ರದೇಶದಲ್ಲಿ ಹೆಚ್ಚಿನ ಹವಾಮಾನ ಅಪಾಯಗಳು ಕಂಡುಬಂದಿವೆ"
            return f"{village} ಪ್ರದೇಶದಲ್ಲಿ ಹವಾಮಾನವು ಕೃಷಿಗೆ ಅನುಕೂಲಕರವಾಗಿದೆ"
        elif lang == "mr":
            if overall_level == "High":
                return f"{village} भागात उच्च हवामान धोके आढळले आहेत"
            return f"{village} भागात हवामान शेतीसाठी अनुकूल आहे"
        
        if overall_level == "High":
            return f"High Climate Hazards Detected for {village}"
        elif overall_level == "Moderate":
            return f"Moderate Heat & Moisture Risks Active in {village}"
        return f"Stable Weather & Favorable Farming Window in {village}"

    def localize_prediction_card(
        self,
        pred_id: str,
        severity: str,
        metric: str,
        crop_name: str,
        lang: str = "en"
    ) -> Dict[str, Any]:
        trans_crop = self.translate_crop_name(crop_name, lang)
        
        # 1. Heat stress
        if pred_id == "heat_stress":
            if lang == "te":
                return {
                    "category": "ఎండ తీవ్రత & వడగాలులు",
                    "title": "అధిక ఉష్ణోగ్రత & ఉక్కపోత ముప్పు",
                    "forecast_window": "రాబోయే 48-72 గంటలు",
                    "agronomic_impact": f"తీవ్రమైన వేడిమి వల్ల {trans_crop} లో బాష్పోత్సేకం పెరుగుతుంది. 35°C దాటిన ఉష్ణోగ్రత వల్ల పూత రాలడం మరియు గింజ పాలు పోసుకునే సామర్థ్యం తగ్గుతుంది.",
                    "action_advice": "వేర్ల ఉష్ణోగ్రతను తగ్గించడానికి ఉదయం (8 గంటలలోపు) లేదా సాయంత్రం వేళల్లో నీటి తడులు ఇవ్వండి. మధ్యాహ్నం 11 నుండి 3 గంటల మధ్య రసాయన పిచికారీ చేయవద్దు.",
                    "mitigation_steps": [
                        f"{trans_crop} పొలంలో వేర్ల ఉష్ణోగ్రతను అదుపులో ఉంచడానికి 3–5 సెం.మీ నీటి నిల్వ ఉంచండి.",
                        "కణాల దృఢత్వాన్ని పెంచడానికి పొటాషియం నైట్రేట్ (1%) తేలికపాటి పిచికారీ చేయండి.",
                        "మధ్యాహ్నపు ఎండ తీవ్రత సమయంలో నత్రజని ఎరువులు వేయడం మానుకోండి."
                    ]
                }
            elif lang == "hi":
                return {
                    "category": "तापमान तनाव एवं लू",
                    "title": "अत्यधिक तापमान एवं थर्मल स्ट्रेस चेतावनी",
                    "forecast_window": "अगले 48-72 घंटे",
                    "agronomic_impact": f"अत्यधिक गर्मी के कारण {trans_crop} में वाष्पोत्सर्जन बढ़ जाता है तथा फूल झड़ने का खतरा रहता है।",
                    "action_advice": "जड़ों को ठंडा रखने के लिए सुबह 8 बजे से पहले या शाम को हल्की सिंचाई करें। दोपहर में छिड़काव न करें।",
                    "mitigation_steps": [
                        f"{trans_crop} के खेत में जड़ों के तापमान को नियंत्रित करने के लिए 3-5 सेमी पानी बनाए रखें।",
                        "पौधों की सहनशीलता बढ़ाने के लिए पोटेशियम नाइट्रेट (1%) का हल्का छिड़काव करें।",
                        "दोपहर की तेज धूप में यूरिया या नाइट्रोजन उर्वरक डालने से बचें।"
                    ]
                }

        # 2. Rain & Waterlogging
        elif pred_id == "heavy_rain":
            if lang == "te":
                return {
                    "category": "భారీ వర్షం & నీటి ముంపు",
                    "title": "మోస్తరు నుండి భారీ వర్షం కురిసే అవకాశం",
                    "forecast_window": "1 నుండి 3 రోజుల సూచన",
                    "agronomic_impact": f"వర్షపు నీరు నిల్వ ఉండడం వల్ల {trans_crop} వేర్లకు ప్రాణవాయువు అందక పోషకాల లీచింగ్ మరియు వేరుకుళ్లు సమస్య ఏర్పడుతుంది.",
                    "action_advice": "పొలంలోని మురుగునీటి కాల్వలను తక్షణమే సరిచేయండి. వర్షం తగ్గే వరకు యూరియా లేదా ఎరువులు చల్లడం ఆపండి.",
                    "mitigation_steps": [
                        "పొలం చుట్టూ ఉన్న కాలువలు మరియు డ్రైనేజీ రంధ్రాల అడ్డంకులను వెంటనే తొలగించండి.",
                        "పోషకాలు కొట్టుకుపోకుండా వర్షం ఆగే వరకు రసాయన ఎరువుల వాడకాన్ని నిలిపివేయండి.",
                        "స్ప్రేయర్లు, మోటార్లు మరియు కోసిన ధాన్యాన్ని ఎత్తైన సురక్షిత ప్రాంతంలో భద్రపరచండి."
                    ]
                }
            elif lang == "hi":
                return {
                    "category": "वर्षा एवं जलभराव",
                    "title": "मध्यम से भारी वर्षा का पूर्वानुमान",
                    "forecast_window": "अगले 1-3 दिन",
                    "agronomic_impact": f"जलभराव से {trans_crop} की जड़ों में हवा का संचार रुक सकता है और पोषक तत्व बह सकते हैं।",
                    "action_advice": "खेत की मेड़ों और जल निकासी नालियों को खोलें। बारिश थमने तक यूरिया का छिड़काव रोकें।",
                    "mitigation_steps": [
                        "खेत के जल निकास नालों को तुरंत साफ करें।",
                        "उर्वरक बहाव से बचाने के लिए वर्षा के दौरान खाद न डालें।",
                        "कटाई किए गए उत्पाद और कीटनाशक पंपों को सूखे स्थान पर सुरक्षित रखें।"
                    ]
                }

        # 3. Wind & Lodging
        elif pred_id == "wind_lodging":
            if lang == "te":
                return {
                    "category": "ఈదురు గాలులు & పంట పడిపోవడం",
                    "title": "ఈదురు గాలుల ముప్పు & పంట ఒరిగిపోయే ప్రమాదం",
                    "forecast_window": "రాబోయే 48 గంటలు",
                    "agronomic_impact": f"బలమైన ఈదురు గాలుల వల్ల ఎదుగుతున్న {trans_crop} కాండం ఒరిగిపోవడం (Lodging) మరియు మందుల పిచికారీ 45% పైగా వృధా అవుతుంది.",
                    "action_advice": "ఈదురు గాలులు వీచే సమయంలో డ్రోన్ లేదా ట్రాక్టర్ స్ప్రేయింగ్ పనులను ఖచ్చితంగా నిలిపివేయండి. గట్ల మట్టిని ఎగదోయండి.",
                    "mitigation_steps": [
                        "వేర్ల పట్టు గట్టిగా ఉండడానికి గాలులు తీవ్రంగా ఉన్నప్పుడు పొలంలో అధిక నీటిని బయటకు తీయండి.",
                        "గాలి వేగం 15 km/h దాటినప్పుడు రసాయన మందులు పిచికారీ చేయవద్దు.",
                        "షేడ్ నెట్లు మరియు తాత్కాలిక నర్సరీలను భద్రపరచండి."
                    ]
                }
            elif lang == "hi":
                return {
                    "category": "तेज हवाएं एवं फसल गिरना",
                    "title": "तेज हवाएं एवं फसल गिरने का जोखिम",
                    "forecast_window": "अगले 48 घंटे",
                    "agronomic_impact": f"तेज हवाओं से {trans_crop} के पौधे गिरने का खतरा रहता है तथा कीटनाशक छिड़काव 45% से अधिक बर्बाद होता है।",
                    "action_advice": "तेज हवाओं के दौरान ड्रोन या ट्रैक्टर स्प्रे पूरी तरह बंद रखें। पौधों को मिट्टी चढ़ाकर सहारा दें।",
                    "mitigation_steps": [
                        "जड़ों की पकड़ मजबूत रखने के लिए खेत से अतिरिक्त पानी निकाल दें।",
                        "15 किमी/घंटा से अधिक हवा में कीटनाशक छिड़काव न करें।",
                        "शेड नेट और नर्सरी को मजबूत सहारा दें।"
                    ]
                }

        # 4. Pest & Disease
        elif pred_id == "pest_disease":
            if lang == "te":
                return {
                    "category": "చీడపీడలు & శిలీంధ్ర తెగుళ్లు",
                    "title": "అగ్గి తెగులు & కాండం కుళ్లు తెగులు వ్యాప్తి హెచ్చరిక",
                    "forecast_window": "రాబోయే 3-5 రోజులు",
                    "agronomic_impact": f"అధిక తేమ మరియు వెచ్చని వాతావరణం వల్ల {trans_crop} లో అగ్గి తెగులు (Blast) మరియు రసం పీల్చే పురుగుల వ్యాప్తి తీవ్రమవుతుంది.",
                    "action_advice": "ఉదయం 7 గంటలకు పిలకల మొదళ్లను గమనించండి. అధిక నత్రజని వాడకం వల్ల ఆకులు మృదువుగా మారి తెగుళ్లు సులభంగా ఆశిస్తాయి.",
                    "mitigation_steps": [
                        "ఆకులపై నూలుకండె ఆకారపు మచ్చలు ఉన్నాయో లేదో పొలం అంతటా పరిశీలించండి.",
                        "గాలి ప్రసరణ బాగుండడానికి అల్టర్నేట్ వెట్టింగ్ & డ్రైయింగ్ పద్ధతిని పాటించండి.",
                        "లక్షణాలు కనిపించగానే ట్రైసైక్లాజోల్ లేదా సిఫార్సు చేసిన బయో-పెస్టిసైడ్ పిచికారీకి సిద్ధంగా ఉంచండి."
                    ]
                }
            elif lang == "hi":
                return {
                    "category": "कीट एवं फफूंद जनित रोग",
                    "title": "ब्लास्ट एवं शीथ ब्लाइट रोग प्रकोप की चेतावनी",
                    "forecast_window": "अगले 3-5 दिन",
                    "agronomic_impact": f"उच्च आर्द्रता के कारण {trans_crop} में फफूंद जनित रोग और रस चूसक कीटों का प्रसार तेजी से होता है।",
                    "action_advice": "सुबह के समय पौधों की जड़ों की जांच करें। अत्यधिक यूरिया के प्रयोग से बचें।",
                    "mitigation_steps": [
                        "पत्तियों पर भूरे धब्बों के लक्षणों की नियमित निगरानी करें।",
                        "हवा का प्रवाह बनाए रखने के लिए खेत में पानी बदलते रहें।",
                        "लक्षण दिखने पर ट्राइसाइक्लाजोल या जैविक कीटनाशक का छिड़काव करें।"
                    ]
                }

        # 5. Dry spell
        elif pred_id == "dry_spell":
            if lang == "te":
                return {
                    "category": "పొడి వాతావరణం & నీటి ఎద్దడి",
                    "title": "సుదీర్ఘ పొడి వాతావరణం & తేమ కొరత",
                    "forecast_window": "7 రోజుల అంచనా",
                    "agronomic_impact": f"నేలలో తేమ త్వరగా ఆరిపోవడం వల్ల {trans_crop} వేర్లపై ఒత్తిడి పెరిగి కిరణజన్య సంయోగక్రియ వేగం తగ్గుతుంది.",
                    "action_advice": "ప్రణాళికాబద్ధంగా నీటి తడులు ఇవ్వండి. తేమ ఆవిరి కాకుండా వరి గడ్డి లేదా ఎండుటాకులతో మల్చింగ్ చేయండి.",
                    "mitigation_steps": [
                        "ప్రతి 3–4 రోజులకు ఒకసారి తేలికపాటి డ్రిప్ లేదా కాల్వ తడి ఇవ్వండి.",
                        "తేమ ఆవిరి కాకుండా నేలపై ఎండు ఆకులు లేదా గడ్డి పరచండి.",
                        "నీరు పెట్టే ముందు 15 సెం.మీ లోతులో నేల తేమను పరీక్షించండి."
                    ]
                }
            elif lang == "hi":
                return {
                    "category": "शुष्क दौर एवं वाष्पीकरण",
                    "title": "लंबा शुष्क दौर एवं मिट्टी में नमी की कमी",
                    "forecast_window": "7 दिवसीय दृष्टिकोण",
                    "agronomic_impact": f"नमी कम होने से {trans_crop} के पौधों में तनाव बढ़ता है और पैदावार प्रभावित होती है।",
                    "action_advice": "सिंचाई चक्र की योजना बनाएं। मिट्टी में नमी बनाए रखने के लिए पुआल की मल्चिंग करें।",
                    "mitigation_steps": [
                        "प्रत्येक 3-4 दिन में ड्रिप या हल्की सिंचाई करें।",
                        "वाष्पीकरण रोकने के लिए जैविक मल्चिंग का उपयोग करें।",
                        "अगली सिंचाई से पहले 15 सेमी गहराई पर नमी की जांच करें।"
                    ]
                }

        # 6. Spray window
        elif pred_id == "spray_window":
            if lang == "te":
                return {
                    "category": "పంట పిచికారీ అనుకూల సమయం",
                    "title": "పురుగుమందులు & పోషకాల పిచికారీకి అనుకూల వాతావరణం",
                    "forecast_window": "ఉదయం వేళలు",
                    "agronomic_impact": "ప్రశాంతమైన గాలి మరియు పొడి ఆకులు పిచికారీ ద్రావణం సమర్థవంతంగా ఆకులపై నిలిచి ఉండేలా చేస్తాయి.",
                    "action_advice": "సూక్ష్మపోషకాలు, జింక్ మరియు రక్షణ మందుల పిచికారీ కోసం ఉదయం 6:30 నుండి 9:30 గంటల సమయాన్ని ఎంచుకోండి.",
                    "mitigation_steps": [
                        "సమతుల్య కవరేజ్ కోసం స్ప్రేయర్ నాజిల్‌ను చక్కగా క్రమాంకనం చేయండి.",
                        "మందు ఆకులపై చక్కగా అంటుకోవడానికి స్ప్రెడ్డింగ్ ఏజెంట్ (0.5 ml/L) కలపండి.",
                        "ఆకులపై ఉదయపు మంచు బిందువులు ఆరిన తర్వాత మాత్రమే పిచికారీ ప్రారంభించండి."
                    ]
                }
            elif lang == "hi":
                return {
                    "category": "कीटनाशक छिड़काव का अनुकूल समय",
                    "title": "दवा एवं पोषक तत्व छिड़काव हेतु उत्तम अवसर",
                    "forecast_window": "प्रातः काल",
                    "agronomic_impact": "शांत हवा और सूखी पत्तियां दवा के बेहतर अवशोषण में सहायक होती हैं।",
                    "action_advice": "जिंक एवं सुरक्षा रसायनों के छिड़काव के लिए सुबह 6:30 से 9:30 बजे का समय चुनें।",
                    "mitigation_steps": [
                        "समान छिड़काव के लिए नोजल की जांच करें।",
                        "दवा को पत्तियों पर चिपकाने के लिए स्टिकर / स्प्रेडर (0.5 मिली/लीटर) मिलाएं।",
                        "पत्तियों से ओस सूखने के बाद ही छिड़काव शुरू करें।"
                    ]
                }

        return {}

    def localize_climate_risk(self, risk_level: str, hazard: str, crop: str, lang: str = "en") -> Dict[str, str]:
        trans_crop = self.translate_crop_name(crop, lang)
        if lang == "te":
            if "rain" in hazard.lower():
                return {
                    "hazard": "భారీ వర్షపు ముప్పు",
                    "impact": f"భారీ వర్షాల వల్ల {trans_crop} పొలంలో నీరు నిల్వ ఉండి వేరుకుళ్లు తెగులు వచ్చే అవకాశం ఉంది.",
                    "action": "పొలంలో మురుగునీటి కాల్వలను తక్షణమే శుభ్రం చేసి నీరు బయటకు పోయేలా చూడండి."
                }
            elif "pest" in hazard.lower() or "disease" in hazard.lower():
                return {
                    "hazard": "చీడపీడల & తెగుళ్ల ముప్పు",
                    "impact": f"తేమతో కూడిన వాతావరణం వల్ల {trans_crop} లో అగ్గి తెగులు మరియు ఆకుచుట్టు పురుగు వ్యాపించే ప్రమాదం ఉంది.",
                    "action": "వేప నూనె లేదా సిఫార్సు చేసిన శిలీంధ్రనాశనిని ముందుజాగ్రత్తగా పిచికారీ చేయండి."
                }
            elif "heat" in hazard.lower():
                return {
                    "hazard": "ఎండ తీవ్రత / వడగాలుల ముప్పు",
                    "impact": f"అధిక ఉష్ణోగ్రత వల్ల {trans_crop} పూత రాలడం లేదా తేమ కొరత రావచ్చు.",
                    "action": "ఉదయం లేదా సాయంత్రం వేళల్లో తేలికపాటి నీటి తడులు ఇవ్వండి."
                }
            return {
                "hazard": "వాతావరణం అనుకూలం",
                "impact": f"{trans_crop} పంట ఎదుగుదలకు వాతావరణ పరిస్థితులు చక్కగా ఉన్నాయి.",
                "action": "సాధారణ పంట సంరక్షణ మరియు ఎరువుల యాజమాన్యాన్ని కొనసాగించండి."
            }
        elif lang == "hi":
            if "rain" in hazard.lower():
                return {
                    "hazard": "भारी बारिश का खतरा",
                    "impact": f"खेत में जलभराव से {trans_crop} की जड़ों में सड़न का खतरा हो सकता है।",
                    "action": "खेत से अतिरिक्त पानी निकालने के लिए नालियों को साफ करें।"
                }
            elif "pest" in hazard.lower() or "disease" in hazard.lower():
                return {
                    "hazard": "कीट एवं रोग प्रकोप का खतरा",
                    "impact": f"आर्द्र मौसम के कारण {trans_crop} में झुलसा व कीट प्रकोप बढ़ सकता है।",
                    "action": "नीम तेल या अनुशंसित फफूंदनाशक का एहतियाती छिड़काव करें।"
                }
            return {
                "hazard": "मौसम अनुकूल",
                "impact": f"{trans_crop} की वृद्धि के लिए अनुकूल मौसम है।",
                "action": "सामान्य कृषि क्रियाएं जारी रखें।"
            }
        return {
            "hazard": hazard,
            "impact": f"Climate condition impact on {crop}.",
            "action": "Follow recommended mitigation practices."
        }

localization_service = LocalizationService()
