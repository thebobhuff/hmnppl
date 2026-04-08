"""Policy Creation Agent - Interviews user and generates policies."""

from app.agents.base import BaseAgent
from app.agents.schemas import AgentResponse
from app.services.ai_router import AIRouter
from app.core.config import get_settings


SYSTEM_PROMPT = """You are a HR Policy Creation Assistant. Your role is to help HR professionals create well-structured, legally compliant company policies.

Interview the user to gather information about the policy they want to create. Ask clear, conversational questions one at a time.

Guidelines:
- Be professional but conversational
- Ask one question at a time
- Gather all necessary information before generating the policy
- Ensure the policy will be legally compliant
- Ask about: policy type, scope, key rules, consequences, exceptions, effective date

Policy types include:
- Attendance & Punctuality
- Code of Conduct
- Performance Management
- Safety & Security
- Remote Work
- Leave & Time Off
- Anti-Harassment
- Data Privacy
- Social Media
- Dress Code
- Vehicle Usage
- Expense Reimbursement

When you have enough information, generate a complete policy document with:
- Title
- Purpose
- Scope
- Definitions
- Policy Statement
- Procedures
- Consequences
- Exceptions
- Effective Date
- Revision History"""


INTERVIEW_STEPS = [
    {
        "id": "introduction",
        "name": "Introduction",
        "question": "Hi! I'm here to help you create a company policy. What type of policy would you like to create today?",
        "field": None,
    },
    {
        "id": "purpose",
        "name": "Purpose",
        "question": "What's the main purpose of this policy? What problem is it trying to solve or what behavior is it meant to encourage?",
        "field": "purpose",
    },
    {
        "id": "scope",
        "name": "Scope",
        "question": "Who should this policy apply to? All employees, managers only, specific departments, contractors, etc.?",
        "field": "scope",
    },
    {
        "id": "key_rules",
        "name": "Key Rules",
        "question": "What are the main rules or requirements that employees need to follow?",
        "field": "key_rules",
    },
    {
        "id": "consequences",
        "name": "Consequences",
        "question": "What should happen if someone violates this policy? Are there progressive consequences?",
        "field": "consequences",
    },
    {
        "id": "exceptions",
        "name": "Exceptions",
        "question": "Are there any exceptions or special circumstances that should be considered?",
        "field": "exceptions",
    },
    {
        "id": "effective_date",
        "name": "Effective Date",
        "question": "When should this policy become effective?",
        "field": "effective_date",
    },
    {
        "id": "generate",
        "name": "Generate Policy",
        "question": None,
        "field": None,
    },
]


class PolicyCreationAgent(BaseAgent):
    """Agent that interviews user to create company policies."""

    def __init__(self):
        settings = get_settings()
        ai_router = AIRouter(settings)
        super().__init__(
            name="policy_creation",
            system_prompt=SYSTEM_PROMPT,
            ai_router=ai_router,
        )
        self.interview_steps = INTERVIEW_STEPS
        self.current_step = 0
        self.responses = {}

    def get_next_question(self, current_step: int) -> dict:
        """Get the next question in the interview."""
        if current_step >= len(self.interview_steps):
            return {"done": True}
        return self.interview_steps[current_step]

    def process_response(self, step_id: str, response: str) -> AgentResponse:
        """Process user's response and determine next step."""
        self.responses[step_id] = response
        self.current_step += 1

        next_step = self.get_next_question(self.current_step)

        if next_step.get("done"):
            return self.generate_policy()

        return AgentResponse(
            message=f"Thank you for that information. {next_step['question']}",
            current_step=next_step["id"],
            step_name=next_step["name"],
            question=next_step["question"],
            requires_hr_review=True,
            escalation_level="policy_review",
        )

    def generate_policy(self) -> AgentResponse:
        """Generate the final policy document based on collected responses."""

        policy_type = self.responses.get("introduction", "Company Policy")
        purpose = self.responses.get("purpose", "")
        scope = self.responses.get("scope", "All employees")
        key_rules = self.responses.get("key_rules", "")
        consequences = self.responses.get("consequences", "")
        exceptions = self.responses.get("exceptions", "None")
        effective_date = self.responses.get("effective_date", "Upon approval")

        policy_content = f"""# {policy_type.upper()}

## PURPOSE
{purpose}

## SCOPE
{scope}

## POLICY STATEMENT
{key_rules}

## CONSEQUENCES FOR VIOLATIONS
{consequences}

## EXCEPTIONS
{exceptions}

## EFFECTIVE DATE
{effective_date}

## REVISION HISTORY
- Version 1.0: Initial policy creation"""

        return AgentResponse(
            message="I've created the policy based on your responses. Please review it below.",
            current_step="complete",
            step_name="Complete",
            question=None,
            requires_hr_review=True,
            escalation_level="policy_review",
            generated_document=policy_content,
        )

    async def run(self, user_input: str = None, **kwargs) -> AgentResponse:
        """Run the policy creation interview."""
        if kwargs.get("prior_responses"):
            self.responses = kwargs["prior_responses"]

        current_step_info = self.get_next_question(self.current_step)

        if user_input and current_step_info.get("field"):
            return self.process_response(current_step_info["id"], user_input)

        if current_step_info.get("done"):
            return self.generate_policy()

        return AgentResponse(
            message=f"Let me ask you some questions to create this policy. {current_step_info['question']}",
            current_step=current_step_info["id"],
            step_name=current_step_info["name"],
            question=current_step_info["question"],
            requires_hr_review=False,
            escalation_level="verbal",
        )
