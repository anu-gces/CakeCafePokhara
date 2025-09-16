import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/home/generalExpenseTracker')({
  component: RouteComponent,
})

import React, { useState } from 'react'

const categories = [
  'Kitchen',
  'Bakery',
  'Utility',
  'Salary',
  'Rent',
  'Maintenance',
  'Marketing',
  'Bank Fee',
  'Miscellaneous',
]

const paymentMethods = ['Cash', 'Bank', 'Card', 'eSewa', 'Other']

type Expense = {
  id: string
  date: string
  category: string
  amount: number
  description: string
  paymentMethod: string
}

function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [form, setForm] = useState({
    date: '',
    category: '',
    amount: '',
    description: '',
    paymentMethod: '',
  })
  const [showForm, setShowForm] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.category || !form.amount || !form.paymentMethod)
      return
    setExpenses([
      ...expenses,
      {
        id: Date.now().toString(),
        date: form.date,
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        paymentMethod: form.paymentMethod,
      },
    ])
    setForm({
      date: '',
      category: '',
      amount: '',
      description: '',
      paymentMethod: '',
    })
    setShowForm(false)
  }

  return (
    <div className="mx-auto p-6 max-w-2xl">
      <h1 className="mb-6 font-bold text-primary text-3xl">
        General Expense Tracker
      </h1>
      <div className="flex justify-center mb-6">
        <button
          className="bg-primary hover:bg-primary/80 shadow-lg px-6 py-2 rounded-full text-white"
          onClick={() => setShowForm(true)}
        >
          + Add Expense
        </button>
      </div>

      {showForm && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/30">
          <form
            className="bg-white shadow-xl p-6 border rounded-xl w-full max-w-md"
            onSubmit={handleAddExpense}
          >
            <h2 className="mb-4 font-semibold text-primary text-xl">
              Add Expense
            </h2>
            <div className="space-y-3">
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="px-3 py-2 border rounded w-full"
                required
              />
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="px-3 py-2 border rounded w-full"
                required
              >
                <option value="">Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="px-3 py-2 border rounded w-full"
                required
                min="0"
                placeholder="Amount"
              />
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="px-3 py-2 border rounded w-full"
                required
              >
                <option value="">Payment Method</option>
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="px-3 py-2 border rounded w-full"
                placeholder="Description (optional)"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="submit"
                className="bg-primary px-4 py-2 rounded text-white"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-muted px-4 py-2 rounded"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="py-12 text-muted-foreground text-lg text-center">
            No expenses recorded.
          </div>
        ) : (
          expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex flex-col gap-2 bg-white shadow-sm p-4 border rounded-xl"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">
                  {exp.category}
                </span>
                <span className="font-bold text-green-700 text-lg">
                  Rs. {exp.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>{exp.date}</span>
                <span>{exp.paymentMethod}</span>
              </div>
              {exp.description && (
                <div className="mt-1 text-gray-700 text-sm">
                  {exp.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function RouteComponent() {
  return <ExpenseTracker />
}
