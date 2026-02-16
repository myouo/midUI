import { create } from 'zustand';
import type { TestCase, CreateTestCaseInput, UpdateTestCaseInput } from '../types';
import * as testCasesApi from '../api/test-cases';

interface TestCasesState {
  list: TestCase[];
  selectedTestCase: TestCase | null;
}

interface TestCasesActions {
  fetchTestCases: () => Promise<void>;
  createTestCase: (data: CreateTestCaseInput) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  updateTestCase: (id: string, data: UpdateTestCaseInput) => Promise<void>;
  setSelectedTestCase: (tc: TestCase | null) => void;
}

type TestCasesStore = TestCasesState & TestCasesActions;

export const useTestCasesStore = create<TestCasesStore>((set) => ({
  list: [],
  selectedTestCase: null,

  fetchTestCases: async () => {
    try {
      const list = await testCasesApi.getTestCases();
      set({ list });
    } catch (error) {
      console.error('获取测试用例失败:', error);
    }
  },

  createTestCase: async (data) => {
    try {
      const newTC = await testCasesApi.createTestCase(data);
      set((state) => ({ list: [...state.list, newTC] }));
    } catch (error) {
      console.error('创建测试用例失败:', error);
    }
  },

  deleteTestCase: async (id) => {
    try {
      await testCasesApi.deleteTestCase(id);
      set((state) => ({
        list: state.list.filter(tc => tc.id !== id),
        selectedTestCase: state.selectedTestCase?.id === id ? null : state.selectedTestCase,
      }));
    } catch (error) {
      console.error('删除测试用例失败:', error);
    }
  },

  updateTestCase: async (id, data) => {
    try {
      const updated = await testCasesApi.updateTestCase(id, data);
      set((state) => ({
        list: state.list.map(tc => tc.id === id ? { ...tc, ...updated } : tc),
        selectedTestCase: state.selectedTestCase?.id === id ? { ...state.selectedTestCase, ...updated } : state.selectedTestCase,
      }));
    } catch (error) {
      console.error('更新测试用例失败:', error);
    }
  },

  setSelectedTestCase: (tc) => void set({ selectedTestCase: tc }),
}));
