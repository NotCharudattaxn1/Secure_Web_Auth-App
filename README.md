# Secure Authentication Web App

A modern, highly secure authentication application built with **Next.js 16**, **Tailwind CSS**, and **Neon Serverless Postgres**.

## Features
- **Secure Authentication**: End-to-end credential protection using `bcrypt` for password hashing and stateless `jose` JWT HttpOnly cookies for session management.
- **Protection Measures**: Built-in mitigations for SQL Injection, Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), timing attacks, and brute-force guessing.
- **Admin Dashboard**: Secure lookup panels allowing admins to view user metadata safely without exposing password hashes.
- **Serverless Postgres**: Utlilizes the `@neondatabase/serverless` fetch driver for instant, low-latency database queries.

## Local Development Setup

To test this application locally, you must connect it to a Neon Postgres database.

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your Neon Database connection string:
   ```env
   DATABASE_URL="postgresql://user:password@your-neon-host.aws.neon.tech/neondb?sslmode=require"
   # Make sure to also add any session secrets if your session lib requires it
   SESSION_SECRET="your-super-secret-key-at-least-32-chars-long"
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛠 Troubleshooting: Network \& Database Errors

If you encounter a `503 Service Unavailable` error that looks like this:
> *"Cannot reach the database. If you are testing this locally, please configure DATABASE_URL in .env.local and check your firewall/network proxy."*

**Here is why this happens:**
The `@neondatabase/serverless` driver uses Node's standard `fetch` over port `443`. If you are connected to a restrictive Wi-Fi network (like a university, school, or corporate network) or if your Windows Defender Firewall is set to "Public Network", the system literally drops Node's outbound traffic. 

**How to fix it:**
1. **Windows Firewall**: Go to network settings and make sure your current Wi-Fi connection profile is set to "Private" rather than "Public".
2. **Proxy Bypass**: If you are on an institutional network proxy, standard terminals (like `curl`) might bypass it, but `Node.js` won't. You'll need to use a VPN, connect to a mobile hotspot, or configure Node proxy variables within your environment.
3. **Database URL**: Just double-check that your `.env.local` file has the exact connection string copied from your Neon console.

