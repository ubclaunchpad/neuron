'use client';

import clsx from 'clsx';
import { Card } from '../Card';
import { ErrorLine } from './ErrorLine';
import './index.scss';

type RootErrorProps = {
  id?: string;
  message?: React.ReactNode;
  icon?: React.ReactNode | null;
  className?: string;
  lineClassName?: string;
};

export function RootError({
  id = 'form-error',
  message,
  icon,
  className,
  lineClassName
}: RootErrorProps) {
  if (!message) return null;
  return (
    <Card id={id} variant="error" size="small" className={clsx('form-error', className)} role="alert" aria-live="polite">
      <ErrorLine message={message} icon={icon} className={lineClassName} />
    </Card>
  );
}
