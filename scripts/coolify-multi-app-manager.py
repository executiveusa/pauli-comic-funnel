#!/usr/bin/env python3
"""
Coolify Multi-App Manager
Automates deployment of 200+ apps to Coolify with centralized secrets management.
Replaces GoDaddy/external hosting with self-hosted Coolify infrastructure.
"""

import os
import json
import sys
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime
import time

@dataclass
class AppConfig:
    """Configuration for a single app deployment"""
    repo_name: str
    repo_url: str
    branch: str = "main"
    language: Optional[str] = None
    description: Optional[str] = None
    status: str = "pending"  # pending, created, deployed, failed
    service_id: Optional[str] = None
    created_at: Optional[str] = None
    error: Optional[str] = None

class CoolifyMultiAppManager:
    """Manages deployment of multiple apps to Coolify"""
    
    def __init__(self, coolify_url: str, coolify_token: str, github_token: str):
        self.coolify_url = coolify_url
        self.coolify_token = coolify_token
        self.github_token = github_token
        self.apps_config: Dict[str, AppConfig] = {}
        self.secrets_vault: Dict[str, str] = {}
        
    def load_secrets_from_file(self, secrets_file: str) -> None:
        """Load secrets from a central secrets.json file"""
        if not Path(secrets_file).exists():
            print(f"⚠️  Secrets file not found: {secrets_file}")
            return
        
        with open(secrets_file, 'r') as f:
            self.secrets_vault = json.load(f)
        print(f"✅ Loaded {len(self.secrets_vault)} secrets from {secrets_file}")
    
    def save_secrets(self, secrets_file: str) -> None:
        """Save secrets to a central vault"""
        Path(secrets_file).parent.mkdir(parents=True, exist_ok=True)
        with open(secrets_file, 'w') as f:
            json.dump(self.secrets_vault, f, indent=2)
        print(f"✅ Secrets saved to {secrets_file}")
    
    def add_secret(self, key: str, value: str) -> None:
        """Add or update a secret in the vault"""
        self.secrets_vault[key] = value
        print(f"✅ Secret '{key}' added to vault")
    
    def scan_github_org(self, org: str, per_page: int = 100) -> List[Dict]:
        """Scan GitHub organization for all repositories"""
        headers = {
            "Authorization": f"Bearer {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        all_repos = []
        page = 1
        
        while True:
            url = f"https://api.github.com/orgs/{org}/repos?per_page={per_page}&page={page}&type=owner"
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"❌ Failed to fetch repos: {response.status_code}")
                break
            
            repos = response.json()
            if not repos:
                break
            
            all_repos.extend(repos)
            page += 1
        
        print(f"✅ Found {len(all_repos)} repositories in organization '{org}'")
        return all_repos
    
    def create_app_config(self, repo: Dict) -> AppConfig:
        """Create AppConfig from GitHub repo data"""
        repo_name = repo['name']
        repo_url = repo['clone_url']
        language = repo.get('language', 'unknown')
        description = repo.get('description', '')
        
        config = AppConfig(
            repo_name=repo_name,
            repo_url=repo_url,
            language=language,
            description=description
        )
        return config
    
    def create_coolify_service(self, app: AppConfig, domain_suffix: str = ".srv1099662.hstgr.cloud") -> bool:
        """Create a service in Coolify for an app"""
        
        # Build service configuration
        service_config = {
            "name": app.repo_name,
            "description": app.description or f"Auto-deployed from {app.repo_name}",
            "source": {
                "type": "github",
                "repository": app.repo_url,
                "branch": app.branch,
            },
            "ports": {
                "http": 3000,
                "https": 443
            },
            "domains": [f"{app.repo_name}{domain_suffix}"],
            "environment_variables": self._get_env_vars_for_app(app.repo_name),
            "auto_deploy": True,  # Deploy on push to main
            "webhook": True,  # Enable GitHub webhook
        }
        
        headers = {
            "Authorization": f"Bearer {self.coolify_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{self.coolify_url}/api/v1/services",
                json=service_config,
                headers=headers,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                app.service_id = result.get('id')
                app.status = "created"
                app.created_at = datetime.now().isoformat()
                print(f"✅ Created service for {app.repo_name} (ID: {app.service_id})")
                return True
            else:
                app.status = "failed"
                app.error = f"HTTP {response.status_code}: {response.text}"
                print(f"❌ Failed to create service for {app.repo_name}: {response.status_code}")
                return False
        except Exception as e:
            app.status = "failed"
            app.error = str(e)
            print(f"❌ Error creating service for {app.repo_name}: {e}")
            return False
    
    def deploy_service(self, app: AppConfig) -> bool:
        """Trigger deployment for a service"""
        if not app.service_id:
            print(f"❌ No service ID for {app.repo_name}")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.coolify_token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(
                f"{self.coolify_url}/api/v1/services/{app.service_id}/deploy",
                json={},
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                app.status = "deployed"
                print(f"✅ Deployment triggered for {app.repo_name}")
                return True
            else:
                print(f"❌ Failed to deploy {app.repo_name}: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error deploying {app.repo_name}: {e}")
            return False
    
    def _get_env_vars_for_app(self, app_name: str) -> Dict[str, str]:
        """Get environment variables for an app (from secrets vault or defaults)"""
        env_vars = {}
        
        # Add global secrets to all apps
        for key, value in self.secrets_vault.items():
            env_vars[key] = value
        
        # Add app-specific overrides if they exist
        app_specific_key = f"{app_name.upper()}_ENV"
        if app_specific_key in self.secrets_vault:
            env_vars.update(json.loads(self.secrets_vault[app_specific_key]))
        
        return env_vars
    
    def sync_secrets_to_all_services(self) -> int:
        """Update environment variables for all deployed services"""
        count = 0
        headers = {
            "Authorization": f"Bearer {self.coolify_token}",
            "Content-Type": "application/json"
        }
        
        for app in self.apps_config.values():
            if not app.service_id:
                continue
            
            env_vars = self._get_env_vars_for_app(app.repo_name)
            update_payload = {"environment_variables": env_vars}
            
            try:
                response = requests.patch(
                    f"{self.coolify_url}/api/v1/services/{app.service_id}",
                    json=update_payload,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    count += 1
                    print(f"✅ Synced secrets to {app.repo_name}")
            except Exception as e:
                print(f"❌ Failed to sync secrets to {app.repo_name}: {e}")
        
        return count
    
    def bulk_import_repos(self, org: str, skip_existing: bool = True) -> int:
        """Bulk import all repos from GitHub org into Coolify"""
        print(f"\n📦 Starting bulk import of {org} repositories...\n")
        
        repos = self.scan_github_org(org)
        created_count = 0
        
        for repo in repos:
            app = self.create_app_config(repo)
            self.apps_config[app.repo_name] = app
            
            # Create service in Coolify
            if self.create_coolify_service(app):
                created_count += 1
                time.sleep(1)  # Rate limiting
        
        print(f"\n✅ Bulk import complete: {created_count} services created")
        return created_count
    
    def deploy_all(self) -> int:
        """Deploy all services in Coolify"""
        print(f"\n🚀 Deploying all {len(self.apps_config)} services...\n")
        
        deployed_count = 0
        for app in self.apps_config.values():
            if self.deploy_service(app):
                deployed_count += 1
                time.sleep(2)  # Rate limiting
        
        print(f"\n✅ Deployment complete: {deployed_count}/{len(self.apps_config)} services deployed")
        return deployed_count
    
    def save_inventory(self, output_file: str) -> None:
        """Save app inventory to JSON for reference"""
        inventory = {
            "timestamp": datetime.now().isoformat(),
            "total_apps": len(self.apps_config),
            "apps": [asdict(app) for app in self.apps_config.values()]
        }
        
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(inventory, f, indent=2)
        
        print(f"✅ Inventory saved to {output_file}")
    
    def get_status_report(self) -> Dict:
        """Generate a status report of all apps"""
        statuses = {}
        for app in self.apps_config.values():
            if app.status not in statuses:
                statuses[app.status] = 0
            statuses[app.status] += 1
        
        return {
            "total_apps": len(self.apps_config),
            "statuses": statuses,
            "timestamp": datetime.now().isoformat()
        }


def main():
    """Main execution"""
    
    # Configuration - load from environment variables (no defaults for secrets)
    COOLIFY_URL = os.getenv("COOLIFY_URL", "http://31.220.58.212:8000")
    COOLIFY_TOKEN = os.getenv("COOLIFY_API_TOKEN")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    GITHUB_ORG = os.getenv("GITHUB_ORG", "executiveusa")
    
    if not COOLIFY_TOKEN or not GITHUB_TOKEN:
        print("ERROR: Required environment variables not set")
        print("Required: COOLIFY_API_TOKEN, GITHUB_TOKEN")
        sys.exit(1)
    SECRETS_FILE = "config/secrets.json"
    INVENTORY_FILE = "config/app-inventory.json"
    
    # Initialize manager
    manager = CoolifyMultiAppManager(COOLIFY_URL, COOLIFY_TOKEN, GITHUB_TOKEN)
    
    # Example: Load or create secrets
    if not Path(SECRETS_FILE).exists():
        print("📝 Creating initial secrets vault...")
        manager.add_secret("ANTHROPIC_API_KEY", "sk-ant-api03-...")
        manager.add_secret("OPENAI_API_KEY", "sk-proj-...")
        manager.add_secret("STRIPE_KEY", "sk_live_...")
        manager.add_secret("NODE_ENV", "production")
        manager.save_secrets(SECRETS_FILE)
    else:
        manager.load_secrets_from_file(SECRETS_FILE)
    
    # Bulk import all repos
    manager.bulk_import_repos(GITHUB_ORG)
    
    # Deploy all (optional - comment out to skip auto-deploy)
    # manager.deploy_all()
    
    # Sync secrets to all services
    # manager.sync_secrets_to_all_services()
    
    # Save inventory
    manager.save_inventory(INVENTORY_FILE)
    
    # Print status
    report = manager.get_status_report()
    print(f"\n📊 STATUS REPORT:")
    print(json.dumps(report, indent=2))
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
