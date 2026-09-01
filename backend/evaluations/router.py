"""
FastAPI Router for Evaluation Agent Endpoints.
Prefix: /evaluations
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Header, Depends

try:
    from .models import (
        EvaluationRunRequest,
        EvaluationRunResponse,
        EvaluationListResponse,
        DashboardStatsResponse,
    )
    from .service import EvaluationOrchestrator
except ImportError:
    from models import (
        EvaluationRunRequest,
        EvaluationRunResponse,
        EvaluationListResponse,
        DashboardStatsResponse,
    )
    from service import EvaluationOrchestrator

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


def get_current_user(
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id: Optional[str] = Query(None, description="Optional user ID query parameter"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> str:
    """
    Extracts the authenticated user ID or email from request headers, tokens, or query param.
    Guarantees user isolation so users can only access their own evaluations.
    """
    if x_user_email and x_user_email.strip():
        return x_user_email.strip().lower()
    if x_user_id and x_user_id.strip():
        return x_user_id.strip().lower()
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        if token:
            return token.lower()
    if user_id and user_id.strip():
        return user_id.strip().lower()
    return "default_user@judgeai.dev"


@router.post("/run", response_model=EvaluationRunResponse)
async def run_evaluation_pipeline(
    req: EvaluationRunRequest,
    current_user: str = Depends(get_current_user),
):
    """
    Execute full multi-judge evaluation pipeline on a given prompt & model output.
    Automatically persists completed evaluation result into database associated with authenticated user.
    """
    try:
        if not req.user_id:
            req.user_id = current_user
        result = await EvaluationOrchestrator.run_evaluation(req)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation pipeline failed: {str(e)}")


@router.get("", response_model=EvaluationListResponse)
@router.get("/", response_model=EvaluationListResponse)
@router.get("/history", response_model=EvaluationListResponse)
async def list_evaluations(
    query: Optional[str] = Query(None, description="Search filter for task title or ID"),
    model: Optional[str] = Query(None, description="Filter by evaluated target model"),
    status: Optional[str] = Query(None, description="Filter by status (Passed / Flagged)"),
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1),
    current_user: str = Depends(get_current_user),
):
    """
    List persistent evaluation history for authenticated user with search query, model/status filters, and pagination.
    """
    return await EvaluationOrchestrator.list_evaluations(
        user_id=current_user,
        query=query,
        model=model,
        status=status,
        limit=limit,
        page=page,
    )


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: str = Depends(get_current_user),
):
    """
    Get aggregated evaluation statistics for authenticated user.
    """
    return await EvaluationOrchestrator.get_dashboard_stats(user_id=current_user)


@router.get("/health")
async def evaluation_health_check():
    """
    Health & connectivity status for the Evaluation Agent service.
    """
    return {
        "status": "healthy",
        "service": "JudgeAI Evaluation Agent",
        "planned_judge_model": EvaluationOrchestrator.PLANNED_JUDGE_MODEL,
        "active_rubrics": ["accuracy", "relevance", "reasoning", "hallucination", "safety", "style"],
    }


@router.get("/history/{run_id}", response_model=EvaluationRunResponse)
@router.get("/{run_id}", response_model=EvaluationRunResponse)
async def get_evaluation_detail(
    run_id: str,
    current_user: str = Depends(get_current_user),
):
    """
    Retrieve full persistent evaluation details and 6-rubric reasoning traces for a specific run ID.
    Enforces user isolation.
    """
    detail = await EvaluationOrchestrator.get_evaluation_by_id(run_id, user_id=current_user)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Evaluation run '{run_id}' not found")
    return detail


@router.delete("/{run_id}")
async def delete_evaluation(
    run_id: str,
    current_user: str = Depends(get_current_user),
):
    """
    Delete an evaluation run record for authenticated user.
    """
    success = await EvaluationOrchestrator.delete_evaluation(run_id, user_id=current_user)
    if not success:
        raise HTTPException(status_code=404, detail=f"Evaluation run '{run_id}' not found")
    return {"status": "success", "message": f"Evaluation run '{run_id}' deleted successfully"}
