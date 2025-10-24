# Data Directory

This directory contains persistent data for the Agent Ironman application.

## Structure

### `/chroma/`
ChromaDB vector store database files. This directory stores:
- Vector embeddings for document similarity search
- RAG (Retrieval Augmented Generation) knowledge base
- Document metadata and collections

**Important:**
- This directory is automatically created by the Python worker on first run
- All contents are gitignored (see `.gitignore`)
- Do not manually modify files in this directory
- Permissions: 755 (rwxr-xr-x)

## Configuration

The ChromaDB persist directory can be configured via environment variable:
```bash
CHROMA_PERSIST_DIR=/path/to/chroma
```

Default: `<project-root>/data/chroma`

See `python-worker/config.py` for more configuration options.

## Maintenance

To reset the vector store:
1. Stop the Python worker
2. Delete the `chroma/` directory: `rm -rf data/chroma`
3. Restart the Python worker (directory will be recreated automatically)

## Security

- Never commit this directory to version control
- Ensure proper file permissions (755 for directories, 644 for files)
- Back up important data before performing maintenance operations
