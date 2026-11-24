from langchain_core.messages import HumanMessage, ToolMessage
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.adapters.llm.azure_openai import llm
from app.adapters.logger.logger import logger
from app.prompts.loader import get_prompt_template
from app.schemas.job_description import JDProfile
from app.schemas.resume import ResumeProfile
from app.tools.github_tools import github_tools

MAX_TOOL_CALLS = 8

RECURSION_LIMIT = MAX_TOOL_CALLS * 2 + 3

FINISH_MESSAGE = (
    "You have used all the tool calls you are allowed. Do not ask for more tools. "
    "Write the interview preparation notes now, in the format given at the start, "
    "using only what you have already seen. If you saw nothing usable, reply with exactly: NO_REPO_FOUND"
)

llm_with_tools = llm.bind_tools(github_tools)

# ---------- Nodes ----------

async def agent(state: MessagesState) -> dict:
    messages = state["messages"]
    tool_calls_used = sum(1 for message in messages if isinstance(message, ToolMessage))

    if tool_calls_used >= MAX_TOOL_CALLS:
        logger.info(f"Tool limit reached ({tool_calls_used} calls), asking agent to write the notes")
        response = await llm.ainvoke(messages + [HumanMessage(content=FINISH_MESSAGE)])
    else:
        response = await llm_with_tools.ainvoke(messages)
        for call in response.tool_calls:
            logger.info(f"Research agent calls tool: {call['name']} {call['args']}")

    return {"messages": [response]}

# ---------- Graph ----------

builder = StateGraph(MessagesState)

builder.add_node("agent", agent)
builder.add_node("tools", ToolNode(github_tools))

builder.add_edge(START, "agent")
# If LLM asks for tools, then go to tools, else END
builder.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
builder.add_edge("tools", "agent")

# Doesn't need checkpointer
research_graph = builder.compile()

# ---------- Entry point ----------

async def run_repo_research(resume: ResumeProfile, jd: JDProfile) -> str | None:
    has_repo_link = any(project.repo_url for project in resume.projects)

    if not resume.github_url and not has_repo_link:
        logger.info("Repo research skipped, no GitHub link in the resume")
        return None

    logger.info("Repo research started")

    prompt = get_prompt_template("repo_research.jinja2").render(
        jd=jd,
        github_url=resume.github_url,
        projects=resume.projects,
        max_tool_calls=MAX_TOOL_CALLS,
    )

    try:
        result = await research_graph.ainvoke(
            {"messages": [HumanMessage(content=prompt)]},
            config={"recursion_limit": RECURSION_LIMIT},
        )
    except Exception as e:
        # Research is an extra tool, if fail, the interview must go on
        logger.error(f"Repo research failed: {e}")
        return None

    notes = result["messages"][-1].content
    if not isinstance(notes, str) or not notes.strip() or "NO_REPO_FOUND" in notes:
        logger.info("Repo research found nothing usable")
        return None

    logger.info(f"Repo research done, notes length: {len(notes)} characters")
    return notes.strip()