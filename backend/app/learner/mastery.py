import math
from typing import Tuple, Dict, Any


class BayesianKnowledgeTracer:
    """
    Standard Bayesian Knowledge Tracing (BKT) engine for student mastery tracking.
    Parameters:
    - P(L0): Prior probability of mastery (default: 0.50)
    - P(T): Probability of transition from unmastered to mastered state (0.15)
    - P(G): Probability of guessing correctly when not mastered (difficulty-dependent)
    - P(S): Probability of slipping (answering incorrectly) when mastered (difficulty-dependent)
    """

    DEFAULT_TRANSIT = 0.12

    # Difficulty parameter configurations
    DIFFICULTY_PARAMS = {
        "easy": {"guess": 0.30, "slip": 0.08, "transit": 0.10},
        "medium": {"guess": 0.20, "slip": 0.12, "transit": 0.12},
        "hard": {"guess": 0.10, "slip": 0.18, "transit": 0.15},
        "adaptive": {"guess": 0.20, "slip": 0.12, "transit": 0.12},
    }

    @classmethod
    def update_mastery(
        cls,
        prior_mastery: float,
        is_correct: bool,
        difficulty: str = "medium"
    ) -> Tuple[float, float]:
        """
        Calculates posterior mastery score after observing a response.
        Returns: (new_mastery, delta)
        """
        params = cls.DIFFICULTY_PARAMS.get(difficulty.lower(), cls.DIFFICULTY_PARAMS["medium"])
        p_l = max(0.01, min(0.99, prior_mastery))
        p_g = params["guess"]
        p_s = params["slip"]
        p_t = params["transit"]

        if is_correct:
            # P(Correct | L) = 1 - S, P(Correct | ~L) = G
            p_obs_given_l = 1.0 - p_s
            p_obs_given_not_l = p_g
        else:
            # P(Incorrect | L) = S, P(Incorrect | ~L) = 1 - G
            p_obs_given_l = p_s
            p_obs_given_not_l = 1.0 - p_g

        # Marginal probability of observation
        p_obs = (p_l * p_obs_given_l) + ((1.0 - p_l) * p_obs_given_not_l)
        if p_obs <= 0:
            p_obs = 1e-6

        # Posterior probability after evidence
        p_l_given_obs = (p_l * p_obs_given_l) / p_obs

        # Include transition / learning step
        new_mastery = p_l_given_obs + ((1.0 - p_l_given_obs) * p_t)
        new_mastery = round(float(max(0.05, min(0.98, new_mastery))), 3)

        delta = round(new_mastery - prior_mastery, 3)
        return new_mastery, delta


def get_mastery_status(score: float) -> str:
    if score >= 0.80:
        return "mastered"
    elif score >= 0.50:
        return "learning"
    else:
        return "weak"
