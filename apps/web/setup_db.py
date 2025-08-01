import os
import gdown
import shutil
from pathlib import Path
import logging

from init_inventory_db import init_database

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_DIR = Path(__file__).parent
TEMP_DOWNLOAD_DIR = Path(__file__).parent / "temp_downloads"

# List of files to download
# Format: (file_id, filename) for Google Drive files
# For shared links, use the format: (shared_link, filename, is_shared_link)
FILES_TO_DOWNLOAD = [
    # Add your Google Drive file IDs and names here
    # Example for direct file_id:
    # ("1ZDdiDHMQYCjJc3CqOCBnyMwQAc8Gtu7O", "file1.db"),
    ("1FABbfjrkdvk49dysd7rfhMNIAud4h-tX", "customers.db"),
    ("1Xzn1Z7v500oXENX0lvbC9VZ7OiWLXrEl", "financial_agent.db"),
    ("1CeloLdBETQEzH265uJ9TzkY4jgwj5VI9", "sales_agent.db"),
    
    # Example for shared link:
    # ("https://drive.google.com/file/d/1ZDdiDHMQYCjJc3CqOCBnyMwQAc8Gtu7O/view?usp=sharing", "file2.db", True),
]

def ensure_directory_exists(directory):
    """Create directory if it doesn't exist."""
    if not directory.exists():
        logger.info(f"Creating directory: {directory}")
        directory.mkdir(parents=True)
    return directory

def download_file_from_drive(file_id_or_url, target_path, is_shared_link=False):
    """Download a file from Google Drive to the specified path."""
    try:
        logger.info(f"Downloading from Google Drive to {target_path}")
        
        if is_shared_link:
            # Handle shared link format
            success = gdown.download(url=file_id_or_url, output=str(target_path), quiet=False)
        else:
            # Handle file_id format
            success = gdown.download(id=file_id_or_url, output=str(target_path), quiet=False)
        
        if success:
            logger.info(f"Download completed: {target_path}")
            return True
        else:
            logger.error(f"Failed to download file from Google Drive")
            return False
            
    except Exception as e:
        logger.error(f"Error downloading from Google Drive: {e}")
        return False

def main():
    """Main function to download files and copy them to the database directory."""
    # Ensure directories exist
    ensure_directory_exists(DATABASE_DIR)
    temp_dir = ensure_directory_exists(TEMP_DOWNLOAD_DIR)
    
    # Track successful and failed operations
    successful = []
    failed = []
    
    try:
        init_database()
        # Download each file
        for item in FILES_TO_DOWNLOAD:
            # Check if it's a shared link format
            if len(item) == 3:
                file_id_or_url, filename, is_shared_link = item
            else:
                file_id_or_url, filename = item
                is_shared_link = False
                
            temp_file_path = temp_dir / filename
            
            # Download the file
            if download_file_from_drive(file_id_or_url, temp_file_path, is_shared_link):
                # Copy to database directory
                if filename == "sales_agent.db":
                    target_path = DATABASE_DIR / "Sales" / "database" / filename
                elif filename == "financial_agent.db":
                    target_path = DATABASE_DIR / "Finance" / "database" / filename
                elif filename == "customers.db":
                    target_path = DATABASE_DIR / "Customer" / "database" / filename
                else:
                    target_path = DATABASE_DIR / filename
                logger.info(f"Copying {temp_file_path} to {target_path}")
                
                try:
                    shutil.copy2(temp_file_path, target_path)
                    successful.append(filename)
                    logger.info(f"Successfully copied {filename} to database directory")
                except Exception as e:
                    logger.error(f"Error copying {filename} to database: {e}")
                    failed.append((filename, str(e)))
            else:
                failed.append((filename, "Download failed"))
    
    finally:
        # Clean up temporary files
        if temp_dir.exists():
            logger.info(f"Cleaning up temporary directory: {temp_dir}")
            shutil.rmtree(temp_dir)
    
    # Report results
    logger.info(f"Operation completed. {len(successful)} files successful, {len(failed)} failed.")
    if failed:
        logger.warning("Failed files:")
        for name, reason in failed:
            logger.warning(f"  - {name}: {reason}")

if __name__ == "__main__":
    main()
