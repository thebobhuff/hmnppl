"""Business logic and external service integration layer.

Services in this package encapsulate calls to AI providers (Hugging Face,
OpenRouter), database queries (Supabase), and any other side-effecting
operations.  Routers should remain thin — delegating to services here.
"""
