// lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db'; // your DB connection
// import bcrypt from 'bcrypt'; // recommended for real usage

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: {
          label: 'Username',
          type: 'text',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        // 1) Find user in the DB by username
        const findUserQuery = `SELECT * FROM users WHERE username = $1`;
        const { rows } = await db.query(findUserQuery, [credentials.username]);
        const user = rows[0];
        if (!user) {
          // User does not exist
          return null;
        }

        // 2) Check password
        // If you have a hashed password in the DB, do:
        // const isValid = await bcrypt.compare(credentials.password, user.password);
        // if (!isValid) return null;

        // For DEMO only (plain-text check – not recommended):
        if (user.password !== credentials.password) {
          return null;
        }

        // 3) Return a user object if valid
        return {
          id: user.id,
          name: user.username,
          groupId: user.groupid
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
      }
      return session;
    },
  },
};
