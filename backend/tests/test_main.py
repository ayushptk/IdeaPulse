import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    """
    Test the root endpoint to ensure the API is running correctly.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert data["api"] == "/api/v1"

@pytest.mark.asyncio
async def test_async_placeholder():
    """
    A placeholder async test to verify pytest-asyncio configuration.
    """
    assert True
