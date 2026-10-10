from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Farm, User, AIConversation
from ..schemas import AIAskRequest, AIAskResponse
from ..services.gemini_ai import gemini_ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Services"])

@router.post("/ask", response_model=AIAskResponse)
async def ask_agri_ai(req: AIAskRequest, db: Session = Depends(get_db)):
    farm_context = None
    user = db.query(User).first()

    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
        if farm:
            farm_context = {
                "farm_name": farm.farm_name,
                "village": farm.village,
                "district": farm.district,
                "state": farm.state,
                "acreage": farm.acreage,
                "soil_ph": farm.soil_ph,
                "soil_type": farm.soil_type,
                "water_availability": farm.water_availability,
                "current_crops": farm.current_crops
            }

    result = await gemini_ai_service.generate_agricultural_answer(
        question=req.question or "Analyze this crop image for pests or diseases",
        farm_context=farm_context,
        language=req.language or "en",
        image_base64=req.image_base64,
        mime_type=req.mime_type or "image/jpeg",
        crop_name=req.crop_name,
        is_disease_scan=req.is_disease_scan or bool(req.image_base64)
    )

    # Store in AI conversation history if user exists
    if user:
        conv = AIConversation(
            user_id=user.id,
            farm_id=req.farm_id,
            question=req.question or "Crop Disease Scan",
            answer=result["answer"],
            language=req.language or "en"
        )
        db.add(conv)
        db.commit()

    return result

@router.post("/detect-disease", response_model=AIAskResponse)
async def detect_crop_disease(req: AIAskRequest, db: Session = Depends(get_db)):
    req.is_disease_scan = True
    return await ask_agri_ai(req, db)
