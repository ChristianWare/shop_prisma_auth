/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
//   const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
        <h1 className='text-2xl font-bold mb-6'>Invalid Reset Link</h1>
        <p className='mb-6'>
          The password reset link is invalid or has expired. Please request a
          new password reset.
        </p>
        <Link
          href='/auth/forgot-password'
          className='block text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700'
        >
          Request Password Reset
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Password reset failed");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
        <h1 className='text-2xl font-bold mb-4'>Password Reset Successful</h1>
        <p className='mb-6'>
          Your password has been successfully reset. You can now sign in with
          your new password.
        </p>
        <Link
          href='/auth/signin'
          className='block text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700'
        >
          Sign In
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='mb-4'>
          <label
            className='block text-gray-700 text-sm font-bold mb-2'
            htmlFor='password'
          >
            New Password
          </label>
          <input
            id='password'
            type='password'
            {...register("password")}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg'
          />
          {errors.password && (
            <p className='text-red-500 text-xs mt-1'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className='mb-6'>
          <label
            className='block text-gray-700 text-sm font-bold mb-2'
            htmlFor='confirmPassword'
          >
            Confirm New Password
          </label>
          <input
            id='confirmPassword'
            type='password'
            {...register("confirmPassword")}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg'
          />
          {errors.confirmPassword && (
            <p className='text-red-500 text-xs mt-1'>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400'
        >
          {isLoading ? "Resetting Password..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
