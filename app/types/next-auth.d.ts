import "next-auth";
import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Profile {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      isPasswordSet: boolean;
      // Added new split name types
      firstName?: string | null;
      lastName?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    isPasswordSet: boolean;
    // Added for authorize() and database mapping
    firstName?: string | null;
    lastName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isPasswordSet: boolean;
    // Added to ensure the token persists the split names
    firstName?: string | null;
    lastName?: string | null;
  }
}
