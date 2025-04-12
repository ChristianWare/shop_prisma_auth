/* eslint-disable @typescript-eslint/no-unused-vars */
// src/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

const prisma = new PrismaClient();

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Use your exact environment variable names
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // "credentials" is typed loosely by default, so we do:
        if (!credentials) return null;

        // Cast them to known strings:
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        // Basic null/empty checks
        if (!email || !password) return null;

        // Look up user by email in DB
        const user = await prisma.user.findUnique({
          where: { email }, // TS now knows "email" is a string
        });
        if (!user || !user.password) {
          return null;
        }

        // Compare the supplied password to the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        // Return the user object that ends up in the token
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Add role to token if it exists in user
        token.role = user.role;
      }
      // If token doesn't have role, fetch it from database
      if (token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // Add role to session
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  // Use JWT sessions (common with CredentialsProvider)
  session: {
    strategy: "jwt",
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
