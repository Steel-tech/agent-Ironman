"""
Multi-Agent Orchestration Tasks
Coordinate multiple AI agents working together on complex tasks
"""

from celery import Task, group, chain
from typing import List, Dict, Any, Optional
import logging
import json

from python_worker.worker import app
from python_worker.services.llm_client import llm_client

logger = logging.getLogger(__name__)


class AgentRole:
    """Predefined agent roles with specialized prompts"""

    RESEARCHER = """You are a research specialist. Your role is to:
- Gather and analyze information thoroughly
- Identify key facts and patterns
- Provide well-sourced insights
- Be objective and comprehensive"""

    ANALYST = """You are a data analyst. Your role is to:
- Break down complex problems into parts
- Identify relationships and dependencies
- Provide structured analysis
- Draw logical conclusions"""

    PLANNER = """You are a strategic planner. Your role is to:
- Create actionable plans
- Break down goals into steps
- Identify resources needed
- Anticipate obstacles and solutions"""

    CRITIC = """You are a critical reviewer. Your role is to:
- Identify weaknesses and gaps
- Challenge assumptions
- Suggest improvements
- Ensure quality and accuracy"""

    SYNTHESIZER = """You are a synthesis expert. Your role is to:
- Combine multiple perspectives
- Find common themes
- Resolve conflicts
- Create cohesive final outputs"""


@app.task(bind=True, name="agents.single_agent")
def run_single_agent(
    self: Task,
    role: str,
    task_description: str,
    context: Optional[str] = None,
    custom_system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run a single agent with a specific role

    Args:
        role: Agent role (researcher, analyst, planner, critic, synthesizer)
        task_description: What the agent should do
        context: Additional context for the agent
        custom_system_prompt: Override default role prompt

    Returns:
        Dict with agent response
    """
    try:
        # Get role prompt
        role_prompts = {
            "researcher": AgentRole.RESEARCHER,
            "analyst": AgentRole.ANALYST,
            "planner": AgentRole.PLANNER,
            "critic": AgentRole.CRITIC,
            "synthesizer": AgentRole.SYNTHESIZER
        }

        system_prompt = custom_system_prompt or role_prompts.get(
            role.lower(),
            "You are a helpful AI assistant."
        )

        # Build prompt
        prompt = task_description
        if context:
            prompt = f"Context:\n{context}\n\nTask:\n{task_description}"

        logger.info(f"Running {role} agent: {task_description[:100]}")

        # Generate response
        response = llm_client.generate(
            prompt=prompt,
            system=system_prompt,
            temperature=0.7
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "role": role,
            "output": response["text"],
            "usage": response["usage"]
        }

    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "role": role,
            "error": str(e)
        }


@app.task(bind=True, name="agents.multi_agent_sequential")
def run_multi_agent_sequential(
    self: Task,
    agents: List[Dict[str, str]],
    initial_task: str,
    pass_context: bool = True
) -> Dict[str, Any]:
    """
    Run multiple agents in sequence, each building on previous output

    Args:
        agents: List of {role, task_description}
        initial_task: Starting task description
        pass_context: Whether to pass previous outputs as context

    Returns:
        Dict with all agent outputs and final result
    """
    try:
        logger.info(f"Running sequential multi-agent workflow with {len(agents)} agents")

        results = []
        current_context = initial_task

        for i, agent_config in enumerate(agents):
            role = agent_config["role"]
            task = agent_config.get("task_description", "Continue the work")

            logger.info(f"Step {i+1}/{len(agents)}: {role} agent")

            # Run agent
            agent_result = run_single_agent(
                role=role,
                task_description=task,
                context=current_context if pass_context else None
            )

            if agent_result["status"] == "error":
                return {
                    "status": "error",
                    "task_id": self.request.id,
                    "failed_at_step": i + 1,
                    "error": agent_result["error"],
                    "completed_steps": results
                }

            results.append({
                "step": i + 1,
                "role": role,
                "output": agent_result["output"]
            })

            # Update context for next agent
            if pass_context:
                current_context = agent_result["output"]

        return {
            "status": "success",
            "task_id": self.request.id,
            "workflow_type": "sequential",
            "steps": results,
            "final_output": results[-1]["output"] if results else None,
            "total_agents": len(agents)
        }

    except Exception as e:
        logger.error(f"Multi-agent workflow failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="agents.multi_agent_parallel")
def run_multi_agent_parallel(
    self: Task,
    agents: List[Dict[str, str]],
    task: str,
    synthesize: bool = True
) -> Dict[str, Any]:
    """
    Run multiple agents in parallel, then optionally synthesize results

    Args:
        agents: List of {role, custom_instructions (optional)}
        task: Common task for all agents
        synthesize: Whether to synthesize all outputs into final answer

    Returns:
        Dict with all agent outputs and optional synthesis
    """
    try:
        logger.info(f"Running parallel multi-agent workflow with {len(agents)} agents")

        # Run all agents in parallel
        results = []
        for agent_config in agents:
            role = agent_config["role"]
            custom_task = agent_config.get("custom_instructions", task)

            agent_result = run_single_agent(
                role=role,
                task_description=custom_task,
                context=None
            )

            results.append({
                "role": role,
                "output": agent_result["output"],
                "status": agent_result["status"]
            })

        # Check for any failures
        failed = [r for r in results if r["status"] == "error"]
        if failed:
            logger.warning(f"{len(failed)} agents failed")

        # Synthesize if requested
        final_output = None
        if synthesize and results:
            synthesis_context = "\n\n".join([
                f"{r['role'].upper()} PERSPECTIVE:\n{r['output']}"
                for r in results if r["status"] == "success"
            ])

            synthesis = run_single_agent(
                role="synthesizer",
                task_description="Synthesize all the perspectives below into a comprehensive, cohesive response.",
                context=synthesis_context
            )

            final_output = synthesis.get("output")

        return {
            "status": "success",
            "task_id": self.request.id,
            "workflow_type": "parallel",
            "agent_outputs": results,
            "final_synthesis": final_output,
            "total_agents": len(agents),
            "successful_agents": len([r for r in results if r["status"] == "success"])
        }

    except Exception as e:
        logger.error(f"Parallel multi-agent workflow failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="agents.debate")
def run_agent_debate(
    self: Task,
    topic: str,
    rounds: int = 3,
    agents: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Run a debate between multiple agents

    Args:
        topic: Topic to debate
        rounds: Number of debate rounds
        agents: List of agent roles (defaults to researcher vs critic)

    Returns:
        Dict with debate transcript and conclusion
    """
    try:
        if agents is None:
            agents = ["researcher", "critic"]

        logger.info(f"Starting {rounds}-round debate on: {topic[:100]}")

        debate_history = []

        for round_num in range(1, rounds + 1):
            logger.info(f"Debate round {round_num}/{rounds}")

            for i, role in enumerate(agents):
                # Build context from previous arguments
                context = "\n\n".join([
                    f"Round {h['round']}, {h['role']}: {h['argument']}"
                    for h in debate_history
                ])

                task = f"Topic: {topic}\n\nProvide your argument for round {round_num}."
                if context:
                    task += f"\n\nPrevious arguments:\n{context}"

                response = run_single_agent(
                    role=role,
                    task_description=task
                )

                debate_history.append({
                    "round": round_num,
                    "role": role,
                    "argument": response["output"]
                })

        # Synthesize conclusion
        synthesis_context = "\n\n".join([
            f"Round {h['round']}, {h['role']}: {h['argument']}"
            for h in debate_history
        ])

        conclusion = run_single_agent(
            role="synthesizer",
            task_description=f"Synthesize the debate on '{topic}' and provide a balanced conclusion.",
            context=synthesis_context
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "topic": topic,
            "rounds": rounds,
            "debate_transcript": debate_history,
            "conclusion": conclusion["output"]
        }

    except Exception as e:
        logger.error(f"Agent debate failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }
