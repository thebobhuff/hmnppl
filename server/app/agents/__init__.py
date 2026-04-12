"""Agent layer for the AI HR Platform.

Agents are specialized AI workflows that handle specific HR tasks:
- Risk classification (high-risk incident detection)
- Escalation routing (verbal → written → PIP → HR review)
- Disciplinary interview (automated initial interview & documentation)
- Manager coaching (empathy, training tracking, language guidance)
- Language checking (legal review, hot spot flagging)

All agents inherit from BaseAgent and use the shared AI router.
"""
