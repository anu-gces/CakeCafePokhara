import { authenticatedMutation, authenticatedQuery } from '../functions'
import schema, { vv } from '../schema'

const eventFields = schema.tables.calendarEvents.validator.pick(
  'title',
  'startDate',
  'endDate',
  'color',
).fields

export const createEvent = authenticatedMutation({
  args: eventFields,
  minimumRole: 'employee',
  handler: async (ctx, args) => {
    return await ctx.db.insert('calendarEvents', args)
  },
})

export const listEvents = authenticatedQuery({
  args: {},
  minimumRole: 'employee',
  handler: async (ctx) => {
    return await ctx.db.query('calendarEvents').collect()
  },
})

export const deleteEvent = authenticatedMutation({
  args: {
    id: vv.id('calendarEvents'),
  },
  minimumRole: 'manager',
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return { success: true }
  },
})
