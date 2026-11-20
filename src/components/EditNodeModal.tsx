import React, { useState } from 'react';
import { X, Crown, Trash2, MapPin } from 'lucide-react';
import type { GraphNode } from '../types/graph';

interface EditNodeModalProps {
  node: GraphNode;
  onClose: () => void;
  onToggleHub: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNodeLabel: (nodeId: string, label: string) => void;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({
  node,
  onClose,
  onToggleHub,
  onDeleteNode,
  onUpdateNodeLabel,
}) => {
  const [label, setLabel] = useState(node.label);

  const handleSave = () => {
    onUpdateNodeLabel(node.id, label);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-mono font-bold">
              {node.id}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configure Stop {node.id}</h3>
              <p className="text-xs text-slate-500 font-sans">
                {node.isHub ? 'Central Warehouse Hub' : 'Delivery Stop'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Stop Label / Name:</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Academic Block A"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                onToggleHub(node.id);
                onClose();
              }}
              className={`w-full py-2.5 px-3 rounded-lg border font-semibold flex items-center justify-center space-x-2 transition-colors ${
                node.isHub
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                  : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>{node.isHub ? 'Current Hub (W)' : 'Set as Starting Hub (W)'}</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onDeleteNode(node.id);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Stop</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
