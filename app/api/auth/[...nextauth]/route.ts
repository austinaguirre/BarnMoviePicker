// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// Exporting POST, GET allows NextAuth to handle them
export { handler as GET, handler as POST };
