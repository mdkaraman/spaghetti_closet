import { expect, test, vi } from 'vitest'
import { PREFERENCE_SIZES, PREFERENCE_TYPES } from '../preference-choices'
import { savePreferences } from '../preferences'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const { createClient } = await import('@/lib/supabase/server')

function formData(fields: { size?: string; jont_type?: string }) {
  const fd = new FormData()
  if (fields.size !== undefined) fd.set('size', fields.size)
  if (fields.jont_type !== undefined) fd.set('jont_type', fields.jont_type)
  return fd
}

function mockClient({
  user = { id: 'user-1' } as { id: string } | null,
  error = null as { message: string } | null,
} = {}) {
  const eq = vi.fn(async () => ({ error }))
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: () => Promise.resolve({ data: { user }, error: null }),
    },
    from,
  } as any)
  return { eq, update, from }
}

test('preference choices are the contract lists', () => {
  expect([...PREFERENCE_SIZES]).toEqual(['S', 'M', 'L', 'XL'])
  expect([...PREFERENCE_TYPES]).toEqual(['shirt', 'pants', 'shoes', 'other'])
})

test('choosing a size and a type updates the caller profile', async () => {
  const { eq, update } = mockClient()

  await expect(
    savePreferences(formData({ size: 'L', jont_type: 'shirt' }))
  ).rejects.toThrow('NEXT_REDIRECT:/user')

  expect(update).toHaveBeenCalledWith({ size: 'L', jont_type: 'shirt' })
  expect(eq).toHaveBeenCalledWith('id', 'user-1')
})

test('empty size and type are saved as no preference', async () => {
  const { update } = mockClient()

  await expect(savePreferences(formData({ size: '', jont_type: '' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user'
  )

  expect(update).toHaveBeenCalledWith({ size: null, jont_type: null })
})

test('a blank field is saved on its own', async () => {
  const { update } = mockClient()

  await expect(savePreferences(formData({ size: 'S', jont_type: '' }))).rejects.toThrow(
    'NEXT_REDIRECT:/user'
  )

  expect(update).toHaveBeenCalledWith({ size: 'S', jont_type: null })
})

test('whitespace counts as empty', async () => {
  const { update } = mockClient()

  await expect(
    savePreferences(formData({ size: '  ', jont_type: '\n' }))
  ).rejects.toThrow('NEXT_REDIRECT:/user')

  expect(update).toHaveBeenCalledWith({ size: null, jont_type: null })
})

test('missing fields are saved as empty', async () => {
  const { update } = mockClient()

  await expect(savePreferences(formData({}))).rejects.toThrow('NEXT_REDIRECT:/user')

  expect(update).toHaveBeenCalledWith({ size: null, jont_type: null })
})

test('a size outside the list does not update the profile', async () => {
  const { update } = mockClient()

  await expect(
    savePreferences(formData({ size: 'XXL', jont_type: 'pants' }))
  ).rejects.toThrow('NEXT_REDIRECT:/user?error=' + encodeURIComponent('pick one from the list'))

  expect(update).not.toHaveBeenCalled()
})

test('a type outside the list does not update the profile', async () => {
  const { update } = mockClient()

  await expect(
    savePreferences(formData({ size: 'M', jont_type: 'hat' }))
  ).rejects.toThrow('NEXT_REDIRECT:/user?error=' + encodeURIComponent('pick one from the list'))

  expect(update).not.toHaveBeenCalled()
})

test('logged-out save redirects home and does not write', async () => {
  const { from } = mockClient({ user: null })

  await expect(
    savePreferences(formData({ size: 'M', jont_type: 'shoes' }))
  ).rejects.toThrow('NEXT_REDIRECT:/')

  expect(from).not.toHaveBeenCalled()
})

test('a failed update redirects with an error', async () => {
  const { eq } = mockClient({ error: { message: 'nope' } })

  await expect(
    savePreferences(formData({ size: 'XL', jont_type: 'other' }))
  ).rejects.toThrow(
    'NEXT_REDIRECT:/user?error=' + encodeURIComponent('something went wrong. try again.')
  )

  expect(eq).toHaveBeenCalledWith('id', 'user-1')
})
