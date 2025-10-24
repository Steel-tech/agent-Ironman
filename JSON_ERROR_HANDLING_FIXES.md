# JSON Parsing and Error Handling Fixes

## Summary
Fixed all unprotected `await req.json()` calls in server route handlers to prevent server crashes from malformed JSON and invalid request bodies.

## Files Modified

### 1. `/Users/vics/Applications/agent-ironman-app/server/routes/sessions.ts`

**Changes:**
- Added Zod validation schemas for all request body types
- Created `parseJsonBody()` helper function with comprehensive error handling
- Updated 4 endpoints to use the validation helper:
  - `POST /api/sessions` (line 37)
  - `PATCH /api/sessions/:id` (line 84)
  - `PATCH /api/sessions/:id/directory` (line 119)
  - `PATCH /api/sessions/:id/mode` (line 160)

**Validation Schemas Added:**
```typescript
const createSessionSchema = z.object({
  title: z.string().optional(),
  workingDirectory: z.string().optional(),
  mode: z.enum(['general', 'coder', 'intense-research', 'spark']).optional()
});

const renameFolderSchema = z.object({
  folderName: z.string().min(1, 'Folder name is required')
});

const updateDirectorySchema = z.object({
  workingDirectory: z.string().min(1, 'Working directory is required')
});

const updateModeSchema = z.object({
  mode: z.enum(['default', 'acceptEdits', 'bypassPermissions', 'plan'])
});
```

### 2. `/Users/vics/Applications/agent-ironman-app/server/routes/directory.ts`

**Changes:**
- Added Zod validation schema for directory validation
- Created `parseJsonBody()` helper function with comprehensive error handling
- Updated 1 endpoint to use the validation helper:
  - `POST /api/validate-directory` (line 17)

**Validation Schema Added:**
```typescript
const validateDirectorySchema = z.object({
  directory: z.string().min(1, 'Directory path is required')
});
```

## Error Handling Pattern

All endpoints now follow this pattern:

```typescript
const parsed = await parseJsonBody(req, schema);
if (!parsed.success) {
  return parsed.error; // Returns 400 with detailed error message
}

const { field1, field2 } = parsed.data;
// ... rest of handler logic
```

## Error Response Format

All validation errors return consistent JSON responses:

```json
{
  "error": "Invalid JSON in request body"
}
```

or for validation failures:

```json
{
  "error": "Validation failed: field: error message"
}
```

## Security Benefits

1. **No server crashes** - Malformed JSON returns 400 instead of crashing
2. **Type safety** - Zod validates runtime types match expectations
3. **Clear error messages** - Users get specific feedback about what's wrong
4. **Input validation** - Enum values, required fields, string lengths all validated
5. **Consistent error format** - All errors follow `{ error: string }` pattern

## Testing Instructions

To test the error handling:

1. **Restart the development server** to ensure TypeScript changes are compiled:
   ```bash
   # Kill the current server
   # Restart with: npm run dev
   ```

2. **Run the test script**:
   ```bash
   ./test-json-validation.sh
   ```

3. **Expected results**:
   - Invalid JSON → 400 with "Invalid JSON in request body"
   - Missing required fields → 400 with "Validation failed: field: Required"
   - Invalid enum values → 400 with "Validation failed: mode: Invalid enum value"
   - Valid requests → 200 with expected response

## Manual Testing Examples

```bash
# Test 1: Invalid JSON (should return 400)
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{invalid json}'

# Test 2: Missing required field (should return 400)
curl -X POST http://localhost:3000/api/validate-directory \
  -H "Content-Type: application/json" \
  -d '{}'

# Test 3: Invalid enum (should return 400)
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"mode": "invalid-mode"}'

# Test 4: Valid request (should return 200)
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "mode": "general"}'
```

## Next Steps

1. Restart the development server to compile TypeScript changes
2. Run manual tests to verify error handling works
3. Consider adding similar error handling to other route files if they exist
4. Add automated tests to prevent regression

## Dependencies

- Uses existing `zod` package (version ^4.1.12) - no new dependencies added
