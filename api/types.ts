import { VercelRequest, VercelResponse } from '@vercel/node';

export interface GitHubRepo {
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  stargazers_count: number;
  size?: number;
}

export interface GitHubUser {
  login: string;
  public_repos: number;
}

export interface GitHubEvent {
  type: string;
  repo?: {
    name: string;
  };
  payload?: {
    action?: string;
  };
}

export interface LanguageData {
  [language: string]: number;
}

export { VercelRequest, VercelResponse };

