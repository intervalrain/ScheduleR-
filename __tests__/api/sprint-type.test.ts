/**
 * TDD Test for Sprint Type API - RED phase
 * Testing Sprint creation with type support
 */

import { describe, test, expect } from '@jest/globals'

describe('Sprint Type API', () => {
  test('shouldCreateProjectSprintWithDefaultWorkSchedule', async () => {
    // Given: Valid PROJECT sprint data
    const sprintData = {
      name: 'Q1 Development Sprint',
      type: 'PROJECT',
      startDate: '2025-01-20T00:00:00.000Z',
      endDate: '2025-02-03T00:00:00.000Z',
      teamId: 'test-team-id'
    }

    // When: Creating sprint via API
    const response = await fetch('/api/sprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprintData)
    })

    // Then: Sprint should be created with PROJECT defaults
    expect(response.status).toBe(201)
    const sprint = await response.json()
    expect(sprint.type).toBe('PROJECT')
    expect(sprint.defaultWorkDays).toEqual([1, 2, 3, 4, 5]) // Mon-Fri
    expect(sprint.defaultWorkHours).toEqual({
      start: '08:30',
      end: '17:30'
    })
  })

  test('shouldCreateCasualSprintWithFullTimeSchedule', async () => {
    // Given: Valid CASUAL sprint data
    const sprintData = {
      name: 'Personal Tasks Sprint',
      type: 'CASUAL',
      startDate: '2025-01-20T00:00:00.000Z',
      endDate: '2025-02-03T00:00:00.000Z',
      teamId: 'test-team-id'
    }

    // When: Creating sprint via API
    const response = await fetch('/api/sprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprintData)
    })

    // Then: Sprint should be created with CASUAL defaults
    expect(response.status).toBe(201)
    const sprint = await response.json()
    expect(sprint.type).toBe('CASUAL')
    expect(sprint.defaultWorkDays).toEqual([1, 2, 3, 4, 5, 6, 7]) // All days
    expect(sprint.defaultWorkHours).toEqual({
      start: '00:00',
      end: '23:59'
    })
  })

  test('shouldAllowCustomWorkSchedule', async () => {
    // Given: Sprint with custom work schedule
    const sprintData = {
      name: 'Custom Schedule Sprint',
      type: 'PROJECT',
      startDate: '2025-01-20T00:00:00.000Z',
      endDate: '2025-02-03T00:00:00.000Z',
      teamId: 'test-team-id',
      defaultWorkDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
      defaultWorkHours: {
        start: '09:00',
        end: '18:00'
      }
    }

    // When: Creating sprint with custom schedule
    const response = await fetch('/api/sprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprintData)
    })

    // Then: Custom schedule should be preserved
    expect(response.status).toBe(201)
    const sprint = await response.json()
    expect(sprint.defaultWorkDays).toEqual([1, 2, 3, 4, 5, 6])
    expect(sprint.defaultWorkHours).toEqual({
      start: '09:00',
      end: '18:00'
    })
  })
})