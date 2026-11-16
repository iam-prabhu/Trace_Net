import React from 'react';
import { Investigation } from '../../types/investigation.types';
import { InvestigationCard } from './InvestigationCard';
import { EmptyState } from '../common/EmptyState';

interface InvestigationListProps {
  investigations: Investigation[];
  onSelect?: (id: string) => void;
}

export function InvestigationList({ investigations, onSelect }: InvestigationListProps) {
  if (!investigations.length) return <EmptyState title="No investigations" description="Create one to get started" />;
  return (
    <div className="space-y-3">
      {investigations.map(inv => (
        <InvestigationCard key={inv.id} investigation={inv} onClick={() => onSelect?.(inv.id)} />
      ))}
    </div>
  );
}
