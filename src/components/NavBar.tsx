/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, Menu, X } from "lucide-react";

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className='bg-white shadow-md'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
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
          <div className='hidden sm:ml-6 sm:flex sm:items-center'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/cart'
                className='p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none relative'
              >
                <span className='sr-only'>View cart</span>
                <ShoppingCart className='h-6 w-6' />
                {/* You can add a cart item count badge here */}
              </Link>

              {status === "loading" ? (
                <div className='h-8 w-8 rounded-full bg-gray-200 animate-pulse'></div>
              ) : session ? (
                <div className='relative ml-3'>
                  <div>
                    <button
                      type='button'
                      className='flex rounded-full bg-white text-sm focus:outline-none'
                      id='user-menu-button'
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
                  </div>

                  {isMenuOpen && (
                    <div
                      className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'
                      role='menu'
                      aria-orientation='vertical'
                      aria-labelledby='user-menu-button'
                      tabIndex={-1}
                    >
                      <Link
                        href='/account'
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        role='menuitem'
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your Account
                      </Link>
                      <Link
                        href='/orders'
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        role='menuitem'
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your Orders
                      </Link>
                      <button
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        role='menuitem'
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

          {/* Mobile menu button */}
          <div className='-mr-2 flex items-center sm:hidden'>
            <button
              type='button'
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
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
            <Link
              href='/cart'
              className={`${
                isActive("/cart")
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium items-center`}
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className='h-5 w-5 mr-2' />
              Cart
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
                  href='/orders'
                  className={`${
                    isActive("/orders")
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Your Orders
                </Link>
                <button
                  className='border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left'
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
                className='border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
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
