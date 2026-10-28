import { create } from 'zustand';

export const useUIStore = create((set) => ({
  activeEvidenceId: null,
  setActiveEvidenceId: (id) => set({ activeEvidenceId: id }),

  filterType: 'all',
  setFilterType: (type) => set({ filterType: type }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  activeTab: 'suspects', // 'suspects' | 'notebook' | 'board' | 'hints'
  setActiveTab: (tab) => set({ activeTab: tab }),

  isAccusationOpen: false,
  setAccusationOpen: (open) => set({ isAccusationOpen: open }),

  isMobileDrawerOpen: false,
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
}));

