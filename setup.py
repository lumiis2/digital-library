from setuptools import setup, find_packages

setup(
    name="digital-library",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "sqlalchemy",
        "python-dotenv",
        "pytest",
        "pytest-asyncio",
        "pytest-cov",
    ],
)