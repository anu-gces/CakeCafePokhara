import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

// Create the base contexts & consumption hooks
export const { formContext, useFormContext, fieldContext, useFieldContext } =
  createFormHookContexts()

// Export the specialized hook for creating forms tied to this context
export const { useAppForm, withForm } = createFormHook({
  formContext,
  fieldContext,
  fieldComponents: {},
  formComponents: {},
})
