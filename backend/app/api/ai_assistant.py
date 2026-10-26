from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from ml_service.rag.assistant import ai_assistant
from ml_service.rag.vector_store import vector_store

router = APIRouter(prefix="/ai", tags=["AI HR Assistant & RAG"])

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User query or question")

@router.post("/chat")
def chat_with_hr_assistant(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieval-Augmented Generation (RAG) assistant for enterprise HR policies,
    attendance/leave rules, and secure personal record inquiries.
    """
    response = ai_assistant.ask(
        query=request.message,
        user=current_user,
        db=db
    )
    return response

@router.get("/knowledge-base")
def get_knowledge_base_status():
    """Lists indexed approved corporate policy documents and chunk count."""
    doc_titles = list(set(c["doc_title"] for c in vector_store.chunks))
    return {
        "status": "ready" if vector_store.is_indexed else "not_indexed",
        "total_chunks": len(vector_store.chunks),
        "indexed_documents": [
            {
                "title": doc_title,
                "sections": [c["section_title"] for c in vector_store.chunks if c["doc_title"] == doc_title]
            }
            for doc_title in doc_titles
        ],
        "engine_mode": ai_assistant.mode_label
    }

@router.get("/suggested-prompts")
def get_suggested_prompts():
    """Curated quick prompts categorized by domain."""
    return [
        {
            "category": "Personal Records (Self-Service)",
            "prompts": [
                "What is my current leave balance?",
                "How much was my net pay in my latest payslip?",
                "Did I check in for attendance today?"
            ]
        },
        {
            "category": "Time Off & Leave Rules",
            "prompts": [
                "How many earned leave days can I carry forward to next year?",
                "What is the medical certificate requirement for sick leave?",
                "How does Loss of Pay (LOP) impact monthly salary?"
            ]
        },
        {
            "category": "Workforce Attendance & Shifts",
            "prompts": [
                "What is the shift grace period before check-in is marked late?",
                "How do I submit an attendance correction for a missed punch?",
                "What are the pre-authorization rules for overtime?"
            ]
        },
        {
            "category": "Ethics, Conduct & Benefits",
            "prompts": [
                "What is the maximum allowed gift value from vendors?",
                "What is the annual Learning & Development reimbursement limit?",
                "How are expense reimbursement claims approved?"
            ]
        }
    ]
