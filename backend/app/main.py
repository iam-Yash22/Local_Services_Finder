import os
import re
from contextlib import asynccontextmanager
from difflib import SequenceMatcher
from pathlib import Path
from typing import Annotated
from urllib.parse import unquote

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from .database import Base, engine, get_db
from .models import GalleryImage, Review, Service, ServiceRatingAggregate, ServiceTag, User
from .schemas import AdminUserCreate, AdminUserUpdate, ChatRequest, LoginRequest, ProfileUpdate, RegisterRequest, ReviewCreate, ServiceCreate, TokenResponse, UserProfile
from .security import CurrentUser, create_access_token, password_hash, require_role


CHAT_STOP_WORDS = {
    "a", "about", "all", "an", "and", "any", "are", "area", "around", "available",
    "best", "can", "categories", "category", "database", "do", "does", "find", "for",
    "from", "get", "give", "good", "help", "hire", "how", "i", "in", "is", "it",
    "list", "listing", "listings", "looking", "me", "my", "need", "near", "nearby",
    "of", "okay", "on", "or", "our", "please", "provider", "providers", "recommend", "reliable",
    "search", "schema", "service", "services", "shop", "shops", "show", "someone",
    "somebody", "table", "tables", "vendor", "vendors",
    "tell", "that", "the", "there", "this", "to", "top", "trusted", "want", "what",
    "which", "who", "with", "you", "your",
}
CHAT_CATEGORY_ALIASES = {
    "plumbing": {"plumber", "plumbers", "faucet", "faucets", "tap", "taps", "pipe", "pipes", "leak", "leaks", "drain", "sink", "toilet", "bathroom", "प्लंबर", "प्लंबिंग", "नल", "पाइप", "प्लम्बर"},
    "electrical": {"electrician", "electricians", "electric", "wiring", "wire", "wires", "socket", "sockets", "switch", "switches", "geyser", "fan", "light", "इलेक्ट्रीशियन", "बिजली", "इलेक्ट्रिशियन", "वायरिंग"},
    "cleaning": {"cleaner", "cleaners", "clean", "cleaning", "sanitize", "sanitise", "washing", "deep clean", "सफाई", "क्लीनिंग", "सफाईकर्मी"},
    "painting": {"painter", "painters", "paint", "wall paint", "waterproofing", "पेंटर", "पेंटिंग", "रंगाई", "पेंट"},
    "carpentry": {"carpenter", "carpenters", "woodwork", "furniture", "wardrobe", "door fitting", "बढ़ई", "बढ़ईगीरी", "फर्नीचर", "कारपेंटर"},
    "landscaping": {"landscaper", "landscapers", "gardener", "gardeners", "gardening", "garden", "lawn", "plants", "माली", "बागवानी", "गार्डन"},
    "moving": {"mover", "movers", "packers", "packing", "relocation", "shifting", "मूविंग", "पैकर्स", "शिफ्टिंग", "सामान"},
    "tutoring": {"tutor", "tutors", "tuition", "teacher", "teach", "teaching", "lesson", "lessons", "learn", "learning", "instructor", "classes", "coaching", "ट्यूटर", "ट्यूशन", "शिक्षक", "पढ़ाना", "पढ़ाने", "सिखाना", "पढ़ाई", "अध्यापक"},
    "photography": {"photographer", "photographers", "photo", "photos", "photography", "camera", "videography", "shoot", "photo shoot", "photoshoot", "portrait", "headshot", "फोटोग्राफर", "फोटोग्राफी", "फोटो", "शूट"},
    "catering": {"caterer", "caterers", "food", "cooking", "cook", "meal", "meals", "कैटरिंग", "खाना", "रसोइया", "भोजन"},
}
CHAT_TOKEN_PATTERN = re.compile(r"[a-z0-9]+|[\u0900-\u097f]+")
CHAT_HINDI_WORDS = {
    "aap", "batao", "chahiye", "dhundho", "karo", "karigar", "madad", "mujhe",
    "kaam", "seva", "sevaen", "wala", "wali", "koi", "mera", "meri",
}
CHAT_HINDI_CATEGORY_NAMES = {
    "plumbing": "प्लंबिंग",
    "electrical": "इलेक्ट्रिकल",
    "cleaning": "सफाई",
    "painting": "पेंटिंग",
    "carpentry": "बढ़ईगीरी",
    "landscaping": "बागवानी",
    "moving": "मूविंग",
    "tutoring": "ट्यूशन",
    "photography": "फोटोग्राफी",
    "catering": "कैटरिंग",
}
CHAT_PRIVATE_REQUEST = re.compile(
    r"\b(admin|administrator|password|credentials?|secrets?|api[\s_-]*key|"
    r"tokens?|jwt|environment\s+variables?|env\s+vars?|server\s+(?:data|files?|"
    r"configuration)|source\s+code|system\s+prompt|configuration\s+files?|"
    r"database[_\s-]*url|database\s+(?:dump|records?)|connection\s+string|"
    r"user\s+(?:emails?|accounts?)|list\s+(?:all\s+)?users?)\b",
    re.IGNORECASE,
)
CHAT_GREETING = re.compile(r"(?:hi|hello|hey|good morning|good afternoon|good evening)(?: there)?")
CHAT_CAPABILITY_QUESTION = re.compile(
    r"(?:what can you help me with|how can you help me|what can you do|"
    r"what do you do|what can i ask you|how does (?:localfind|local find|lsf) work)"
)
CHAT_CAPABILITY_REPLY = (
    "I can help you find local service providers listed on LocalFind. Tell me what you need "
    "(for example, a leaking tap, electrical repair, or home cleaning) and your city, and "
    "I’ll show matching registered listings."
)
CHAT_HINDI_WELCOME = (
    "LocalFind में आपका स्वागत है। सेवाओं और प्रदाताओं की जानकारी देखने के लिए कृपया "
    "साइन अप करें और फिर साइन इन करें। अभी आप केवल उपलब्ध सेवा श्रेणियाँ देख सकते हैं।"
)
CHAT_ENGLISH_WELCOME = (
    "Welcome to LocalFind! Please sign up and sign in to browse services and provider details. "
    "For now, you can only see the available service categories."
)
CHAT_HINDI_AUTH_REQUIRED = (
    "सेवाओं की खोज और प्रदाता की जानकारी देखने के लिए कृपया ग्राहक खाते से साइन अप करके "
    "साइन इन करें।"
)
CHAT_ENGLISH_AUTH_REQUIRED = (
    "Please sign up and sign in with a customer account to search services and view provider details."
)


def normalize_chat_word(word: str) -> str:
    if len(word) > 5 and word.endswith("ing"):
        stem = word[:-3]
        if len(stem) > 2 and stem[-1] == stem[-2]:
            stem = stem[:-1]
        return stem
    if len(word) > 4 and word.endswith("ies"):
        return f"{word[:-3]}y"
    if len(word) > 4 and word.endswith("ed"):
        return word[:-2]
    if len(word) > 3 and word.endswith("s"):
        return word[:-1]
    return word


def chat_word_similarity(query_word: str, candidate_word: str) -> float:
    normalized_query = normalize_chat_word(query_word)
    normalized_candidate = normalize_chat_word(candidate_word)
    if normalized_query == normalized_candidate:
        return 1.0
    if min(len(normalized_query), len(normalized_candidate)) < 4:
        return 0.0
    similarity = SequenceMatcher(None, normalized_query, normalized_candidate).ratio()
    return similarity if similarity >= 0.78 else 0.0


def chat_language(message: str) -> str:
    if re.search(r"[\u0900-\u097f]", message):
        return "hi"
    words = set(re.findall(r"[a-z0-9]+", message.lower()))
    return "hi" if words.intersection(CHAT_HINDI_WORDS) else "en"


def requested_service_category(message: str, categories: list[str]) -> str | None:
    words = CHAT_TOKEN_PATTERN.findall(message.lower())
    fuzzy_words = [word for word in words if word not in CHAT_STOP_WORDS]
    available_categories = {
        " ".join(re.findall(r"[a-z0-9]+", category.lower())): category
        for category in categories
    }
    matches: list[tuple[float, str]] = []
    for normalized_category in set(available_categories) | set(CHAT_CATEGORY_ALIASES):
        display_category = available_categories.get(normalized_category, normalized_category.title())
        category_words = normalized_category.split()
        for start in range(max(0, len(words) - len(category_words) + 1)):
            phrase = words[start : start + len(category_words)]
            if phrase == category_words:
                matches.append((1.0, display_category))

        for alias in CHAT_CATEGORY_ALIASES.get(normalized_category, set()):
            alias_words = CHAT_TOKEN_PATTERN.findall(alias.lower())
            if not alias_words:
                continue
            for start in range(max(0, len(words) - len(alias_words) + 1)):
                phrase = words[start : start + len(alias_words)]
                if phrase == alias_words:
                    matches.append((1.0, display_category))
                elif len(alias_words) == 1:
                    similarity = max(
                        (chat_word_similarity(word, alias_words[0]) for word in fuzzy_words),
                        default=0.0,
                    )
                    if similarity:
                        matches.append((similarity, display_category))
    return max(matches, key=lambda match: match[0])[1] if matches else None


def fixed_chat_reply(message: str) -> str | None:
    normalized_message = " ".join(CHAT_TOKEN_PATTERN.findall(message.lower()))
    if CHAT_GREETING.fullmatch(normalized_message) or CHAT_CAPABILITY_QUESTION.fullmatch(
        normalized_message
    ):
        return (
            "मैं LocalFind पर उपलब्ध स्थानीय सेवाएँ ढूँढने में मदद कर सकता हूँ। अपनी ज़रूरत "
            "और शहर बताइए।"
            if chat_language(message) == "hi"
            else CHAT_CAPABILITY_REPLY
        )
    if normalized_message in {"नमस्ते", "नमस्कार", "हाय", "हेलो", "प्रणाम"}:
        return "नमस्ते! कृपया सेवा का नाम या अपनी ज़रूरत और शहर बताइए।"
    if "कैसे काम करता" in normalized_message or "क्या कर सकते" in normalized_message:
        return (
            "मैं LocalFind पर पंजीकृत स्थानीय सेवाएँ ढूँढ सकता हूँ। सेवा का नाम या अपनी ज़रूरत "
            "और शहर बताइए।"
        )
    return None


def score_service_match(service: Service, query_words: list[str]) -> float:
    searchable_fields = (
        (service.title, 2.0),
        (service.category, 2.5),
        (service.provider.name if service.provider else "", 1.3),
        (service.city, 1.2),
        (service.description, 1.0),
        (" ".join(tag.tag for tag in service.tags), 2.0),
    )
    score = 0.0
    for query_word in query_words:
        best_match = 0.0
        best_weight = 0.0
        for field, weight in searchable_fields:
            field_words = re.findall(r"[a-z0-9]+", field.lower())
            similarity = max(
                (chat_word_similarity(query_word, candidate) for candidate in field_words),
                default=0.0,
            )
            weighted_similarity = similarity * weight
            if weighted_similarity > best_match:
                best_match = weighted_similarity
                best_weight = weight
        if best_match:
            score += best_match + min(best_weight * 0.15, 0.3)
    return score


FRONTEND_DIR = Path(
    os.getenv("FRONTEND_DIR", str(Path(__file__).resolve().parents[2] / "dist"))
).resolve()
MEDIA_DIR = Path(
    os.getenv("MEDIA_DIR", str(Path(__file__).resolve().parents[1] / "media"))
).resolve()
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
}

@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Local Service Finder API", version="1.0.0", lifespan=lifespan)


def safe_validation_message(error: RequestValidationError) -> str:
    messages: list[str] = []
    field_names = {
        "email": "Email address",
        "password": "Password",
        "name": "Name",
        "city": "City",
        "phone": "Phone number",
        "role": "Account type",
        "rating": "Rating",
        "comment": "Comment",
        "title": "Service title",
        "category": "Service category",
        "message": "Message",
        "history": "Conversation",
    }

    for item in error.errors():
        location = item.get("loc", ())
        field = str(location[-1]) if location else ""
        error_type = str(item.get("type", ""))
        if field == "email":
            message = (
                "Email address is required."
                if error_type == "missing"
                else "Please enter a valid email address."
            )
        elif error_type == "missing":
            message = f"{field_names.get(field, 'This field')} is required."
        elif error_type == "string_too_short" and field == "password":
            message = "Password must be at least 6 characters long."
        elif error_type == "string_too_long" and field == "password":
            message = "Password cannot exceed 128 characters."
        elif error_type == "string_pattern_mismatch" and field == "role":
            message = "Please select a valid account type."
        elif error_type.startswith("extra_forbidden"):
            message = "The request contains an unsupported field."
        else:
            message = f"Please check the {field_names.get(field, 'information')} and try again."
        if message not in messages:
            messages.append(message)

    return " ".join(messages) or "Please check the information you entered and try again."


@app.exception_handler(RequestValidationError)
async def handle_request_validation_error(
    _request: Request,
    error: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": safe_validation_message(error)},
    )


allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "" if os.getenv("APP_ENV") == "production" else "http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if origin.strip()
]
allowed_origins = [
    origin if origin.startswith(("http://", "https://")) else f"https://{origin}"
    for origin in allowed_origins
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


def user_payload(user: User) -> dict[str, object]:
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "city": user.city,
        "phone": user.phone,
    }


def service_payload(db: Session, service: Service) -> dict[str, object]:
    reviews = db.scalars(
        select(Review).options(joinedload(Review.reviewer)).where(Review.service_id == service.id)
    ).all()
    tags = db.scalars(select(ServiceTag.tag).where(ServiceTag.service_id == service.id)).all()
    rating_aggregate = db.get(ServiceRatingAggregate, service.id)
    rating_total = sum(review.rating for review in reviews)
    rating_count = len(reviews)
    if rating_aggregate:
        rating_total += rating_aggregate.rating_total
        rating_count += rating_aggregate.rating_count
    return {
        "id": service.id,
        "provider_id": service.provider_id,
        "title": service.title,
        "category": service.category,
        "description": service.description,
        "city": service.city,
        "phone": service.phone,
        "price_range": service.price_range,
        "created_at": service.created_at,
        "updated_at": service.updated_at,
        "profiles": {"name": service.provider.name} if service.provider else None,
        "avg_rating": rating_total / rating_count if rating_count else 0,
        "review_count": rating_count,
        "tags": tags,
    }


def get_service_or_404(db: Session, service_id: str) -> Service:
    service = db.scalar(
        select(Service).options(joinedload(Service.provider)).where(Service.id == service_id)
    )
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


def get_service_gallery_owner(db: Session, service_id: str, user: User) -> Service:
    service = get_service_or_404(db, service_id)
    if service.provider_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the service provider can manage this gallery")
    return service


def remove_service_media(service: Service) -> None:
    for image in service.gallery:
        if image.image_url.startswith("/media/"):
            file_path = (MEDIA_DIR / Path(image.image_url).name).resolve()
            if file_path.parent == MEDIA_DIR and file_path.exists():
                file_path.unlink()


DbSession = Annotated[Session, Depends(get_db)]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: DbSession) -> dict[str, object]:
    email = payload.email.lower()
    existing = db.scalar(select(User.id).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    admin_emails = {
        item.strip().lower()
        for item in os.getenv("ADMIN_EMAILS", "").split(",")
        if item.strip()
    }
    user = User(
        email=email,
        password_hash=password_hash.hash(payload.password),
        role="admin" if email in admin_emails else payload.role,
        name=payload.name.strip(),
        city=payload.city.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(user), "user": user_payload(user)}


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> dict[str, object]:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not password_hash.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"access_token": create_access_token(user), "user": user_payload(user)}


@app.get("/api/auth/me", response_model=UserProfile)
def current_profile(user: CurrentUser) -> User:
    return user


@app.patch("/api/profile", response_model=UserProfile)
def update_profile(payload: ProfileUpdate, db: DbSession, user: CurrentUser) -> User:
    if "phone" in payload.model_fields_set:
        requested_phone = payload.phone.strip() if payload.phone and payload.phone.strip() else None
        current_phone = user.phone.strip() if user.phone and user.phone.strip() else None
        if requested_phone != current_phone and (user.role != "user" or current_phone is not None):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Service provider phone numbers cannot be changed"
                    if user.role == "provider"
                    else "A customer phone number can only be set once"
                ),
            )
        if user.role == "user" and current_phone is None:
            user.phone = requested_phone
    user.name = payload.name.strip()
    user.city = payload.city.strip()
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/public/service-categories")
def public_service_categories(db: DbSession) -> list[str]:
    return db.scalars(
        select(Service.category)
        .join(User, Service.provider_id == User.id)
        .where(User.role == "provider")
        .distinct()
        .order_by(Service.category)
    ).all()


@app.get("/api/services")
def list_services(db: DbSession, _user: CurrentUser) -> list[dict[str, object]]:
    services = db.scalars(
        select(Service).options(joinedload(Service.provider)).order_by(Service.created_at.desc())
    ).unique().all()
    return [service_payload(db, service) for service in services]


@app.get("/api/services/{service_id}")
def service_detail(service_id: str, db: DbSession, _user: CurrentUser) -> dict[str, object]:
    service = get_service_or_404(db, service_id)
    reviews = db.scalars(
        select(Review)
        .options(joinedload(Review.reviewer))
        .where(Review.service_id == service_id)
        .order_by(Review.created_at.desc())
    ).unique().all()
    result = service_payload(db, service)
    result["profiles"] = {
        "name": service.provider.name,
        "email": service.provider.email,
        "phone": service.provider.phone,
        "city": service.provider.city,
    }
    result["reviews"] = [
        {
            "id": review.id,
            "user_id": review.user_id,
            "service_id": review.service_id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "profiles": {"name": review.reviewer.name},
        }
        for review in reviews
    ]
    return result


@app.post("/api/services", status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, db: DbSession, user: CurrentUser) -> dict[str, object]:
    if user.role != "provider":
        raise HTTPException(status_code=403, detail="Only service providers can add services")
    service = Service(
        provider_id=user.id,
        title=payload.title.strip(),
        category=payload.category.strip(),
        description=payload.description.strip(),
        city=payload.city.strip(),
        phone=payload.phone.strip() if payload.phone and payload.phone.strip() else None,
        price_range=payload.price_range.strip() if payload.price_range and payload.price_range.strip() else None,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service_payload(db, service)


@app.get("/api/profile/services")
def my_services(db: DbSession, user: CurrentUser) -> list[dict[str, object]]:
    services = db.scalars(
        select(Service)
        .options(joinedload(Service.provider))
        .where(Service.provider_id == user.id)
        .order_by(Service.created_at.desc())
    ).unique().all()
    return [service_payload(db, service) for service in services]


@app.post("/api/services/{service_id}/reviews", status_code=status.HTTP_201_CREATED)
def create_review(service_id: str, payload: ReviewCreate, db: DbSession, user: CurrentUser) -> dict[str, object]:
    if user.role != "user":
        raise HTTPException(status_code=403, detail="Only customer accounts can leave reviews")
    get_service_or_404(db, service_id)
    review = Review(user_id=user.id, service_id=service_id, rating=payload.rating, comment=payload.comment)
    db.add(review)
    db.commit()
    db.refresh(review)
    return {
        "id": review.id,
        "user_id": review.user_id,
        "service_id": review.service_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }


@app.get("/api/services/{service_id}/gallery")
def list_gallery(service_id: str, db: DbSession, _user: CurrentUser) -> list[dict[str, object]]:
    get_service_or_404(db, service_id)
    images = db.scalars(
        select(GalleryImage)
        .where(GalleryImage.service_id == service_id)
        .order_by(GalleryImage.created_at.desc())
    ).all()
    return [
        {"id": image.id, "image_url": image.image_url, "caption": image.caption or ""}
        for image in images
    ]


@app.post("/api/services/{service_id}/gallery", status_code=status.HTTP_201_CREATED)
async def upload_gallery_item(
    service_id: str,
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
    caption: str = Form(default=""),
) -> dict[str, object]:
    service = get_service_gallery_owner(db, service_id, user)
    content_type = (file.content_type or "").lower()
    extension = ALLOWED_CONTENT_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(status_code=415, detail="Unsupported gallery file type")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller")
    stored_name = f"{service.id}-{os.urandom(16).hex()}{extension}"
    (MEDIA_DIR / stored_name).write_bytes(content)
    image = GalleryImage(
        service_id=service.id,
        image_url=f"/media/{stored_name}",
        caption=caption.strip() or None,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return {"id": image.id, "image_url": image.image_url, "caption": image.caption or ""}


@app.delete("/api/gallery/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery_item(image_id: str, db: DbSession, user: CurrentUser) -> None:
    image = db.get(GalleryImage, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    get_service_gallery_owner(db, image.service_id, user)
    if image.image_url.startswith("/media/"):
        file_path = (MEDIA_DIR / Path(image.image_url).name).resolve()
        if file_path.parent == MEDIA_DIR and file_path.exists():
            file_path.unlink()
    db.delete(image)
    db.commit()


@app.get("/api/admin/users")
def admin_users(db: DbSession, _admin: Annotated[User, Depends(require_role("admin"))]) -> list[dict[str, object]]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [
        user_payload(user)
        for user in users
    ]


@app.post("/api/admin/users", status_code=status.HTTP_201_CREATED)
def admin_create_user(
    payload: AdminUserCreate,
    db: DbSession,
    _admin: Annotated[User, Depends(require_role("admin"))],
) -> dict[str, object]:
    email = str(payload.email).lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(
        email=email,
        password_hash=password_hash.hash(payload.password),
        role=payload.role,
        name=payload.name.strip(),
        city=payload.city.strip(),
        phone=payload.phone.strip() if payload.phone else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_payload(user)


@app.patch("/api/admin/users/{user_id}")
def admin_update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: DbSession,
    admin: Annotated[User, Depends(require_role("admin"))],
) -> dict[str, object]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Account not found")

    changes = payload.model_dump(exclude_unset=True)
    if "email" in changes:
        if changes["email"] is None:
            raise HTTPException(status_code=422, detail="Email address cannot be empty")
        email = str(changes["email"]).lower()
        existing = db.scalar(
            select(User.id).where(User.email == email, User.id != user_id)
        )
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        changes["email"] = email

    if "role" in changes:
        new_role = changes["role"]
        if new_role is None:
            raise HTTPException(status_code=422, detail="Account type cannot be empty")
        if user.id == admin.id and new_role != "admin":
            raise HTTPException(status_code=409, detail="You cannot change your own admin role")
        if user.role == "provider" and new_role != "provider":
            if db.scalar(select(Service.id).where(Service.provider_id == user_id).limit(1)):
                raise HTTPException(
                    status_code=409,
                    detail="Remove this provider's service listings before changing their account type",
                )

    if "password" in changes and changes["password"] is not None:
        user.password_hash = password_hash.hash(changes.pop("password"))
    else:
        changes.pop("password", None)
    for field, value in changes.items():
        if value is None:
            if field == "phone":
                user.phone = None
            continue
        setattr(user, field, value.strip() if field in {"name", "city", "phone"} else value)

    db.commit()
    db.refresh(user)
    return user_payload(user)


@app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: str,
    db: DbSession,
    admin: Annotated[User, Depends(require_role("admin"))],
) -> None:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Account not found")
    if user.id == admin.id:
        raise HTTPException(status_code=409, detail="You cannot remove your own admin account")

    for service in user.services:
        remove_service_media(service)
    db.execute(delete(Review).where(Review.user_id == user.id))
    db.delete(user)
    db.commit()


@app.get("/api/admin/services")
def admin_services(
    db: DbSession,
    _admin: Annotated[User, Depends(require_role("admin"))],
) -> list[dict[str, object]]:
    services = db.scalars(
        select(Service).options(joinedload(Service.provider)).order_by(Service.created_at.desc())
    ).unique().all()
    return [service_payload(db, service) for service in services]


@app.delete("/api/admin/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_service(
    service_id: str,
    db: DbSession,
    _admin: Annotated[User, Depends(require_role("admin"))],
) -> None:
    service = get_service_or_404(db, service_id)
    remove_service_media(service)
    db.delete(service)
    db.commit()


@app.post("/api/ai-chat")
def ai_chat(payload: ChatRequest, db: DbSession, user: CurrentUser) -> dict[str, object]:
    language = chat_language(payload.message)
    if user.role != "user":
        return {
            "reply": CHAT_HINDI_AUTH_REQUIRED if language == "hi" else CHAT_ENGLISH_AUTH_REQUIRED,
            "hasLocalResults": False,
            "searchedOnline": False,
            "source": "safe",
        }

    if CHAT_PRIVATE_REQUEST.search(payload.message):
        return {
            "reply": (
                "मैं केवल LocalFind पर उपलब्ध सेवाओं की जानकारी दे सकता हूँ। "
                "मैं एडमिन, खाते, पासवर्ड या सर्वर की जानकारी नहीं दे सकता।"
                if language == "hi"
                else (
                    "I can only search service listings registered on LocalFind. "
                    "I can't provide admin, account, credential, or server information."
                )
            ),
            "hasLocalResults": False,
            "searchedOnline": False,
            "source": "safe",
        }

    fixed_reply = fixed_chat_reply(payload.message)
    if fixed_reply:
        return {
            "reply": fixed_reply,
            "hasLocalResults": False,
            "searchedOnline": False,
            "source": "safe",
        }

    categories = db.scalars(
        select(Service.category)
        .join(User, Service.provider_id == User.id)
        .where(User.role == "provider")
        .distinct()
        .order_by(Service.category)
    ).all()
    requested_category = requested_service_category(
        payload.message,
        categories,
    )
    message_words = CHAT_TOKEN_PATTERN.findall(payload.message.lower())
    message_terms = set(message_words)
    service_intent_terms = {
        "available", "find", "hire", "list", "listing", "listings", "need", "near",
        "nearby", "provider", "providers", "recommend", "search", "service", "services",
        "shop", "shops", "show", "vendor", "vendors", "where", "who", "which",
        "fix", "repair", "repairing", "broken", "leaking", "install", "installation",
    }
    if not requested_category and not message_terms.intersection(service_intent_terms):
        return {
            "reply": (
                "मैं केवल LocalFind पर उपलब्ध सेवाओं को खोजने में मदद कर सकता हूँ। कृपया "
                "सेवा की श्रेणी या अपनी ज़रूरत बताइए।"
                if language == "hi"
                else (
                    "I can only answer requests to find or list services registered on LocalFind. "
                    "Please ask for a service category, provider, or listing."
                )
            ),
            "hasLocalResults": False,
            "searchedOnline": False,
            "source": "safe",
        }

    category_terms: set[str] = set()
    if requested_category:
        normalized_category = " ".join(re.findall(r"[a-z0-9]+", requested_category.lower()))
        category_terms.update(normalized_category.split())
        category_terms.update(
            word
            for alias in CHAT_CATEGORY_ALIASES.get(normalized_category, set())
            for word in alias.split()
        )
    terms = list(dict.fromkeys(
        normalize_chat_word(term)
        for term in message_words
        if len(term) > 2 and term not in CHAT_STOP_WORDS and term not in category_terms
    ))[:12]

    query = (
        select(Service)
        .join(User, Service.provider_id == User.id)
        .options(joinedload(Service.provider))
        .where(User.role == "provider")
    )
    if requested_category:
        query = query.where(Service.category == requested_category)
    candidates = db.scalars(
        query.order_by(Service.created_at.desc()).options(joinedload(Service.tags)).limit(500)
    ).unique().all()
    if terms and not message_terms.intersection({"all", "each", "every"}):
        ranked_services = sorted(
            (
                (score_service_match(service, terms), service)
                for service in candidates
            ),
            key=lambda result: (result[0], result[1].created_at),
            reverse=True,
        )
        services = [
            service
            for score, service in ranked_services
            if score >= 1.15
        ][:8]
        if not services and requested_category:
            services = candidates[:8]
    else:
        services = candidates[:8]

    if requested_category:
        category_label = (
            CHAT_HINDI_CATEGORY_NAMES.get(requested_category.lower(), requested_category)
            if language == "hi"
            else requested_category
        )
        heading = (
            f"LocalFind पर पंजीकृत {category_label} सेवाएँ:"
            if language == "hi"
            else f"Matching {requested_category} services registered on LocalFind:"
        )
    else:
        heading = (
            "LocalFind पर आपकी ज़रूरत से मेल खाती पंजीकृत सेवाएँ:"
            if language == "hi"
            else "Closest matching services registered on LocalFind:"
        )
    if services:
        service_lines = []
        for service in services:
            category_label = (
                CHAT_HINDI_CATEGORY_NAMES.get(service.category.lower(), service.category)
                if language == "hi"
                else service.category
            )
            if language == "hi":
                service_lines.append(
                    f"- **{service.title}** | प्रदाता: {service.provider.name} | "
                    f"श्रेणी: {category_label} | शहर: {service.city} | "
                    f"फ़ोन: {service.phone or 'उपलब्ध नहीं'} | "
                    f"कीमत: {service.price_range or 'उपलब्ध नहीं'}"
                )
            else:
                service_lines.append(
                    f"- **{service.title}** by {service.provider.name} | {service.category} | "
                    f"{service.city} | Phone: {service.phone or 'N/A'} | "
                    f"Price: {service.price_range or 'N/A'}"
                )
        reply = heading + "\n\n" + "\n".join(service_lines)
    else:
        if language == "hi":
            category_label = (
                CHAT_HINDI_CATEGORY_NAMES.get(requested_category.lower(), requested_category)
                if requested_category
                else "सेवाएँ"
            )
            reply = f"LocalFind पर अभी कोई मिलती-जुलती {category_label} पंजीकृत नहीं है।"
        else:
            requested = f" matching {requested_category} services" if requested_category else " matching services"
            reply = f"No{requested} are registered on LocalFind."
        if not requested_category and candidates:
            reply += (
                " आप सेवा, काम या शहर का नाम बताकर फिर से कोशिश करें।"
                if language == "hi"
                else " Try naming the service, task, or city you need."
            )

    return {
        "reply": reply,
        "hasLocalResults": bool(services),
        "searchedOnline": False,
        "source": "database",
    }


@app.get("/{requested_path:path}", include_in_schema=False)
def serve_frontend(requested_path: str = "") -> FileResponse:
    if requested_path == "api" or requested_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    decoded_path = unquote(requested_path)
    requested_file = (FRONTEND_DIR / decoded_path).resolve()
    if requested_file.is_relative_to(FRONTEND_DIR) and requested_file.is_file():
        return FileResponse(requested_file)

    if Path(decoded_path).suffix:
        raise HTTPException(status_code=404, detail="Not found")

    index_file = FRONTEND_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend build not found")
