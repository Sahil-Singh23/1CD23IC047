export interface LogRequest {
  stack: "frontend" | "backend";
  level: "debug" | "info" | "warn" | "error" | "fatal";
  package:
    | "cache"
    | "controller"
    | "cron_job"
    | "db"
    | "domain"
    | "handler"
    | "repository"
    | "route"
    | "service"
    | "api"
    | "component"
    | "hook"
    | "page"
    | "state"
    | "style"
    | "auth"
    | "config"
    | "middleware"
    | "utils";
  message: string;
  token: string;
}

export interface LogResponse {
  logID: string;
  message: string;
}