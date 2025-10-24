"""
AI Workflow Tasks
Chain together multiple AI operations into complex workflows
"""

from celery import Task, chain, group, chord
from typing import List, Dict, Any, Optional
import logging

from python_worker.worker import app
from python_worker.tasks.rag import query_with_context, index_documents
from python_worker.tasks.agents import run_multi_agent_sequential, run_single_agent
from python_worker.tasks.documents import parse_document, summarize_document, chunk_and_index
from python_worker.services.llm_client import llm_client

logger = logging.getLogger(__name__)


@app.task(bind=True, name="workflows.document_to_knowledge_base")
def document_to_knowledge_base_workflow(
    self: Task,
    file_path: str,
    collection_name: str,
    generate_summary: bool = True
) -> Dict[str, Any]:
    """
    Complete workflow: Parse document -> Chunk -> Index -> Generate summary

    Args:
        file_path: Path to document
        collection_name: Collection to index to
        generate_summary: Whether to generate a summary

    Returns:
        Dict with workflow results
    """
    try:
        logger.info(f"Starting document-to-KB workflow: {file_path}")

        # Step 1: Parse document
        parse_result = parse_document(file_path=file_path)
        if parse_result["status"] == "error":
            return {
                "status": "error",
                "task_id": self.request.id,
                "step": "parse",
                "error": parse_result["error"]
            }

        # Step 2: Chunk and index
        index_result = chunk_and_index(
            file_path=file_path,
            collection_name=collection_name
        )

        if index_result["status"] == "error":
            return {
                "status": "error",
                "task_id": self.request.id,
                "step": "index",
                "error": index_result["error"]
            }

        # Step 3: Generate summary (optional)
        summary_result = None
        if generate_summary:
            summary_result = summarize_document(
                text=parse_result["text"],
                style="detailed"
            )

        return {
            "status": "success",
            "task_id": self.request.id,
            "workflow": "document_to_knowledge_base",
            "file_name": parse_result["file_name"],
            "indexed_chunks": index_result["chunks_created"],
            "collection": collection_name,
            "summary": summary_result["summary"] if summary_result else None,
            "steps_completed": ["parse", "chunk", "index"] + (["summarize"] if generate_summary else [])
        }

    except Exception as e:
        logger.error(f"Document-to-KB workflow failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="workflows.research_and_report")
def research_and_report_workflow(
    self: Task,
    topic: str,
    collection_name: str,
    report_style: str = "comprehensive"
) -> Dict[str, Any]:
    """
    Research workflow: RAG search -> Multi-agent analysis -> Generate report

    Args:
        topic: Research topic/question
        collection_name: Knowledge base collection to search
        report_style: Report style (comprehensive, executive, technical)

    Returns:
        Dict with research report
    """
    try:
        logger.info(f"Starting research workflow on: {topic}")

        # Step 1: RAG search for relevant context
        search_result = query_with_context(
            collection_name=collection_name,
            query=topic,
            n_context_docs=5
        )

        if search_result["status"] == "error":
            return {
                "status": "error",
                "task_id": self.request.id,
                "step": "search",
                "error": search_result["error"]
            }

        context = search_result["answer"]
        sources = search_result["sources"]

        # Step 2: Multi-agent analysis
        agents = [
            {"role": "researcher", "task_description": f"Analyze this information about {topic} and provide key insights."},
            {"role": "analyst", "task_description": "Identify patterns, relationships, and important conclusions."},
            {"role": "critic", "task_description": "Identify any gaps, limitations, or areas needing more investigation."}
        ]

        analysis_result = run_multi_agent_sequential(
            agents=agents,
            initial_task=context,
            pass_context=True
        )

        if analysis_result["status"] == "error":
            return {
                "status": "error",
                "task_id": self.request.id,
                "step": "analysis",
                "error": analysis_result["error"]
            }

        # Step 3: Generate final report
        report_context = f"""Topic: {topic}

RAG Search Results:
{context}

Multi-Agent Analysis:
{analysis_result['final_output']}

Sources:
{len(sources['documents'])} documents retrieved"""

        report_prompt = f"""Generate a {report_style} research report on the following topic.

{report_context}

Include:
1. Executive Summary
2. Key Findings
3. Detailed Analysis
4. Conclusions
5. Sources Referenced"""

        report_response = llm_client.generate(
            prompt=report_prompt,
            system=f"You are a research analyst creating {report_style} reports.",
            temperature=0.5,
            max_tokens=4000
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "workflow": "research_and_report",
            "topic": topic,
            "report": report_response["text"],
            "sources_used": len(sources["documents"]),
            "analysis_steps": len(analysis_result["steps"]),
            "usage": report_response["usage"]
        }

    except Exception as e:
        logger.error(f"Research workflow failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="workflows.content_pipeline")
def content_pipeline_workflow(
    self: Task,
    topic: str,
    content_type: str = "blog_post",
    tone: str = "professional",
    length: str = "medium"
) -> Dict[str, Any]:
    """
    Content creation pipeline: Research -> Outline -> Draft -> Review -> Final

    Args:
        topic: Content topic
        content_type: Type of content (blog_post, article, guide, etc.)
        tone: Writing tone (professional, casual, technical, etc.)
        length: Content length (short, medium, long)

    Returns:
        Dict with final content and process details
    """
    try:
        logger.info(f"Starting content pipeline for: {topic}")

        # Step 1: Research phase
        research_agent = run_single_agent(
            role="researcher",
            task_description=f"Research the topic '{topic}' and gather key information, facts, and insights needed for a {content_type}."
        )

        # Step 2: Planning phase
        planner_agent = run_single_agent(
            role="planner",
            task_description=f"Based on this research, create a detailed outline for a {length} {content_type} about {topic}.",
            context=research_agent["output"]
        )

        # Step 3: Writing phase
        length_words = {"short": 500, "medium": 1000, "long": 2000}
        target_words = length_words.get(length, 1000)

        writer_prompt = f"""Write a {content_type} about {topic}.

Outline:
{planner_agent['output']}

Research:
{research_agent['output']}

Requirements:
- Tone: {tone}
- Length: approximately {target_words} words
- Format: {content_type}"""

        draft_response = llm_client.generate(
            prompt=writer_prompt,
            system=f"You are an expert content writer specializing in {content_type}s with a {tone} tone.",
            temperature=0.7,
            max_tokens=3000
        )

        # Step 4: Review phase
        critic_agent = run_single_agent(
            role="critic",
            task_description=f"Review this {content_type} and suggest improvements for clarity, engagement, and accuracy.",
            context=draft_response["text"]
        )

        # Step 5: Final revision
        final_prompt = f"""Revise this {content_type} based on the following review feedback.

Original Draft:
{draft_response['text']}

Review Feedback:
{critic_agent['output']}

Produce the final, polished version."""

        final_response = llm_client.generate(
            prompt=final_prompt,
            system=f"You are an expert editor perfecting {content_type}s.",
            temperature=0.6,
            max_tokens=3000
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "workflow": "content_pipeline",
            "topic": topic,
            "content_type": content_type,
            "final_content": final_response["text"],
            "process": {
                "research": research_agent["output"][:200] + "...",
                "outline": planner_agent["output"][:200] + "...",
                "review_feedback": critic_agent["output"][:200] + "..."
            },
            "total_usage": {
                "input_tokens": sum([
                    research_agent["usage"]["input_tokens"],
                    planner_agent["usage"]["input_tokens"],
                    draft_response["usage"]["input_tokens"],
                    critic_agent["usage"]["input_tokens"],
                    final_response["usage"]["input_tokens"]
                ]),
                "output_tokens": sum([
                    research_agent["usage"]["output_tokens"],
                    planner_agent["usage"]["output_tokens"],
                    draft_response["usage"]["output_tokens"],
                    critic_agent["usage"]["output_tokens"],
                    final_response["usage"]["output_tokens"]
                ])
            }
        }

    except Exception as e:
        logger.error(f"Content pipeline failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="workflows.batch_document_analysis")
def batch_document_analysis_workflow(
    self: Task,
    file_paths: List[str],
    analysis_type: str = "summary"
) -> Dict[str, Any]:
    """
    Analyze multiple documents in batch

    Args:
        file_paths: List of document paths
        analysis_type: Type of analysis (summary, entities, sentiment)

    Returns:
        Dict with analysis results for all documents
    """
    try:
        logger.info(f"Starting batch analysis of {len(file_paths)} documents")

        results = []

        for file_path in file_paths:
            # Parse document
            parse_result = parse_document(file_path=file_path)

            if parse_result["status"] == "error":
                results.append({
                    "file": file_path,
                    "status": "error",
                    "error": parse_result["error"]
                })
                continue

            # Perform analysis based on type
            if analysis_type == "summary":
                analysis = summarize_document(
                    text=parse_result["text"],
                    style="concise"
                )
            elif analysis_type == "sentiment":
                analysis = llm_client.analyze_sentiment(parse_result["text"][:2000])
            else:
                analysis = {"status": "error", "error": f"Unknown analysis type: {analysis_type}"}

            results.append({
                "file": parse_result["file_name"],
                "status": "success",
                "analysis": analysis
            })

        successful = len([r for r in results if r["status"] == "success"])
        failed = len([r for r in results if r["status"] == "error"])

        return {
            "status": "success",
            "task_id": self.request.id,
            "workflow": "batch_document_analysis",
            "analysis_type": analysis_type,
            "total_documents": len(file_paths),
            "successful": successful,
            "failed": failed,
            "results": results
        }

    except Exception as e:
        logger.error(f"Batch analysis workflow failed: {e}")
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }
