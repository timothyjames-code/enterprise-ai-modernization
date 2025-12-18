# Technology Decisions

**Frontend: Angular + TypeScript**  
Chosen for its strong structure, long-term maintainability, and suitability for large enterprise applications with multiple contributors.

**Backend: Java + Spring Boot**  
Provides robustness, strong typing, and mature ecosystem support for enterprise-scale services, batch processing, and security.

**Database: PostgreSQL (Oracle-compatible patterns)**  
Used for development convenience while adhering to Oracle-compatible SQL patterns, indexing strategies, and performance considerations.

**AI Integration: API-based LLM Service**  
AI capabilities are accessed through an isolated service to minimize risk, enforce guardrails, and allow provider flexibility (e.g., AWS Bedrock, OpenAI).

**CI/CD: GitHub Actions**  
Enables automated builds, testing, and quality checks, reinforcing consistent and reliable delivery practices.
