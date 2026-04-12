"""HR KPI and Churn Analytics Service.

Employee turnover, retention, departmental health, and HR operational KPIs.
"""

from __future__ import annotations
import logging
from typing import Any
from datetime import date, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)


def calculate_turnover_rate(separations: list[dict[str, Any]], total_employees: int, days: int = 365) -> dict[str, Any]:
    if total_employees == 0:
        return {"rate": 0.0, "status": "no_data", "separations": 0, "average_headcount": 0, "period_days": days}
    cutoff = str(date.today() - timedelta(days=days))
    recent = [s for s in separations if s.get("separation_date", "") >= cutoff]
    count = len(recent)
    avg_hc = total_employees + (count / 2)
    rate = (count / avg_hc) * 100 if avg_hc > 0 else 0
    status = "excellent" if rate <= 10 else "good" if rate <= 18 else "concerning" if rate <= 25 else "critical"
    return {
        "rate": round(rate, 1), "status": status, "separations": count,
        "average_headcount": round(avg_hc), "period_days": days,
        "benchmark": "18-20% US average (annual)",
        "voluntary_count": sum(1 for s in recent if s.get("separation_type") in ("voluntary", "resignation", "quit")),
        "involuntary_count": sum(1 for s in recent if s.get("separation_type") in ("involuntary", "termination", "fired", "reduction_in_force")),
    }


def calculate_retention_rate(separations: list[dict[str, Any]], total_employees: int, days: int = 365) -> dict[str, Any]:
    t = calculate_turnover_rate(separations, total_employees, days)
    return {"rate": round(100 - t["rate"], 1), "status": t["status"], "retained": total_employees - t["separations"], "lost": t["separations"], "total": total_employees}


def calculate_new_hire_turnover(separations: list[dict[str, Any]], days: int = 90) -> dict[str, Any]:
    cutoff = str(date.today() - timedelta(days=365))
    recent = [s for s in separations if s.get("separation_date", "") >= cutoff]
    early = []
    for s in recent:
        start, end = s.get("hire_date", ""), s.get("separation_date", "")
        if start and end:
            try:
                tenure = (date.fromisoformat(end[:10]) - date.fromisoformat(start[:10])).days
                if tenure <= days:
                    early.append({**s, "tenure_days": tenure})
            except (ValueError, IndexError):
                pass
    return {
        "early_departures": len(early), "threshold_days": days, "details": early[:10],
        "recommendation": "Review onboarding program" if len(early) >= 3 else "New-hire retention healthy",
    }


def calculate_department_health(incidents: list[dict[str, Any]], separations: list[dict[str, Any]], employees_by_dept: dict[str, int], days: int = 90) -> list[dict[str, Any]]:
    dd: dict[str, dict] = {}
    for dept, hc in employees_by_dept.items():
        dd[dept] = {"department": dept, "headcount": hc, "incidents": 0, "verbal": 0, "written": 0, "pip": 0, "terminations": 0, "separations": 0}
    for inc in incidents:
        d = inc.get("department", "unknown")
        if d not in dd: dd[d] = {"department": d, "headcount": 0, "incidents": 0, "verbal": 0, "written": 0, "pip": 0, "terminations": 0, "separations": 0}
        dd[d]["incidents"] += 1
        a = inc.get("action_type", "")
        if a == "verbal_warning": dd[d]["verbal"] += 1
        elif a == "written_warning": dd[d]["written"] += 1
        elif a == "pip": dd[d]["pip"] += 1
        elif a in ("termination_review", "termination"): dd[d]["terminations"] += 1
    for sep in separations:
        d = sep.get("department", "unknown")
        if d in dd: dd[d]["separations"] += 1
    results = []
    for dept, data in dd.items():
        hc = max(data["headcount"], 1)
        ir = data["incidents"] / hc
        sw = (data["verbal"] * 1 + data["written"] * 3 + data["pip"] * 5 + data["terminations"] * 10) / hc
        tp = (data["separations"] / hc) * 20
        hs = max(0, min(100, round(100 - (ir * 5 + sw * 3 + tp))))
        st = "excellent" if hs >= 85 else "good" if hs >= 70 else "fair" if hs >= 50 else "poor"
        results.append({**data, "health_score": hs, "status": st, "incident_rate": round(ir, 2), "severity_weight": round(sw, 2)})
    results.sort(key=lambda x: x["health_score"])
    return results


def calculate_hr_operational_kpis(incidents: list[dict[str, Any]], disciplinary_actions: list[dict[str, Any]], meetings: list[dict[str, Any]], days: int = 30) -> dict[str, Any]:
    rt = []
    for i in incidents:
        c, r = i.get("created_at", "")[:10], i.get("resolved_at", "")[:10]
        if c and r:
            try: rt.append((date.fromisoformat(r) - date.fromisoformat(c)).days)
            except ValueError: pass
    avg = round(sum(rt) / len(rt), 1) if rt else None
    oc = sum(1 for i in incidents if i.get("status") not in ("resolved", "closed", "approved", "rejected", "signed"))
    ps = sum(1 for a in disciplinary_actions if a.get("status") == "pending_signature")
    cm = sum(1 for m in meetings if m.get("status") == "completed")
    tm = len(meetings) if meetings else 1
    return {
        "avg_resolution_days": avg, "resolution_target": 14,
        "resolution_on_target": avg is not None and avg <= 14,
        "open_cases": oc, "pending_signatures": ps,
        "meeting_completion_rate": round((cm / tm) * 100, 1),
        "cases_per_day": round(oc / max(days, 1), 2), "period_days": days,
    }


def calculate_tenure_distribution(employees: list[dict[str, Any]]) -> dict[str, Any]:
    buckets = {"0-90 days": 0, "91-180 days": 0, "181-365 days": 0, "1-3 years": 0, "3-5 years": 0, "5-10 years": 0, "10+ years": 0}
    today = date.today()
    for e in employees:
        h = e.get("hire_date", "")
        if not h: buckets["0-90 days"] += 1; continue
        try:
            td = (today - date.fromisoformat(str(h)[:10])).days
            if td <= 90: buckets["0-90 days"] += 1
            elif td <= 180: buckets["91-180 days"] += 1
            elif td <= 365: buckets["181-365 days"] += 1
            elif td <= 1095: buckets["1-3 years"] += 1
            elif td <= 1825: buckets["3-5 years"] += 1
            elif td <= 3650: buckets["5-10 years"] += 1
            else: buckets["10+ years"] += 1
        except ValueError: buckets["0-90 days"] += 1
    total = sum(buckets.values())
    u1 = buckets["0-90 days"] + buckets["91-180 days"] + buckets["181-365 days"]
    pct = round((u1 / total) * 100) if total else 0
    hint = f"{pct}% under 1yr - high turnover risk" if pct > 40 else f"{pct}% under 1yr - monitor" if pct > 25 else f"{pct}% under 1yr - stable"
    return {"distribution": buckets, "total": total, "avg_tenure_hint": hint}


def format_kpi_dashboard(turnover, retention, new_hire, dept_health, ops_kpis, tenure) -> dict[str, Any]:
    return {
        "turnover": turnover, "retention": retention, "new_hire_turnover": new_hire,
        "department_health": dept_health, "operational_kpis": ops_kpis,
        "tenure_distribution": tenure,
        "alerts": _gen_alerts(turnover, new_hire, dept_health, ops_kpis),
    }


def _gen_alerts(turnover, new_hire, dept_health, ops_kpis) -> list[dict[str, str]]:
    a = []
    if turnover.get("status") == "critical":
        a.append({"type": "turnover", "severity": "critical", "message": f"Turnover {turnover.get('rate')}% critically high"})
    elif turnover.get("status") == "concerning":
        a.append({"type": "turnover", "severity": "warning", "message": f"Turnover {turnover.get('rate')}% above benchmark"})
    if new_hire.get("early_departures", 0) >= 3:
        a.append({"type": "new_hire", "severity": "warning", "message": f"{new_hire.get('early_departures')} left within 90 days"})
    if ops_kpis.get("resolution_on_target") is False:
        a.append({"type": "resolution", "severity": "warning", "message": f"Avg resolution {ops_kpis.get('avg_resolution_days')}d exceeds 14d target"})
    for d in dept_health[:3]:
        if d.get("health_score", 100) < 50:
            a.append({"type": "department", "severity": "warning", "message": f"Dept '{d.get('department')}' health: {d.get('health_score')}"})
    return a
