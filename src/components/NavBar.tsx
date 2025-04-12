/* eslint-disable @next/next/no-img-element */
// src/components/NavBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useCart } from "@/providers/CartProvider";

export default function NavBar() {
  // NextAuth session
  const { data: session, status } = useSession();
  // Current route path
  const pathname = usePathname();
  // Mobile menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Read cartCount from global context
  const { cartCount } = useCart();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className='bg-white shadow-md'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Top-level container */}
        <div className='flex justify-between h-16'>
          {/* Left side: Logo + Nav */}
          <div className='flex'>
            <div className='flex-shrink-0 flex items-center'>
              <Link href='/' className='text-xl font-bold text-gray-900'>
                Your Store
              </Link>
            </div>
            <div className='hidden sm:ml-6 sm:flex sm:space-x-8'>
              <Link
                href='/'
                className={`${
                  isActive("/")
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              <Link
                href='/products'
                className={`${
                  isActive("/products")
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Shop
              </Link>
            </div>
          </div>

          {/* Right side: Cart + User */}
          <div className='hidden sm:ml-6 sm:flex sm:items-center'>
            <div className='flex items-center space-x-4'>
              {/* Cart Icon + Badge */}
              <div className='relative'>
                <Link
                  href='/cart'
                  className='p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none relative'
                >
                  <span className='sr-only'>View cart</span>
                  <ShoppingCart className='h-6 w-6' />
                  {cartCount > 0 && (
                    <span
                      className='absolute top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center'
                      style={{ fontSize: "0.75rem" }}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {status === "loading" ? (
                <div className='h-8 w-8 rounded-full bg-gray-200 animate-pulse' />
              ) : session ? (
                /* Logged in user menu */
                <div className='relative ml-3'>
                  <button
                    type='button'
                    className='flex rounded-full bg-white text-sm focus:outline-none'
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    <span className='sr-only'>Open user menu</span>
                    {session.user?.image ? (
                      <img
                        className='h-8 w-8 rounded-full'
                        src={session.user.image}
                        alt={session.user.name || "User"}
                      />
                    ) : (
                      <div className='h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white'>
                        {(
                          session.user?.name?.charAt(0) ||
                          session.user?.email?.charAt(0) ||
                          "U"
                        ).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {isMenuOpen && (
                    <div
                      className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'
                      role='menu'
                    >
                      <Link
                        href='/account'
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your Account
                      </Link>
                      <Link
                        href='/account/orders'
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your Orders
                      </Link>
                      {/* Admin link - only visible to admin */}
                      {session.user?.role === "ADMIN" && (
                        <Link
                          href='/admin'
                          className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Logged out */
                <Link
                  href='/auth/signin'
                  className='text-gray-600 hover:text-gray-900 flex items-center space-x-1'
                >
                  <User className='h-5 w-5' />
                  <span>Sign in</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu toggle button */}
          <div className='-mr-2 flex items-center sm:hidden'>
            <button
              type='button'
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 
                         hover:text-gray-500 hover:bg-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
              aria-controls='mobile-menu'
              aria-expanded='false'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className='sr-only'>Open main menu</span>
              {isMenuOpen ? (
                <X className='block h-6 w-6' />
              ) : (
                <Menu className='block h-6 w-6' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className='sm:hidden' id='mobile-menu'>
          <div className='space-y-1 pt-2 pb-3'>
            <Link
              href='/'
              className={`${
                isActive("/")
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href='/products'
              className={`${
                isActive("/products")
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Shop
            </Link>

            {/* Mobile Cart Link + Badge */}
            <Link
              href='/cart'
              className={`${
                isActive("/cart")
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium items-center`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className='flex items-center'>
                <ShoppingCart className='h-5 w-5 mr-2' />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span
                    className='ml-2 inline-block bg-red-500 text-white text-xs w-5 h-5 rounded-full text-center'
                    style={{ fontSize: "0.75rem", lineHeight: "1.2rem" }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
            </Link>

            {session ? (
              <>
                <Link
                  href='/account'
                  className={`${
                    isActive("/account")
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Account
                </Link>
                <Link
                  href='/account/orders'
                  className={`${
                    isActive("/account/orders")
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Orders
                </Link>
                {/* Admin link in mobile menu - only visible to admin */}
                {session.user?.role === "ADMIN" && (
                  <Link
                    href='/admin'
                    className={`${
                      isActive("/admin")
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  className='border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 
                             block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left'
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href='/auth/signin'
                className='border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 
                           block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                onClick={() => setIsMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
