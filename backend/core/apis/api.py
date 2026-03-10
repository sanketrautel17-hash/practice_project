import base64
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _generate_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=30)
    payload = {"id": user_id, "exp": exp.isoformat()}
    return base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")


def _decode_jwt_payload(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return None
        payload_b64 = parts[1]
        padding = "=" * (-len(payload_b64) % 4)
        payload_bytes = base64.urlsafe_b64decode(payload_b64 + padding)
        return json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _make_id(prefix: str) -> str:
    return f"{prefix}{secrets.token_hex(5)}"


class RegisterRequest(BaseModel):
    name: str
    email: str
    mobile: str
    password: str
    address: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleRequest(BaseModel):
    token: str


class ProfileGetRequest(BaseModel):
    userId: str


class ProfilePutRequest(BaseModel):
    userId: str
    profileData: Dict[str, Any]


class ExamUpsertRequest(BaseModel):
    name: str
    fees: Dict[str, int]


class ProfileConfigUpdateRequest(BaseModel):
    requiredDocuments: Optional[list[Dict[str, Any]]] = None
    customFields: Optional[list[Dict[str, Any]]] = None


class ApplicationCreateRequest(BaseModel):
    userId: Optional[str] = "2"
    personalDetails: Optional[Dict[str, Any]] = None
    customFields: Optional[Dict[str, Any]] = None
    examType: Optional[Dict[str, Any]] = None
    category: Optional[str] = "general"
    fee: Optional[int] = 0
    documents: Optional[list[Dict[str, Any]]] = None


class ApplicationStatusUpdateRequest(BaseModel):
    status: str


class ApplicationDetailsUpdateRequest(BaseModel):
    personalDetails: Optional[Dict[str, Any]] = None
    customFields: Optional[Dict[str, Any]] = None


class PaymentCreateOrderRequest(BaseModel):
    amount: int


class PaymentVerifyRequest(BaseModel):
    applicationId: str
    paymentId: Optional[str] = None
    orderId: Optional[str] = None
    signature: Optional[str] = None


mock_users: list[Dict[str, Any]] = [
    {
        "_id": "1",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin",
        "password": "password123",
        "isProfileComplete": False,
        "profileData": None,
    },
    {
        "_id": "2",
        "name": "Test Student",
        "email": "user@example.com",
        "role": "user",
        "password": "password123",
        "isProfileComplete": False,
        "profileData": None,
    },
]

exams: list[Dict[str, Any]] = [
    {
        "id": "e1",
        "name": "NEET UG 2026",
        "fees": {"general": 1500, "obc": 1400, "sc": 800, "st": 800},
        "createdAt": _now_iso(),
    },
    {
        "id": "e2",
        "name": "JEE Main 2026",
        "fees": {"general": 1000, "obc": 900, "sc": 500, "st": 500},
        "createdAt": _now_iso(),
    },
    {
        "id": "e3",
        "name": "UPSC Civil Services",
        "fees": {"general": 100, "obc": 100, "sc": 0, "st": 0},
        "createdAt": _now_iso(),
    },
]

profile_config: Dict[str, Any] = {
    "requiredDocuments": [
        {"id": "aadhar", "name": "Aadhar Card"},
        {"id": "pan", "name": "PAN Card"},
        {"id": "10th", "name": "10th Marksheet"},
        {"id": "12th", "name": "12th Marksheet"},
        {"id": "passport", "name": "Passport Size Photo"},
    ],
    "customFields": [],
}

applications: list[Dict[str, Any]] = [
    {
        "id": "app_1",
        "userId": "2",
        "personalDetails": {
            "fullName": "Test Student",
            "dob": "2000-01-01",
            "fatherName": "Mr. Smith",
            "motherName": "Mrs. Smith",
            "address": "123 Exam St",
            "mobile": "9876543210",
            "email": "user@example.com",
            "aadharNumber": "123456789012",
        },
        "customFields": {},
        "examType": {"id": "e1", "name": "NEET UG 2026"},
        "category": "general",
        "fee": 1500,
        "documents": [{"fileName": "photo.jpg", "s3Url": "https://mock-upload.local/photo.jpg"}],
        "status": "Under Review",
        "paymentId": None,
        "createdAt": _now_iso(),
    }
]


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "message" in detail:
        message = detail["message"]
    else:
        message = str(detail)
    return JSONResponse(status_code=exc.status_code, content={"message": message})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"message": "Invalid request payload", "errors": exc.errors()})


@app.get("/")
def read_root() -> Dict[str, str]:
    return {"message": "API is running on port 8000"}


@app.post("/api/auth/register", status_code=201)
def register(payload: RegisterRequest) -> Dict[str, Any]:
    user_id = secrets.token_hex(5)
    user = {
        "_id": user_id,
        "name": payload.name,
        "email": payload.email,
        "role": "user",
        "password": payload.password,
        "isProfileComplete": False,
        "profileData": None,
    }
    mock_users.append(user)
    return {
        "_id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "isProfileComplete": user["isProfileComplete"],
        "profileData": user["profileData"],
        "token": _generate_token(user_id),
    }


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> Dict[str, Any]:
    user = next((u for u in mock_users if u["email"] == payload.email), None)
    if not user:
        user = {
            "_id": secrets.token_hex(5),
            "name": "Guest User",
            "email": payload.email,
            "role": "admin" if "admin" in payload.email else "user",
            "isProfileComplete": False,
            "profileData": None,
        }
    return {
        "_id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "isProfileComplete": user.get("isProfileComplete", False),
        "profileData": user.get("profileData"),
        "token": _generate_token(user["_id"]),
    }


@app.post("/api/auth/google")
def google_auth(payload: GoogleRequest) -> Dict[str, Any]:
    strict_verify = os.getenv("STRICT_GOOGLE_VERIFY", "false").lower() == "true"
    decoded = _decode_jwt_payload(payload.token)
    if strict_verify and not decoded:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid Google token payload")

    email = decoded.get("email")
    name = decoded.get("name") or "Google User"
    if not email:
        raise HTTPException(status_code=401, detail="Invalid Google token payload")

    user = next((u for u in mock_users if u["email"] == email), None)
    if not user:
        user = {
            "_id": secrets.token_hex(5),
            "name": name,
            "email": email,
            "role": "admin" if "admin" in email else "user",
            "isProfileComplete": False,
            "profileData": None,
        }
        mock_users.append(user)

    return {
        "_id": user["_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "isProfileComplete": user.get("isProfileComplete", False),
        "profileData": user.get("profileData"),
        "token": _generate_token(user["_id"]),
    }


@app.get("/api/auth/profile")
def get_profile(userId: str) -> Dict[str, Any]:
    user = next((u for u in mock_users if u["_id"] == userId), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "isProfileComplete": user.get("isProfileComplete", False),
        "profileData": user.get("profileData"),
    }


@app.put("/api/auth/profile")
def update_profile(payload: ProfilePutRequest) -> Dict[str, Any]:
    idx = next((i for i, u in enumerate(mock_users) if u["_id"] == payload.userId), -1)
    if idx == -1:
        user = {
            "_id": payload.userId,
            "name": "User",
            "email": "",
            "role": "user",
            "isProfileComplete": True,
            "profileData": payload.profileData,
        }
        mock_users.append(user)
        return user

    mock_users[idx]["profileData"] = payload.profileData
    mock_users[idx]["isProfileComplete"] = True
    return mock_users[idx]


@app.get("/api/admin/exams")
def get_admin_exams() -> list[Dict[str, Any]]:
    return exams


@app.post("/api/admin/exams", status_code=201)
def create_exam(payload: ExamUpsertRequest) -> Dict[str, Any]:
    exam = {
        "id": _make_id("e"),
        "name": payload.name,
        "fees": payload.fees,
        "createdAt": _now_iso(),
    }
    exams.append(exam)
    return exam


@app.put("/api/admin/exams/{exam_id}")
def update_exam(exam_id: str, payload: ExamUpsertRequest) -> Dict[str, Any]:
    idx = next((i for i, exam in enumerate(exams) if exam["id"] == exam_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail={"message": "Exam not found"})
    exams[idx]["name"] = payload.name
    exams[idx]["fees"] = payload.fees
    return exams[idx]


@app.delete("/api/admin/exams/{exam_id}")
def delete_exam(exam_id: str) -> Dict[str, str]:
    global exams
    exams = [exam for exam in exams if exam["id"] != exam_id]
    return {"message": "Exam removed"}


@app.get("/api/admin/profile-config")
def get_profile_config() -> Dict[str, Any]:
    return profile_config


@app.put("/api/admin/profile-config")
def update_profile_config(payload: ProfileConfigUpdateRequest) -> Dict[str, Any]:
    if payload.requiredDocuments is not None:
        profile_config["requiredDocuments"] = payload.requiredDocuments
    if payload.customFields is not None:
        profile_config["customFields"] = payload.customFields
    return profile_config


@app.get("/api/exams")
def get_public_exams() -> list[Dict[str, Any]]:
    return exams


@app.post("/api/applications", status_code=201)
def create_application(payload: ApplicationCreateRequest) -> Dict[str, Any]:
    personal_details = payload.personalDetails or {}
    if "fullName" not in personal_details:
        first = personal_details.get("firstName", "") if isinstance(personal_details, dict) else ""
        last = personal_details.get("lastName", "") if isinstance(personal_details, dict) else ""
        full_name = f"{first} {last}".strip()
        if full_name:
            personal_details["fullName"] = full_name

    app_data = {
        "id": _make_id("app_"),
        "userId": payload.userId or "2",
        "personalDetails": personal_details,
        "customFields": payload.customFields or {},
        "examType": payload.examType or {},
        "category": payload.category or "general",
        "fee": payload.fee or 0,
        "documents": payload.documents or [],
        "status": "Submitted",
        "paymentId": None,
        "createdAt": _now_iso(),
    }
    applications.append(app_data)
    return app_data


@app.get("/api/applications/my")
def get_my_applications(userId: str = "2") -> list[Dict[str, Any]]:
    return [app_data for app_data in applications if app_data.get("userId") == userId]


@app.get("/api/applications")
def get_all_applications() -> list[Dict[str, Any]]:
    return applications


@app.patch("/api/applications/{application_id}/status")
def update_application_status(application_id: str, payload: ApplicationStatusUpdateRequest) -> Dict[str, Any]:
    idx = next((i for i, app_data in enumerate(applications) if app_data["id"] == application_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail={"message": "Application not found"})
    applications[idx]["status"] = payload.status
    return applications[idx]


@app.patch("/api/applications/{application_id}/details")
def update_application_details(application_id: str, payload: ApplicationDetailsUpdateRequest) -> Dict[str, Any]:
    idx = next((i for i, app_data in enumerate(applications) if app_data["id"] == application_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail={"message": "Application not found"})
    if payload.personalDetails:
        applications[idx]["personalDetails"] = {
            **applications[idx].get("personalDetails", {}),
            **payload.personalDetails,
        }
    if payload.customFields:
        applications[idx]["customFields"] = {
            **applications[idx].get("customFields", {}),
            **payload.customFields,
        }
    return applications[idx]


@app.post("/api/payment/create-order")
def create_payment_order(payload: PaymentCreateOrderRequest) -> Dict[str, Any]:
    return {"id": _make_id("order_"), "amount": payload.amount * 100, "currency": "INR"}


@app.post("/api/payment/verify")
def verify_payment(payload: PaymentVerifyRequest) -> Dict[str, Any]:
    idx = next((i for i, app_data in enumerate(applications) if app_data["id"] == payload.applicationId), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail={"message": "Application not found"})

    applications[idx]["status"] = "Payment Done"
    applications[idx]["paymentId"] = payload.paymentId or _make_id("pay_mock_")
    return {"message": "Payment verified successfully", "application": applications[idx]}


@app.post("/api/applications/upload")
async def upload_documents(files: list[UploadFile] = File(...)) -> list[Dict[str, str]]:
    uploaded_docs: list[Dict[str, str]] = []
    for file in files:
        uploaded_docs.append(
            {
                "fileName": file.filename,
                "s3Url": f"https://mock-upload.local/{_make_id('file_')}_{file.filename}",
            }
        )
    return uploaded_docs
