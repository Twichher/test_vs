import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import uuid
import mimetypes

# Конфигурация MinIO
MINIO_ENDPOINT = "localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin123"
MINIO_BUCKET_NAME = "allphotos"
MINIO_SECURE = False  # True для https

def get_minio_client():
    """Создает и возвращает клиент MinIO S3"""
    return boto3.client(
        's3',
        endpoint_url=f"{'https' if MINIO_SECURE else 'http'}://{MINIO_ENDPOINT}",
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version='s3v4'),
        region_name='us-east-1'
    )

def upload_photo(file_data: bytes, filename: str, content_type: str = None) -> dict:
    """
    Загружает фотографию в MinIO S3
    
    Args:
        file_data: Бинарные данные файла
        filename: Имя файла
        content_type: MIME-тип файла (опционально)
    
    Returns:
        dict: {"success": True, "url": "...", "object_name": "..."} или {"success": False, "error": "..."}
    """
    # Проверяем что файл является изображением
    if content_type:
        if not content_type.startswith('image/'):
            return {"success": False, "error": "Файл должен быть изображением (JPEG, PNG, GIF, etc.)"}
    else:
        # Пытаемся определить тип по расширению
        guessed_type = mimetypes.guess_type(filename)[0]
        if not guessed_type or not guessed_type.startswith('image/'):
            return {"success": False, "error": "Файл должен быть изображением (JPEG, PNG, GIF, etc.)"}
        content_type = guessed_type
    
    # Генерируем уникальное имя файла
    file_extension = filename.split('.')[-1].lower()
    object_name = f"photos/{uuid.uuid4()}.{file_extension}"
    
    try:
        s3_client = get_minio_client()
        
        # Проверяем существование бакета, если нет - создаем
        try:
            s3_client.head_bucket(Bucket=MINIO_BUCKET_NAME)
        except ClientError:
            s3_client.create_bucket(Bucket=MINIO_BUCKET_NAME)
        
        # Загружаем файл
        s3_client.put_object(
            Bucket=MINIO_BUCKET_NAME,
            Key=object_name,
            Body=file_data,
            ContentType=content_type,
            Metadata={
                'Content-Type': content_type
            }
        )
        
        # Формируем URL файла
        protocol = 'https' if MINIO_SECURE else 'http'
        file_url = f"{protocol}://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"
        
        return {
            "success": True,
            "url": file_url,
            "object_name": object_name,
            "bucket": MINIO_BUCKET_NAME
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def delete_photo(object_name: str) -> dict:
    """
    Удаляет фотографию из MinIO S3
    
    Args:
        object_name: Имя объекта в бакете
    
    Returns:
        dict: {"success": True} или {"success": False, "error": "..."}
    """
    try:
        s3_client = get_minio_client()
        s3_client.delete_object(
            Bucket=MINIO_BUCKET_NAME,
            Key=object_name
        )
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


def upload_support_photo(file_data: bytes, filename: str, content_type: str = None) -> dict:
    """
    Загружает фотографию обращения в поддержку в MinIO S3 в папку photossupport
    """
    if content_type:
        if not content_type.startswith('image/'):
            return {"success": False, "error": "Файл должен быть изображением (JPEG, PNG, GIF, etc.)"}
    else:
        guessed_type = mimetypes.guess_type(filename)[0]
        if not guessed_type or not guessed_type.startswith('image/'):
            return {"success": False, "error": "Файл должен быть изображением (JPEG, PNG, GIF, etc.)"}
        content_type = guessed_type

    file_extension = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
    object_name = f"photossupport/{uuid.uuid4()}.{file_extension}"

    try:
        s3_client = get_minio_client()
        try:
            s3_client.head_bucket(Bucket=MINIO_BUCKET_NAME)
        except ClientError:
            s3_client.create_bucket(Bucket=MINIO_BUCKET_NAME)

        s3_client.put_object(
            Bucket=MINIO_BUCKET_NAME,
            Key=object_name,
            Body=file_data,
            ContentType=content_type,
            Metadata={'Content-Type': content_type}
        )

        protocol = 'https' if MINIO_SECURE else 'http'
        file_url = f"{protocol}://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"

        return {
            "success": True,
            "url": file_url,
            "object_name": object_name,
            "bucket": MINIO_BUCKET_NAME
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def upload_meeting_photo(file_data: bytes, filename: str, content_type: str = None) -> dict:
    """
    Загружает фотографию встречи в MinIO S3 в папку photosformeetings
    
    Args:
        file_data: Бинарные данные файла
        filename: Имя файла
        content_type: MIME-тип файла (опционально)
    
    Returns:
        dict: {"success": True, "url": "...", "object_name": "..."} или {"success": False, "error": "..."}
    """
    # Проверяем что файл является изображением
    if content_type:
        if not content_type.startswith('image/'):
            return {"success": False, "error": "Файл должен быть изображением (JPEG, PNG, GIF, etc.)"}
    else:
        # Пытаемся определить тип по расширению
        guessed_type = mimetypes.guess_type(filename)[0]
        if not guessed_type or not guessed_type.startswith('image/'):
            return {"success": False, "error": "Файл должен быть изображением (JPEG, PNG, GIF, etc.)"}
        content_type = guessed_type
    
    # Генерируем уникальное имя файла в папке photosformeetings
    file_extension = filename.split('.')[-1].lower() if '.' in filename else 'jpg'
    object_name = f"photosformeetings/{uuid.uuid4()}.{file_extension}"
    
    try:
        s3_client = get_minio_client()
        
        # Проверяем существование бакета, если нет - создаем
        try:
            s3_client.head_bucket(Bucket=MINIO_BUCKET_NAME)
        except ClientError:
            s3_client.create_bucket(Bucket=MINIO_BUCKET_NAME)
        
        # Загружаем файл
        s3_client.put_object(
            Bucket=MINIO_BUCKET_NAME,
            Key=object_name,
            Body=file_data,
            ContentType=content_type,
            Metadata={
                'Content-Type': content_type
            }
        )
        
        # Формируем URL файла
        protocol = 'https' if MINIO_SECURE else 'http'
        file_url = f"{protocol}://{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"
        
        return {
            "success": True,
            "url": file_url,
            "object_name": object_name,
            "bucket": MINIO_BUCKET_NAME
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}
