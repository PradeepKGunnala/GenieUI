import { create } from 'zustand';

type ViewState = {
  selectedAgent: string | null;
  selectedTask: string | null;
  commandOpen: boolean;
  setAgent: (id: string | null) => void;
  setTask: (id: string | null) => void;
  setCommandOpen: (open: boolean) => void;
};

export const useView = create<ViewState>((set) => ({
  selectedAgent: null,
  selectedTask: null,
  commandOpen: false,
  setAgent: (selectedAgent) => set({ selectedAgent }),
  setTask: (selectedTask) => set({ selectedTask }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}));
