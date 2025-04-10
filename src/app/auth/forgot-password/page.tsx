"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send reset email");
      }

      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
        <h1 className='text-2xl font-bold mb-4'>Check Your Email</h1>
        <p className='mb-6'>
          If an account exists for {email}, we&apos;ve sent an email with
          instructions to reset your password.
        </p>
        <Link
          href='/auth/signin'
          className='block text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700'
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
      <h1 className='text-2xl font-bold mb-6'>Reset Your Password</h1>

      {error && (
        <div className='bg-red-100 text-red-700 p-3 rounded mb-4'>{error}</div>
      )}

      <p className='mb-4'>
        Enter your email address and we&apos;ll send you instructions to reset
        your password.
      </p>

      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label
            className='block text-gray-700 text-sm font-bold mb-2'
            htmlFor='email'
          >
            Email
          </label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg'
            required
          />
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400'
        >
          {isLoading ? "Sending..." : "Send Reset Instructions"}
        </button>
      </form>

      <div className='mt-6 text-center'>
        <p className='text-gray-600'>
          Remembered your password?{" "}
          <Link href='/auth/signin' className='text-blue-600 hover:underline'>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
