import uvicorn
import os
from core.apis.api import app

if __name__ == "__main__":
    uvicorn.run("core.apis.api:app", host="127.0.0.1", port=int(os.getenv("PORT", "8000")), reload=False)
