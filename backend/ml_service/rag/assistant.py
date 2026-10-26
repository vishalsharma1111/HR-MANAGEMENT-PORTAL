import os
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ml_service.rag.vector_store import vector_store
from app.models import (
    User, Employee, LeaveBalance, LeaveType, Payslip, AttendanceRecord
)

# Prompt injection blocklist patterns
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s+prompt",
    r"reveal\s+(the\s+)?secret",
    r"bypass\s+(security|authorization|rules)",
    r"you\s+are\s+now\s+in\s+dan\s+mode",
    r"drop\s+table",
    r"dump\s+database",
    r"override\s+role"
]

class HRAssistantService:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.external_llm_configured = bool(self.gemini_key or self.openai_key)
        self.mode_label = (
            "External LLM Grounded (Gemini/OpenAI)"
            if self.external_llm_configured
            else "Enterprise Grounded RAG Engine (Local Zero-Shot Semantic Retrieval)"
        )

    def ask(self, query: str, user: User, db: Session) -> Dict[str, Any]:
        """
        Process user query with security checks, private record resolution,
        and grounded RAG response generation.
        """
        clean_query = query.strip()
        if not clean_query:
            return {
                "answer": "Please provide a valid question regarding HR policies, attendance, leaves, or your personal records.",
                "sources": [],
                "engine_mode": self.mode_label,
                "is_grounded": False
            }

        # 1. Security Check: Prompt Injection & Jailbreak Guard
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, clean_query, re.IGNORECASE):
                return {
                    "answer": "Security Alert: Input contained disallowed system override patterns. Queries must adhere to corporate conduct standards.",
                    "sources": ["Corporate Security Policy"],
                    "engine_mode": self.mode_label,
                    "is_grounded": False,
                    "security_flag": "PROMPT_INJECTION_DETECTED"
                }

        # 2. Privacy & Personal Record Resolution
        lower_q = clean_query.lower()

        # Check for cross-employee unauthorized queries
        private_keywords = ["salary", "payslip", "pay", "compensation", "leave balance", "bonus", "earnings"]
        emp_names = ["david", "marcus", "sarah", "elena", "rachel", "jessica", "samuel", "olivia", "miller", "vance", "jenkins", "rostova", "green"]
        user_name_lower = (user.full_name or "").lower()

        is_private_keyword = any(k in lower_q for k in private_keywords)
        mentions_other = any(name in lower_q for name in emp_names if name not in user_name_lower)
        if is_private_keyword and mentions_other:
            return {
                "answer": "Access Denied: You are only authorized to query your own personal HR records. Accessing private compensation, payslip, or attendance data of other employees is strictly prohibited by Enterprise Data Privacy controls.",
                "sources": ["Enterprise Privacy & Security Policy"],
                "engine_mode": self.mode_label,
                "is_grounded": True,
                "security_flag": "CROSS_EMPLOYEE_DATA_BLOCKED"
            }

        # Handle user's OWN personal data queries
        is_my_query = "my" in lower_q or "i " in lower_q or "mine" in lower_q

        if is_my_query and any(w in lower_q for w in ["leave", "pto", "vacation", "balance"]):
            return self._get_user_leave_balance(user, db)

        if is_my_query and any(w in lower_q for w in ["salary", "payslip", "net pay", "gross pay", "paid"]):
            return self._get_user_payslip_info(user, db)

        if is_my_query and any(w in lower_q for w in ["attendance", "check-in", "check in", "clock in", "clocked", "shift today"]):
            return self._get_user_attendance_today(user, db)

        # 3. Corporate Policy Question -> RAG Retrieval
        results = vector_store.search(clean_query, top_k=3, threshold=0.10)

        if not results:
            return {
                "answer": "I could not find an authoritative policy covering this question in the approved Enterprise HR Knowledge Base. Please contact your HR Business Partner or submit an HR Helpdesk ticket for guidance.",
                "sources": [],
                "engine_mode": self.mode_label,
                "is_grounded": False
            }

        # Synthesize Grounded Answer from retrieved passages
        return self._synthesize_grounded_answer(clean_query, results)

    def _get_user_leave_balance(self, user: User, db: Session) -> Dict[str, Any]:
        if not user.employee_profile:
            return {
                "answer": "No active employee profile is linked to your user account. Please contact HR Operations.",
                "sources": ["Core HR Records"],
                "engine_mode": self.mode_label,
                "is_grounded": True
            }

        emp = user.employee_profile
        balances = db.query(LeaveBalance).filter(LeaveBalance.employee_id == emp.id).all()

        if not balances:
            return {
                "answer": f"Hello {emp.first_name}, no active leave balances were found for the current calendar year.",
                "sources": ["Live HR Database"],
                "engine_mode": self.mode_label,
                "is_grounded": True
            }

        lines = [f"Hello {emp.first_name}, here is your current verified leave entitlement:"]
        for b in balances:
            lt = db.query(LeaveType).filter(LeaveType.id == b.leave_type_id).first()
            lt_name = lt.name if lt else "Leave"
            lines.append(f"• **{lt_name}**: {b.remaining:.1f} days remaining ({b.used:.1f} used, {b.pending:.1f} pending approval)")

        lines.append("\nYou can apply for time-off directly in the **Leave Management** module.")
        return {
            "answer": "\n".join(lines),
            "sources": ["Live HR Database (Leave Balances Table)"],
            "engine_mode": self.mode_label,
            "is_grounded": True
        }

    def _get_user_payslip_info(self, user: User, db: Session) -> Dict[str, Any]:
        if not user.employee_profile:
            return {
                "answer": "No employee profile found for your account.",
                "sources": ["Core HR Database"],
                "engine_mode": self.mode_label,
                "is_grounded": True
            }

        emp = user.employee_profile
        latest_payslip = (
            db.query(Payslip)
            .filter(Payslip.employee_id == emp.id)
            .order_by(Payslip.year.desc(), Payslip.month.desc())
            .first()
        )

        if not latest_payslip:
            return {
                "answer": f"Hello {emp.first_name}, you have no processed payslips on record yet.",
                "sources": ["Live HR Database"],
                "engine_mode": self.mode_label,
                "is_grounded": True
            }

        ans = (
            f"Hello {emp.first_name}, here is your most recent processed payslip summary for **Month {latest_payslip.month}/{latest_payslip.year}**:\n"
            f"• **Gross Earnings**: ${latest_payslip.gross_pay:,.2f}\n"
            f"• **Total Deductions**: ${latest_payslip.total_deductions:,.2f} (PF: ${latest_payslip.pf_deduction:,.2f}, PT: ${latest_payslip.prof_tax_deduction:,.2f}, TDS: ${latest_payslip.tds_deduction:,.2f})\n"
            f"• **Net Take-Home Pay**: **${latest_payslip.net_pay:,.2f}**\n"
            f"• **Status**: {latest_payslip.status}\n\n"
            f"You can view and securely download the complete PDF breakdown under the **Payroll & Compensation** self-service page."
        )
        return {
            "answer": ans,
            "sources": ["Live HR Database (Payslips Table)"],
            "engine_mode": self.mode_label,
            "is_grounded": True
        }

    def _get_user_attendance_today(self, user: User, db: Session) -> Dict[str, Any]:
        if not user.employee_profile:
            return {
                "answer": "No employee profile found for your account.",
                "sources": ["Core HR Database"],
                "engine_mode": self.mode_label,
                "is_grounded": True
            }

        emp = user.employee_profile
        from datetime import date
        today_att = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.employee_id == emp.id, AttendanceRecord.date == date.today())
            .first()
        )

        if not today_att or not today_att.check_in:
            return {
                "answer": f"Hello {emp.first_name}, you have not clocked in for today ({date.today().isoformat()}) yet. Please use the Check-In button on the Attendance page.",
                "sources": ["Live HR Database (Attendance Table)"],
                "engine_mode": self.mode_label,
                "is_grounded": True
            }

        ci_str = today_att.check_in.strftime("%H:%M:%S")
        co_str = today_att.check_out.strftime("%H:%M:%S") if today_att.check_out else "Not yet clocked out"
        ans = (
            f"Hello {emp.first_name}, here is your attendance record for today ({date.today().isoformat()}):\n"
            f"• **Status**: {today_att.status}\n"
            f"• **Check-In**: {ci_str} ({'Late' if today_att.is_late else 'On-Time'})\n"
            f"• **Check-Out**: {co_str}\n"
            f"• **Logged Hours**: {today_att.total_hours:.1f} hrs"
        )
        return {
            "answer": ans,
            "sources": ["Live HR Database (Attendance Table)"],
            "engine_mode": self.mode_label,
            "is_grounded": True
        }

    def _synthesize_grounded_answer(self, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract authoritative grounded policy response with source citations."""
        sources = [f"{c['source_file']} (§ {c['section_title']})" for c in chunks]

        # Combine top chunk excerpts
        primary = chunks[0]
        secondary = chunks[1] if len(chunks) > 1 else None

        content_clean = primary["content"].replace("## ", "").strip()

        answer = (
            f"Based on the official enterprise policy in **{primary['doc_title']}**:\n\n"
            f"{content_clean}\n"
        )
        if secondary and secondary["similarity_score"] > 0.18:
            answer += f"\n**Additional Context from {secondary['doc_title']} ({secondary['section_title']})**:\n"
            answer += secondary["content"].replace("## ", "").strip() + "\n"

        answer += f"\n\n*Reference: {', '.join(sources)}*"

        return {
            "answer": answer,
            "sources": sources,
            "top_similarity": primary["similarity_score"],
            "engine_mode": self.mode_label,
            "is_grounded": True
        }

ai_assistant = HRAssistantService()
