// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ExclamationTriangleIcon
            className="h-10 w-10 text-red-600"
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          404
        </h1>
        <p className="mt-4 text-xl font-semibold text-gray-700">
          Page Not Found
        </p>
        <p className="mt-2 text-base text-gray-500">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;