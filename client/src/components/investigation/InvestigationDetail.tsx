import React from 'react';
import { Investigation } from '../../types/investigation.types';

export function InvestigationDetail({ investigation }: { investigation: Investigation }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{investigation.title}</h2>
      <p className="text-gray-600 mt-2">{investigation.description}</p>
      {/* TODO: graph, notes, findings, timeline, collaborators */}
    </div>
  );
}
