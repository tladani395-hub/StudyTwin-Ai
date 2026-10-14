import re
from typing import Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import SafetyLog


class SafetyModerator:
    """
    Multi-tier safety, content moderation, and prompt injection defense for Aanvi.
    """

    SELF_HARM_KEYWORDS = [
        "suicide", "kill myself", "end my life", "self-harm", "cutting myself",
        "want to die", "hurt myself", "hopeless"
    ]

    VIOLENCE_KEYWORDS = [
        "build a bomb", "make a weapon", "make poison", "how to assault", "terrorist",
        "how to shoot", "homemade explosive"
    ]

    ADULT_KEYWORDS = [
        "porn", "nsfw", "xxx", "explicit sex", "erotic story", "nudity"
    ]

    CHEATING_KEYWORDS = [
        "solve this live proctored exam", "bypass lockdown browser", "cheat on ongoing test",
        "give me answers to current live test"
    ]

    INJECTION_PATTERNS = [
        r"ignore (all )?previous instructions",
        r"disregard (all )?prior rules",
        r"you are now DAN",
        r"jailbreak",
        r"output (your|the) system prompt",
        r"reveal developer message",
        r"<\|im_start\|>",
        r"system instructions:"
    ]

    @classmethod
    def evaluate_safety(
        cls,
        text: str,
        mode: str = "scholar",
        db: Optional[Session] = None,
        user_id: Optional[int] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Evaluates safety on text.
        Returns: (is_safe: bool, flag_category: Optional[str], response_message: Optional[str])
        """
        clean_text = text.lower().strip()

        # 1. Self-Harm & Crisis Check (Highest Priority Care Response)
        for kw in cls.SELF_HARM_KEYWORDS:
            if kw in clean_text:
                cls._log_event(db, user_id, mode, "self_harm", "crisis_helpline_redirect")
                care_msg = (
                    "It sounds like you're going through a really difficult time, and your well-being matters immensely. "
                    "Please know that you don't have to carry this alone. Reach out to someone you trust, like a parent, "
                    "teacher, or counselor, or connect with trained support right now:\n\n"
                    "• **National Crisis Lifeline:** Call or Text **988** (Available 24/7, Free & Confidential)\n"
                    "• **Tele-MANAS (India):** Call **14416** or **1800-891-4416**\n"
                    "• **Crisis Text Line:** Text `HOME` to **741741**\n\n"
                    "Please take care of yourself today."
                )
                return False, "self_harm", care_msg

        # 2. Violence & Illegal Harm
        for kw in cls.VIOLENCE_KEYWORDS:
            if kw in clean_text:
                cls._log_event(db, user_id, mode, "violence", "refused")
                return False, "violence", "I cannot assist with requests involving violence, weapons, or physical harm. Let's focus on educational course concepts instead."

        # 3. Adult Content (Stricter threshold in Explorer Mode)
        for kw in cls.ADULT_KEYWORDS:
            if kw in clean_text:
                cls._log_event(db, user_id, mode, "adult", "refused")
                if mode == "explorer":
                    return False, "adult", "Oops! Aanvi is for school and study topics only. Let's pick a fun math, science, or coding concept to explore! ✨"
                return False, "adult", "I cannot generate or discuss adult or sexually explicit content. Please ask a course-related educational question."

        # 4. Live Exam Cheating
        for kw in cls.CHEATING_KEYWORDS:
            if kw in clean_text:
                cls._log_event(db, user_id, mode, "cheating", "refused")
                return False, "cheating", "I cannot provide direct answers for live examinations or bypass proctoring tools. I can, however, teach you the underlying concepts and practice problems."

        # 5. Prompt Injection Defense
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, clean_text):
                cls._log_event(db, user_id, mode, "prompt_injection", "sanitized_refused")
                return False, "prompt_injection", "Prompt override or system instruction extraction detected. System guardrails remain active. How can I help you study your course material?"

        return True, None, None

    @classmethod
    def check_input(
        cls,
        text: str,
        mode: str = "scholar",
        db: Optional[Session] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Convenience method returning a dictionary of safety check results."""
        is_safe, flag_category, response_message = cls.evaluate_safety(text, mode=mode, db=db, user_id=user_id)
        return {
            "is_safe": is_safe,
            "category": flag_category,
            "refusal_message": response_message,
            "action": flag_category
        }

    @classmethod
    def check_output(
        cls,
        text: str,
        mode: str = "scholar",
        db: Optional[Session] = None,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Validates AI generated output before sending to student."""
        return cls.check_input(text, mode=mode, db=db, user_id=user_id)

    @classmethod
    def _log_event(
        cls,
        db: Optional[Session],
        user_id: Optional[int],
        mode: str,
        flag_type: str,
        action_taken: str
    ):
        if db:
            try:
                log = SafetyLog(
                    user_id=user_id,
                    mode=mode,
                    flag_type=flag_type,
                    action_taken=action_taken
                )
                db.add(log)
                db.commit()
            except Exception as e:
                print(f"Safety logging notice: {e}")
