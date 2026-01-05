#!/usr/bin/env python3
"""
Live URL Monitor - Shows all working deployed apps in real-time
"""
import json
import requests
import sys
from collections import Counter
from datetime import datetime
import time

COOLIFY_API = "http://31.220.58.212:8000/api/v1"
COOLIFY_TOKEN = "3|BiVHECItXMwX4dhaltCLyKbWS0RkxzgRRPsn6dFY450b6881"

headers = {"Authorization": f"Bearer {COOLIFY_TOKEN}"}

def get_status():
    """Get current deployment and app status"""
    try:
        apps = requests.get(f"{COOLIFY_API}/applications", headers=headers, timeout=10).json()
        deployments = requests.get(f"{COOLIFY_API}/deployments", headers=headers, timeout=10).json()
        
        # Parse deployments
        if isinstance(deployments, dict):
            dep_list = list(deployments.values())
        else:
            dep_list = deployments
        
        # Count statuses
        dep_statuses = Counter([d['status'] for d in dep_list])
        app_statuses = Counter([a['status'] for a in apps])
        
        # Get running apps
        running = [a for a in apps if 'running' in a['status']]
        
        return {
            'apps': apps,
            'running': running,
            'deployments': dep_statuses,
            'app_statuses': app_statuses,
            'total_apps': len(apps)
        }
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print("\n" + "="*70)
    print("LIVE DEPLOYMENT STATUS".center(70))
    print("="*70)
    
    iteration = 0
    last_running_count = 0
    
    try:
        while True:
            iteration += 1
            status = get_status()
            
            if not status:
                time.sleep(10)
                continue
            
            # Print every iteration or when something changes
            queued = status['deployments'].get('queued', 0)
            building = status['deployments'].get('in_progress', 0)
            finished = status['deployments'].get('finished', 0)
            running_count = len(status['running'])
            
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            print(f"\n[{timestamp}] Progress: {finished + running_count}/95 deployed", end="")
            print(f" | Building: {building} | Queued: {queued}")
            
            # Show newly working apps
            if running_count > last_running_count:
                print(f"\n  🎉 NEW APPS ONLINE ({running_count} total):")
                for app in sorted(status['running'], key=lambda x: x['name']):
                    print(f"     → {app['fqdn']}")
            
            last_running_count = running_count
            
            # Check if done
            if queued == 0 and building == 0:
                print(f"\n{'='*70}")
                print(f"  ✓ ALL DEPLOYMENTS COMPLETE - {running_count} APPS LIVE".center(70))
                print(f"{'='*70}\n")
                
                print("WORKING APPS:\n")
                for app in sorted(status['running'], key=lambda x: x['name']):
                    print(f"  {app['fqdn']}")
                print()
                break
            
            time.sleep(30)  # Check every 30 seconds
            
    except KeyboardInterrupt:
        print("\n\nMonitor stopped.")
        print(f"\nCurrent status: {running_count} apps live, {queued} queued")

if __name__ == "__main__":
    main()
