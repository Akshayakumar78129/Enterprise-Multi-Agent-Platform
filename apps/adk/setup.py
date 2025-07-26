from setuptools import setup, find_packages

setup(
    name="orchestration_agent",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pandas",
        "matplotlib",
        "seaborn",
        "numpy",
        "scikit-learn",
    ],
    python_requires=">=3.7",
    author="Your Name",
    author_email="your.email@example.com",
    description="A package for sales analysis and forecasting",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/orchestration_agent",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
) 