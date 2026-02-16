import { useState } from 'react';

interface ExecutionStatus {
  status: 'idle' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  reportPath?: string;
}

interface RunTestButtonProps {
  testCaseId: string;
  onExecutionComplete?: (result: ExecutionStatus) => void;
}

export const RunTestButton = ({ testCaseId, onExecutionComplete }: RunTestButtonProps) => {
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>({ status: 'idle' });

  const handleRun = async () => {
    setExecutionStatus({ status: 'running' });

    try {
      const response = await fetch(`http://localhost:3001/api/test-cases/${testCaseId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const newStatus: ExecutionStatus = {
        status: result.status === 'passed' ? 'passed' : 'failed',
        duration: result.duration,
        error: result.error,
        reportPath: result.reportPath,
      };

      setExecutionStatus(newStatus);
      onExecutionComplete?.(newStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('执行测试失败:', error);

      const newStatus: ExecutionStatus = {
        status: 'failed',
        error: errorMessage,
      };

      setExecutionStatus(newStatus);
      onExecutionComplete?.(newStatus);
    }
  };

  const isRunning = executionStatus.status === 'running';
  const isCompleted = executionStatus.status === 'passed' || executionStatus.status === 'failed';

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRun}
        disabled={isRunning}
        className={`
          px-6 py-2 font-medium rounded-lg shadow-md
          flex items-center gap-2 justify-center min-w-[120px]
          ${
            isRunning
              ? 'bg-slate-400 cursor-not-allowed'
              : isCompleted && executionStatus.status === 'passed'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : isCompleted && executionStatus.status === 'failed'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
          }
        `}
      >
        {isRunning ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>执行中...</span>
          </>
        ) : isCompleted ? (
          <span>{executionStatus.status === 'passed' ? '✓ 成功' : '✗ 失败'}</span>
        ) : (
          <span>运行测试</span>
        )}
      </button>

      {isCompleted && (
        <div
          className={`
            text-sm p-3 rounded-lg border
            ${executionStatus.status === 'passed'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'}
          `}
        >
          {executionStatus.duration && (
            <div className="flex items-center gap-2">
              <span className="font-medium">耗时:</span>
              <span>{(executionStatus.duration / 1000).toFixed(2)} 秒</span>
            </div>
          )}

          {executionStatus.error && (
            <div className="flex items-start gap-2">
              <span className="font-medium">错误:</span>
              <span className="break-words flex-1">{executionStatus.error}</span>
            </div>
          )}

          {executionStatus.reportPath && (
            <div className="mt-2">
              <a
                href={`http://localhost:3001/reports/${executionStatus.reportPath.split(/[/\\]/).pop()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 underline font-medium"
              >
                查看详细报告
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
