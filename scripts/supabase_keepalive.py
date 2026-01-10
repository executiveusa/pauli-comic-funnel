#!/usr/bin/env python3
"""
Supabase Keepalive Script for The Pauli Effect
Pings Supabase every 3 days to prevent free tier project from pausing.
Runs as a background task in the backend container.
"""

import os
import time
import logging
import threading
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('supabase_keepalive')

# Configuration
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://nfhejlqgvghzafrnmpsl.supabase.co')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
PING_INTERVAL_DAYS = 3
PING_INTERVAL_SECONDS = PING_INTERVAL_DAYS * 24 * 60 * 60  # 3 days in seconds


def ping_supabase() -> bool:
    """
    Ping Supabase REST API to keep the project active.
    Returns True if successful, False otherwise.
    """
    import urllib.request
    import urllib.error
    
    try:
        # Ping the REST API health endpoint
        url = f"{SUPABASE_URL}/rest/v1/"
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
        }
        
        request = urllib.request.Request(url, headers=headers, method='GET')
        
        with urllib.request.urlopen(request, timeout=30) as response:
            status = response.status
            logger.info(f"✅ Supabase ping successful - Status: {status} at {datetime.now().isoformat()}")
            return True
            
    except urllib.error.HTTPError as e:
        # Even a 400/401 means the project is active
        logger.info(f"✅ Supabase is active (HTTP {e.code}) at {datetime.now().isoformat()}")
        return True
    except urllib.error.URLError as e:
        logger.error(f"❌ Supabase ping failed: {e.reason}")
        return False
    except Exception as e:
        logger.error(f"❌ Supabase ping error: {str(e)}")
        return False


def keepalive_loop():
    """
    Main keepalive loop that runs indefinitely.
    Pings Supabase every PING_INTERVAL_SECONDS.
    """
    logger.info(f"🚀 Starting Supabase keepalive - Ping interval: {PING_INTERVAL_DAYS} days")
    logger.info(f"📍 Supabase URL: {SUPABASE_URL}")
    
    # Initial ping on startup
    ping_supabase()
    
    while True:
        try:
            # Sleep for the interval
            time.sleep(PING_INTERVAL_SECONDS)
            
            # Ping Supabase
            success = ping_supabase()
            
            if not success:
                # Retry after 1 hour if failed
                logger.warning("⚠️ Ping failed, retrying in 1 hour...")
                time.sleep(3600)
                ping_supabase()
                
        except KeyboardInterrupt:
            logger.info("🛑 Keepalive stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Keepalive loop error: {str(e)}")
            # Wait 1 hour before retrying on error
            time.sleep(3600)


def start_keepalive_background():
    """
    Start the keepalive loop in a background thread.
    Call this from the main application to run keepalive non-blocking.
    """
    thread = threading.Thread(target=keepalive_loop, daemon=True)
    thread.start()
    logger.info("🔄 Keepalive background thread started")
    return thread


# For standalone execution
if __name__ == "__main__":
    # When run directly, execute the keepalive loop
    keepalive_loop()
