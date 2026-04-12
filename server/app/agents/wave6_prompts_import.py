# Append to existing prompts - wave6 imports
# These are imported from the wave6_prompts module to keep the file manageable

from app.agents.wave6_prompts import (  # noqa: F401
    build_issue_similarity_prompt,
    build_training_gap_prompt,
    build_continuous_improvement_prompt,
    build_pushback_prompt,
)
