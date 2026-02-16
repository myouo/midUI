import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTestCasesStore } from '../store/test-cases';
import { Trash2, Plus } from 'lucide-react';

const TestCaseItem = memo(({ 
  tc, 
  isSelected, 
  isEditing, 
  editingName,
  onSelect, 
  onDoubleClick, 
  onDelete,
  onNameChange,
  onNameBlur,
  onNameKeyDown
}: {
  tc: any;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDelete: () => void;
  onNameChange: (v: string) => void;
  onNameBlur: () => void;
  onNameKeyDown: (e: React.KeyboardEvent) => void;
}) => {
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className={`group relative flex items-center px-3 py-3 rounded-lg cursor-pointer ${
        isSelected ? 'bg-indigo-100 shadow-sm' : 'hover:bg-slate-100'
      }`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={editInputRef}
            value={editingName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            onKeyDown={onNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm"
          />
        ) : (
          <div className="font-medium text-slate-800 truncate">{tc.name}</div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
});

TestCaseItem.displayName = 'TestCaseItem';

export const TestCaseList = () => {
  const { list, selectedTestCase, fetchTestCases, createTestCase, deleteTestCase, updateTestCase, setSelectedTestCase } = useTestCasesStore();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchTestCases();
  }, []);

  const handleCreateNew = useCallback(async () => {
    const newTC = await createTestCase({ name: '未命名用例', baseUrl: 'https://www.baidu.com', steps: [] });
    if (newTC !== undefined) {
      setSelectedTestCase(newTC);
      navigate('/flow');
    }
  }, [createTestCase, setSelectedTestCase, navigate]);

  const handleDeleteClick = useCallback(async (id: string) => {
    await deleteTestCase(id);
  }, [deleteTestCase]);

  const handleSelect = useCallback((tc: any) => {
    setSelectedTestCase(tc);
    navigate('/flow');
  }, [setSelectedTestCase, navigate]);

  const handleDoubleClick = useCallback((tc: any) => {
    setEditingId(tc.id);
    setEditingName(tc.name);
  }, []);

  const handleNameChange = useCallback((value: string) => {
    setEditingName(value);
  }, []);

  const handleNameBlur = useCallback(async () => {
    if (editingId && editingName.trim()) {
      await updateTestCase(editingId, { name: editingName.trim() });
    }
    setEditingId(null);
    setEditingName('');
  }, [editingId, editingName, updateTestCase]);

  const handleNameKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  }, [handleNameBlur]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <Button
          onClick={handleCreateNew}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建用例
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8">暂无测试用例</div>
        ) : (
          <div className="space-y-1">
            {list.map((tc) => (
              <TestCaseItem
                key={tc.id}
                tc={tc}
                isSelected={selectedTestCase?.id === tc.id}
                isEditing={editingId === tc.id}
                editingName={editingName}
                onSelect={() => handleSelect(tc)}
                onDoubleClick={() => handleDoubleClick(tc)}
                onDelete={() => handleDeleteClick(tc.id)}
                onNameChange={handleNameChange}
                onNameBlur={handleNameBlur}
                onNameKeyDown={handleNameKeyDown}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCaseList;
