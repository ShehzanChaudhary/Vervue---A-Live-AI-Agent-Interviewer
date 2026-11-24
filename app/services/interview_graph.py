from typing import Literal

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from app.adapters.logger.logger import logger
from app.schemas.gap_analysis import GapAnalysis
from app.schemas.interview import InterviewState, Turn
from app.schemas.job_description import JDProfile
from app.schemas.resume import ResumeProfile
from app.services.interviewer_service import MAX_FOLLOW_UPS, interviewer_service
from app.services.repo_research import run_repo_research

def build_initial_state(
    resume: ResumeProfile,
    jd: JDProfile,
    gap: GapAnalysis,
    max_questions: int,
) -> InterviewState:
    return {
        "resume": resume,
        "jd": jd,
        "gap": gap,
        "max_questions": max_questions,
        "repo_notes": None,
        "turns": [],
        "current_question": None,
        "current_answer": None,
        "question_count": 0,
        "follow_up_count": 0,
        "focus_index": 0,
        "status": "in_progress",
    }

# ---------- Nodes ----------

async def research(state: InterviewState) -> dict:
    logger.info("Node: research")

    notes = await run_repo_research(state["resume"], state["jd"])
    return {"repo_notes": notes}

async def ask_intro(state: InterviewState) -> dict:
    logger.info("Node: ask_intro")

    question = await interviewer_service.generate_question(
        resume=state["resume"],
        jd=state["jd"],
        gap=state["gap"],
        turns=state["turns"],
        question_number=state["question_count"] + 1,
        max_questions=state["max_questions"],
        mode="intro",
    )
    return {"current_question": question, "question_count": state["question_count"] + 1}

async def ask_topic(state: InterviewState) -> dict:
    logger.info("Node: ask_topic")

    focus = state["gap"].focus_areas[state["focus_index"]]

    question = await interviewer_service.generate_question(
        resume=state["resume"],
        jd=state["jd"],
        gap=state["gap"],
        turns=state["turns"],
        question_number=state["question_count"] + 1,
        max_questions=state["max_questions"],
        mode="topic",
        focus=focus,
        repo_notes=state.get("repo_notes"),
    )
    return {
        "current_question": question,
        "question_count": state["question_count"] + 1,
        "follow_up_count": 0,
        "focus_index": state["focus_index"] + 1,
    }

async def ask_follow_up(state: InterviewState) -> dict:
    logger.info("Node: ask_follow_up")

    last_evaluation = state["turns"][-1].evaluation
    parent_topic = state["current_question"].topic

    question = await interviewer_service.generate_question(
        resume=state["resume"],
        jd=state["jd"],
        gap=state["gap"],
        turns=state["turns"],
        question_number=state["question_count"] + 1,
        max_questions=state["max_questions"],
        mode="follow_up",
        follow_up_focus=last_evaluation.follow_up_focus,
        repo_notes=state.get("repo_notes"),
    )

    if question.topic != parent_topic:
        logger.info(f"Follow-up topic '{question.topic}' replaced with parent topic '{parent_topic}'")
        question = question.model_copy(update={"topic": parent_topic})

    return {
        "current_question": question,
        "question_count": state["question_count"] + 1,
        "follow_up_count": state["follow_up_count"] + 1,
    }

async def ask_coding(state: InterviewState) -> dict:
    logger.info("Node: ask_coding")

    focus = state["gap"].focus_areas[state["focus_index"]]

    question = await interviewer_service.generate_question(
        resume=state["resume"],
        jd=state["jd"],
        gap=state["gap"],
        turns=state["turns"],
        question_number=state["question_count"] + 1,
        max_questions=state["max_questions"],
        mode="coding",
        focus=focus,
        repo_notes=state.get("repo_notes"),
    )

    if question.question_type != "coding" or not question.problem_statement:
        logger.warning("Coding question came back incomplete, fixing it")

    question = question.model_copy(
        update={
            "question_type": "coding",
            "problem_statement": question.problem_statement or question.question,
        }
    )

    return {
        "current_question": question,
        "question_count": state["question_count"] + 1,
        "follow_up_count": 0,
        "focus_index": state["focus_index"] + 1,
    }

async def wait_for_answer(state: InterviewState) -> dict:
    # Graph stops here, and when caller sends command(resume=answer)
    # interrupt() returns that answer
    answer = interrupt({"question": state["current_question"].question})
    logger.info("Node: wait_for_answer, answer received")
    return {"current_answer": answer}

async def evaluate(state: InterviewState) -> dict:
    logger.info("Node: evaluate")

    question = state["current_question"]
    answer = state["current_answer"]

    evaluation = await interviewer_service.evaluate_answer(
        resume=state["resume"],
        jd=state["jd"],
        question=question,
        answer=answer,
        follow_up_count=state["follow_up_count"],
    )

    turn = Turn(question=question, answer=answer, evaluation=evaluation)
    return {"turns": [turn]}

async def complete(state: InterviewState) -> dict:
    logger.info(f"Node: complete, {len(state['turns'])} turns done")
    return {"status": "completed", "current_question": None}

def should_ask_coding(state: InterviewState) -> bool:
    already_asked = any(t.question.question_type == "coding" for t in state["turns"])
    if already_asked:
        return False

    if state["focus_index"] >= len(state["gap"].focus_areas):
        return False

    coding_after = max(2, state["max_questions"] // 2)
    return state["question_count"] >= coding_after

# ---------- Routing ----------

def route_after_evaluation(state: InterviewState) -> Literal["follow_up", "coding", "topic", "complete"]:
    last_turn = state["turns"][-1]
    evaluation = last_turn.evaluation

    if state["question_count"] >= state["max_questions"]:
        logger.info("Route: complete (question limit reached)")
        return "complete"

    if (
        evaluation.should_follow_up
        and evaluation.follow_up_focus
        and last_turn.question.question_type not in ("intro", "coding")
        and state["follow_up_count"] < MAX_FOLLOW_UPS
    ):
        logger.info("Route: follow_up")
        return "follow_up"

    if should_ask_coding(state):
        logger.info("Route: coding")
        return "coding"

    if state["focus_index"] < len(state["gap"].focus_areas):
        logger.info("Route: topic")
        return "topic"

    logger.info("Route: complete (no focus areas left)")
    return "complete"

# ---------- Graph ----------

builder = StateGraph(InterviewState)

builder.add_node("research", research)
builder.add_node("ask_intro", ask_intro)
builder.add_node("ask_topic", ask_topic)
builder.add_node("ask_follow_up", ask_follow_up)
builder.add_node("wait_for_answer", wait_for_answer)
builder.add_node("evaluate", evaluate)
builder.add_node("complete", complete)
builder.add_node("ask_coding", ask_coding)

builder.add_edge(START, "research")
builder.add_edge("research", "ask_intro")
builder.add_edge("ask_intro", "wait_for_answer")
builder.add_edge("ask_topic", "wait_for_answer")
builder.add_edge("ask_follow_up", "wait_for_answer")
builder.add_edge("wait_for_answer", "evaluate")
builder.add_edge("ask_coding", "wait_for_answer")
builder.add_conditional_edges(
    "evaluate",
    route_after_evaluation,
        {"follow_up": "ask_follow_up", "coding": "ask_coding", "topic": "ask_topic", "complete": "complete"},
)
builder.add_edge("complete", END)

def build_interview_graph(checkpointer: BaseCheckpointSaver):
    return builder.compile(checkpointer=checkpointer)