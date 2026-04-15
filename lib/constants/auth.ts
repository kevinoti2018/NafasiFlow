/**
 * CORE ENUMS
 * Shared between Prisma Schema and Frontend UI
 */

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum CVSource {
  upload = "upload",
  optimized = "optimized",
  generated = "generated",
}

export enum TemplateType {
  pdf = "pdf",
  docx = "docx",
}

export enum ApplicationStatus {
  saved = "saved",
  applied = "applied",
  interviewing = "interviewing",
  rejected = "rejected",
  offered = "offered",
}

/**
 * SYSTEM & COMMUNICATION ENUMS
 */

export enum EmailType {
  WELCOME = "WELCOME",
  PASSWORD_RESET = "PASSWORD_RESET",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  ACCOUNT_DELETION = "ACCOUNT_DELETION",
  SECURITY_ALERT = "SECURITY_ALERT",
  MARKETING = "MARKETING",
}

export enum EmailStatus {
  QUEUED = "QUEUED",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  OPENED = "OPENED",
  PENDING = "PENDING",
}
