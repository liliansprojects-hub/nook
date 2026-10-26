import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="surface w-full max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand-ink">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
        <h1 className="mt-5 font-heading text-2xl font-medium">access restricted</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          you are not registered for this app. ask the app administrator for access.
        </p>
        <div className="mt-6 rounded-[1.4rem] bg-secondary/60 p-4 text-left text-[12px] text-muted-foreground">
          <p>if you think this is a mistake, you can:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>check you are logged in with the right account</li>
            <li>ask the administrator to invite you</li>
            <li>log out and back in again</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;