import asyncio

from app.adapters.db.checkpointer import checkpointer
from app.services.interview_graph import build_interview_graph


async def main():
    thread_id = input("thread_id: ").strip()

    saver = await checkpointer.init()
    try:
        graph = build_interview_graph(saver)
        config = {"configurable": {"thread_id": thread_id}}
        state = (await graph.aget_state(config)).values

        if not state:
            print("Is thread_id ka koi state nahi mila")
            return

        print(f"status: {state['status']}")
        print(f"questions asked: {state['question_count']}/{state['max_questions']}")
        print(f"turns saved: {len(state['turns'])}")
        for i, turn in enumerate(state["turns"], start=1):
            print(f"  {i}. [{turn.question.topic}] {turn.question.question[:80]}")

        if state["current_question"]:
            print(f"pending question: {state['current_question'].question}")
    finally:
        await checkpointer.close()


if __name__ == "__main__":
    asyncio.run(main())