import asyncio
from pathlib import Path
from uuid import uuid4

from langgraph.types import Command

from app.services.profile_service import profile_service
from app.services.report_service import report_service
from app.adapters.db.checkpointer import checkpointer
from app.services.interview_graph import build_initial_state, build_interview_graph

def ask_path(message: str) -> Path:
    return Path(input(message).strip().strip('"'))


async def run(interview_graph):
    resume_path = ask_path("Resume file path (pdf/docx/txt): ")
    jd_path = ask_path("Job description .txt file path: ")
    max_questions = int(input("Max questions (default 6): ").strip() or 6)

    # Step 1: resume, JD aur gap analysis
    print("\n[1/4] Parsing resume...")
    resume = await profile_service.parse_resume(resume_path.read_bytes(), resume_path.name)
    print(f"Resume ok: {len(resume.skills)} skills, {len(resume.projects)} projects")

    print("\n[2/4] Parsing job description...")
    jd = await profile_service.parse_jd(jd_path.read_text(encoding="utf-8"))
    print(f"JD ok: {jd.job_title}")
    # interviewer.jinja2 jd.company use karta hai, isliye yahan check kar rahe hain
    print(f"JD company field: {getattr(jd, 'company', 'MISSING')}")

    print("\n[3/4] Analyzing gap...")
    gap = await profile_service.analyze_gap(resume, jd)
    print(f"Match score: {gap.match_score}, focus areas: {[f.topic for f in gap.focus_areas]}")

    # Step 2: interview
    print("\n[4/4] Starting interview...\n")
    config = {"configurable": {"thread_id": str(uuid4())}}
    print(f"thread_id: {config['configurable']['thread_id']}")

    await interview_graph.ainvoke(
        build_initial_state(resume, jd, gap, max_questions), config
    )

    printed_turns = 0
    while True:
        state = (await interview_graph.aget_state(config)).values

        # Pichle answer ki evaluation dikhao (testing ke liye)
        turns = state["turns"]
        if len(turns) > printed_turns:
            ev = turns[-1].evaluation
            print(
                f"\n  [evaluation] accuracy {ev.technical_accuracy}, depth {ev.depth}, "
                f"communication {ev.communication}, follow up: {ev.should_follow_up}"
            )
            print(f"  [feedback] {ev.feedback}\n")
            printed_turns = len(turns)

        if state["status"] == "completed":
            break

        question = state["current_question"]
        print(f"Question {state['question_count']}/{state['max_questions']} "
              f"({question.question_type}, {question.topic}, {question.difficulty})")
        print(f"Interviewer: {question.question}")
        answer = input("Your answer: ")

        await interview_graph.ainvoke(Command(resume=answer), config)

    # Step 3: report
    print("\nInterview complete. Generating report...\n")
    report = await report_service.generate_report(
        resume=state["resume"],
        jd=state["jd"],
        gap=state["gap"],
        turns=state["turns"],
    )
    print(report.model_dump_json(indent=2))

async def main():
    saver = await checkpointer.init()
    try:
        await run(build_interview_graph(saver))
    finally:
        await checkpointer.close()

if __name__ == "__main__":
    asyncio.run(main())