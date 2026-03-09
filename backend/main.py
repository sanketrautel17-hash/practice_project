import uvicorn
from core.apis.api import app

if __name__ == "__main__":
    uvicorn.run("core.apis.api:app", host="[IP_ADDRESS]", port=8000, reload=True)