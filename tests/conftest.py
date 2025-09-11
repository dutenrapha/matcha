# tests/conftest.py
import pytest
import asyncio
from .seed import reset_and_seed

@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    """Resetar e popular banco antes de cada módulo de teste"""
    asyncio.get_event_loop().run_until_complete(reset_and_seed())
