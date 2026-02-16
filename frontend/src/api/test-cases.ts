import type { TestCase, CreateTestCaseInput, UpdateTestCaseInput } from '../types';

const API_BASE = 'http://localhost:3001/api';

export async function getTestCases(): Promise<TestCase[]> {
  const response = await fetch(`${API_BASE}/test-cases`);
  if (!response.ok) throw new Error('获取测试用例失败');
  return await response.json();
}

export async function createTestCase(data: CreateTestCaseInput): Promise<TestCase> {
  const response = await fetch(`${API_BASE}/test-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('创建测试用例失败');
  return await response.json();
}

export async function deleteTestCase(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/test-cases/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('删除测试用例失败');
}

export async function updateTestCase(id: string, data: UpdateTestCaseInput): Promise<TestCase> {
  const response = await fetch(`${API_BASE}/test-cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('更新测试用例失败');
  return await response.json();
}
