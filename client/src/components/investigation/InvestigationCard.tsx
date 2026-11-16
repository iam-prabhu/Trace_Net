import React from 'react';
import { Investigation } from '../../types/investigation.types';
import { Badge } from '../common/Badge';
import { timeAgo } from '../../utils/format';

interface InvestigationCardProps {
  investigation: Investigation;
  onClick?: () => void;
}

export function InvestigationCard({ investigation, onClick }: InvestigationCardProps) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-gray-900">{investigation.title}</h3>
        <Badge variant={investigation.status as any}>{investigation.status.replace('_', ' ')}</Badge>
      </div>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{investigation.description}</p>
      <p className="text-xs text-gray-400 mt-2">{timeAgo(investigation.updatedAt)}</p>
    </div>
  );
}
