import React from 'react';
import { Finding } from '../../types/investigation.types';
import { Badge } from '../common/Badge';

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-gray-900">{finding.title}</h4>
        <div className="flex gap-2">
          <Badge variant={finding.severity as any}>{finding.severity}</Badge>
          <Badge variant={finding.status as any}>{finding.status}</Badge>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-1">{finding.description}</p>
    </div>
  );
}
