# Add Structured Logging to Endpoint

1. **Import logging**: Add `import logging` at the top if not present
2. **Create logger**: Add `logger = logging.getLogger(__name__)` after imports
3. **Create log_context**: At the start of the endpoint function, create a `log_context` dictionary with:
   - `endpoint`: The function name
   - `method`: HTTP method (GET, POST, PUT, DELETE)
   - Relevant IDs 
   - Request parameters 
4. **Add start log**: `logger.info("{endpoint} request started", extra=log_context)`
5. **Wrap in try/except**: Wrap the endpoint logic in a try/except block
6. **Add success log**: Before return, add `logger.info("{endpoint} request successful", extra={**log_context, ...metrics...})` with relevant metrics
7. **Add error log**: In the except block, add `logger.error("{endpoint} request failed", extra={**log_context, "error": str(e)}, exc_info=True)`
8. **Re-raise exception**: Use `raise` to re-raise the exception

Example pattern:
```python
log_context = {
    "endpoint": "function_name",
    "method": "GET",
    "resource_id": resource_id,
}
logger.info("Function name request started", extra=log_context)

try:
    # existing logic
    logger.info("Function name request successful", extra={**log_context, "metric": value})
    return response
except Exception as e:
    logger.error("Function name request failed", extra={**log_context, "error": str(e)}, exc_info=True)
    raise