import { useState } from 'react'

/** className for standard-width form dialogs (sm:max-w-2xl). */
export const FORM_DIALOG_CLASS = 'max-w-[calc(100vw-2rem)] sm:max-w-2xl'

/** className for wide form dialogs, e.g. wizards (sm:max-w-5xl). */
export const FORM_DIALOG_CLASS_WIDE = 'max-w-[calc(100vw-2rem)] sm:max-w-5xl'

/** Manages open/close state for a simple (non-entity) dialog. */
export function useDialogState(initial = false) {
	const [isOpen, setIsOpen] = useState(initial)
	return {
		isOpen,
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
		setIsOpen,
	}
}

/** Manages open/close state for an entity edit dialog. */
export function useEditDialogState<T>() {
	const [editing, setEditing] = useState<T | null>(null)
	return {
		editing,
		isOpen: editing !== null,
		edit: (item: T) => setEditing(item),
		close: () => setEditing(null),
	}
}

/** Manages open/close + step state for a wizard dialog. Resets step on close. */
export function useWizardDialogState(initialStep: 1 | 2 | 3 = 1) {
	const [isOpen, setIsOpen] = useState(false)
	const [step, setStep] = useState<1 | 2 | 3>(initialStep)
	const handleOpenChange = (open: boolean) => {
		setIsOpen(open)
		if (!open) setStep(initialStep)
	}
	return {
		isOpen,
		step,
		setStep,
		handleOpenChange,
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
	}
}
