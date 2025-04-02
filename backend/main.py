from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api import router as api_router
import time
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# Simple in-memory rate limiting tracker
request_tracker = {}

# Rate limiting middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        path = request.url.path
        
        # Only apply rate limiting to specific endpoints that might cause loops
        if path.startswith("/pdfs/access/"):
            current_time = time.time()
            
            # Create a key combining IP and path
            key = f"{client_ip}:{path}"
            
            # Use global request_tracker
            global request_tracker
            
            # Check if this request is allowed
            if key in request_tracker:
                last_request_time = request_tracker[key]
                # Limit to one request per 10 seconds for PDF access endpoints
                if current_time - last_request_time < 10:
                    # Too many requests
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many requests. Please try again later."}
                    )
            
            # Update the last request time
            request_tracker[key] = current_time
            
            # Clean up old entries every 100 requests
            if len(request_tracker) > 100:
                # Remove entries older than 60 seconds
                current_time = time.time()
                request_tracker = {k: v for k, v in request_tracker.items() if current_time - v < 60}
        
        # Process the request
        response = await call_next(request)
        return response

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Add CORS middleware with file size configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Be more specific about origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "Content-Type"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    response = await call_next(request)
    return response

app.include_router(api_router, tags=["API"])


@app.get("/")
def root():
    return {"message": "PDF Highlighter API is running"}
