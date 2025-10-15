/**
 * Status Management Unit Tests
 * Tests for quotation status transitions, validation, and business logic
 */

import {
  validateStatusTransition,
  getValidNextStatuses,
  isQuotationExpired,
  QuotationStatus
} from '@/lib/status-management'

describe('Status Management', () => {
  describe('validateStatusTransition', () => {
    test('should allow valid transitions from draft', () => {
      const result = validateStatusTransition('draft', 'generated')
      expect(result.isValid).toBe(true)
      expect(result.from).toBe('draft')
      expect(result.to).toBe('generated')
      expect(result.reason).toBeUndefined()
    })

    test('should reject invalid transitions from draft', () => {
      const result = validateStatusTransition('draft', 'approved')
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Cannot transition from draft to approved')
    })

    test('should allow valid transitions from generated', () => {
      const underReviewResult = validateStatusTransition('generated', 'under_review')
      expect(underReviewResult.isValid).toBe(true)
      
      const expiredResult = validateStatusTransition('generated', 'expired')
      expect(expiredResult.isValid).toBe(true)
    })

    test('should allow valid transitions from under_review', () => {
      const approvedResult = validateStatusTransition('under_review', 'approved')
      expect(approvedResult.isValid).toBe(true)
      
      const rejectedResult = validateStatusTransition('under_review', 'rejected')
      expect(rejectedResult.isValid).toBe(true)
      
      const expiredResult = validateStatusTransition('under_review', 'expired')
      expect(expiredResult.isValid).toBe(true)
    })

    test('should allow valid transitions from approved', () => {
      const convertedResult = validateStatusTransition('approved', 'converted')
      expect(convertedResult.isValid).toBe(true)
      
      const expiredResult = validateStatusTransition('approved', 'expired')
      expect(expiredResult.isValid).toBe(true)
    })

    test('should allow regeneration after rejection', () => {
      const result = validateStatusTransition('rejected', 'generated')
      expect(result.isValid).toBe(true)
    })

    test('should allow regeneration after expiry', () => {
      const result = validateStatusTransition('expired', 'generated')
      expect(result.isValid).toBe(true)
    })

    test('should reject transitions from converted (final state)', () => {
      const result = validateStatusTransition('converted', 'generated')
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Cannot change status of converted quotations')
    })

    test('should reject same-status transitions', () => {
      const result = validateStatusTransition('draft', 'draft')
      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Status is already set to this value')
    })
  })

  describe('getValidNextStatuses', () => {
    test('should return correct next statuses for draft', () => {
      const nextStatuses = getValidNextStatuses('draft')
      expect(nextStatuses).toEqual(['generated'])
    })

    test('should return correct next statuses for generated', () => {
      const nextStatuses = getValidNextStatuses('generated')
      expect(nextStatuses).toEqual(['under_review', 'expired'])
    })

    test('should return correct next statuses for under_review', () => {
      const nextStatuses = getValidNextStatuses('under_review')
      expect(nextStatuses).toEqual(['approved', 'rejected', 'expired'])
    })

    test('should return correct next statuses for approved', () => {
      const nextStatuses = getValidNextStatuses('approved')
      expect(nextStatuses).toEqual(['converted', 'expired'])
    })

    test('should return correct next statuses for rejected', () => {
      const nextStatuses = getValidNextStatuses('rejected')
      expect(nextStatuses).toEqual(['generated'])
    })

    test('should return correct next statuses for expired', () => {
      const nextStatuses = getValidNextStatuses('expired')
      expect(nextStatuses).toEqual(['generated'])
    })

    test('should return empty array for converted (final state)', () => {
      const nextStatuses = getValidNextStatuses('converted')
      expect(nextStatuses).toEqual([])
    })
  })

  describe('isQuotationExpired', () => {
    test('should return false for quotation within validity period', () => {
      const issueDate = new Date().toISOString()
      const validityDays = 30
      
      const isExpired = isQuotationExpired(issueDate, validityDays)
      expect(isExpired).toBe(false)
    })

    test('should return true for quotation past validity period', () => {
      // Create date 31 days ago with extra buffer to account for timing
      const issueDate = new Date(Date.now() - (31 * 24 * 60 * 60 * 1000) - 60000).toISOString()
      const validityDays = 30
      
      const isExpired = isQuotationExpired(issueDate, validityDays)
      expect(isExpired).toBe(true)
    })

    test('should return true for quotation exactly at expiry boundary', () => {
      // Create date exactly 30 days ago with extra buffer
      const issueDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000) - 60000).toISOString()
      const validityDays = 30
      
      const isExpired = isQuotationExpired(issueDate, validityDays)
      // Should be expired because 30 full days have passed
      expect(isExpired).toBe(true)
    })

    test('should handle different validity periods', () => {
      // Test 7-day validity with buffer
      const sevenDaysAgo = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)).toISOString()
      const isExpiredSeven = isQuotationExpired(sevenDaysAgo, 7)
      expect(isExpiredSeven).toBe(true)
      
      // Test 60-day validity with buffer
      const sixtyDaysAgo = new Date(Date.now() - (61 * 24 * 60 * 60 * 1000)).toISOString()
      const isExpiredSixty = isQuotationExpired(sixtyDaysAgo, 60)
      expect(isExpiredSixty).toBe(true)
      
      // Test 1-day validity with buffer
      const twoDaysAgo = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString()
      const isExpiredOne = isQuotationExpired(twoDaysAgo, 1)
      expect(isExpiredOne).toBe(true)
    })

    test('should handle edge case of 0 validity days', () => {
      // Even with 0 validity, a small delay makes it expired
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
      const isExpired = isQuotationExpired(oneMinuteAgo, 0)
      expect(isExpired).toBe(true) // Should be immediately expired
    })
  })

  describe('Status Transition Business Rules', () => {
    test('should enforce proper workflow sequence', () => {
      // Normal workflow: draft -> generated -> under_review -> approved -> converted
      expect(validateStatusTransition('draft', 'generated').isValid).toBe(true)
      expect(validateStatusTransition('generated', 'under_review').isValid).toBe(true)
      expect(validateStatusTransition('under_review', 'approved').isValid).toBe(true)
      expect(validateStatusTransition('approved', 'converted').isValid).toBe(true)
    })

    test('should allow early expiry at appropriate stages', () => {
      // Can expire from generated or under_review or approved
      expect(validateStatusTransition('generated', 'expired').isValid).toBe(true)
      expect(validateStatusTransition('under_review', 'expired').isValid).toBe(true)
      expect(validateStatusTransition('approved', 'expired').isValid).toBe(true)
      
      // Cannot expire from draft (not sent to client yet)
      expect(validateStatusTransition('draft', 'expired').isValid).toBe(false)
    })

    test('should handle rejection and regeneration workflow', () => {
      // Rejection workflow: under_review -> rejected -> generated (retry)
      expect(validateStatusTransition('under_review', 'rejected').isValid).toBe(true)
      expect(validateStatusTransition('rejected', 'generated').isValid).toBe(true)
    })

    test('should prevent skipping workflow steps', () => {
      // Cannot skip from draft directly to approved
      expect(validateStatusTransition('draft', 'approved').isValid).toBe(false)
      
      // Cannot go back to draft from any status
      expect(validateStatusTransition('generated', 'draft').isValid).toBe(false)
      expect(validateStatusTransition('under_review', 'draft').isValid).toBe(false)
      expect(validateStatusTransition('approved', 'draft').isValid).toBe(false)
    })
  })

  describe('Type Safety', () => {
    test('should handle all defined status values', () => {
      const statuses: QuotationStatus[] = [
        'draft',
        'generated',
        'under_review',
        'approved',
        'rejected',
        'expired',
        'converted'
      ]

      statuses.forEach(status => {
        const nextStatuses = getValidNextStatuses(status)
        expect(Array.isArray(nextStatuses)).toBe(true)
        
        // Each next status should be a valid QuotationStatus
        nextStatuses.forEach(nextStatus => {
          expect(statuses.includes(nextStatus)).toBe(true)
        })
      })
    })
  })
})