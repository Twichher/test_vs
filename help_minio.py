import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse
from typing import List
import boto3
from botocore.client import Config

app = FastAPI()

# Настройка MinIO клиента (S3-совместимый)
s3 = boto3.client(
    "s3",
    endpoint_url=f"http://{os.getenv('MINIO_ENDPOINT', 'localhost:9000')}",
    aws_access_key_id=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
    aws_secret_access_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
    config=Config(signature_version="s3v4"),
)

BUCKET_NAME = "photos"

# Создаём бакет при старте (если нет)
try:
    s3.create_bucket(Bucket=BUCKET_NAME)
except s3.exceptions.BucketAlreadyExists:
    pass


@app.post("/upload/")
async def upload_files(files: List[UploadFile] = File(...)):
    urls = []
    
    for file in files:
        # Уникальное имя
        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        
        # Загружаем в MinIO
        s3.upload_fileobj(
            file.file,
            BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": file.content_type}
        )
        
        # Формируем URL
        url = f"http://localhost:9000/{BUCKET_NAME}/{filename}"
        urls.append({
            "filename": file.filename,
            "url": url,
            "minio_path": f"{BUCKET_NAME}/{filename}"
        })
    
    return {"files": urls}


@app.get("/file/{filename}")
async def get_file(filename: str):
    """Получить временную ссылку на файл (или redirect)"""
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": filename},
        ExpiresIn=3600  # 1 час
    )
    return RedirectResponse(url)

