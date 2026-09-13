/**
 * MCP INTEGRATION - Extended Tool Capabilities
 *
 * Integrates Model Context Protocol apps for:
 * - GitHub repository access
 * - File system browsing
 * - Project context retrieval
 */

import axios from 'axios';

interface GitHubProject {
  name: string;
  url: string;
  description: string;
  status: string;
}

export class MCPIntegration {
  private githubToken: string;
  private githubApi = 'https://api.github.com';

  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN || '';
  }

  async listGitHubProjects(): Promise<GitHubProject[]> {
    try {
      const response = await axios.get(`${this.githubApi}/user/repos`, {
        headers: { Authorization: `token ${this.githubToken}` }
      });

      return response.data.map((repo: any) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        status: repo.archived ? 'archived' : 'active'
      }));
    } catch (error) {
      console.error('Failed to fetch GitHub projects:', error);
      return [];
    }
  }

  async getProjectDetails(owner: string, repo: string) {
    try {
      const response = await axios.get(
        `${this.githubApi}/repos/${owner}/${repo}`,
        { headers: { Authorization: `token ${this.githubToken}` } }
      );

      return {
        name: response.data.name,
        description: response.data.description,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        issues: response.data.open_issues_count,
        language: response.data.language,
        lastUpdated: response.data.updated_at,
        url: response.data.html_url
      };
    } catch (error) {
      throw new Error(`Failed to fetch project details: ${error}`);
    }
  }

  async listIssues(owner: string, repo: string) {
    try {
      const response = await axios.get(
        `${this.githubApi}/repos/${owner}/${repo}/issues`,
        { headers: { Authorization: `token ${this.githubToken}` } }
      );

      return response.data.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        assignee: issue.assignee?.login,
        created: issue.created_at
      }));
    } catch (error) {
      throw new Error(`Failed to list issues: ${error}`);
    }
  }

  async createIssue(owner: string, repo: string, title: string, body: string) {
    try {
      const response = await axios.post(
        `${this.githubApi}/repos/${owner}/${repo}/issues`,
        { title, body },
        { headers: { Authorization: `token ${this.githubToken}` } }
      );

      return {
        number: response.data.number,
        url: response.data.html_url,
        created: response.data.created_at
      };
    } catch (error) {
      throw new Error(`Failed to create issue: ${error}`);
    }
  }

  // File system tool (for local exports)
  async readFile(filePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      return await fs.readdir(dirPath);
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`);
    }
  }
}
