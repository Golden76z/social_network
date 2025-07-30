'use client';

import { CardProfile } from './ui/cardProfile';

export function TestForm({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={className} {...props}>
      <CardProfile variant={'CardProfileUser'}></CardProfile>
    </div>
  );
}
