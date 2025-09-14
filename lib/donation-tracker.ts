// Donation tracking utilities for managing donation cooldowns

const DONATION_STORAGE_KEY = 'pastry_blog_donations'
const COOLDOWN_PERIOD_DAYS = 30 // One month

interface DonationRecord {
  amount: number
  timestamp: number
  sessionId?: string
}

export class DonationTracker {
  /**
   * Record a new donation
   */
  static recordDonation(amount: number): void {
    try {
      const donations = this.getDonations()
      const newDonation: DonationRecord = {
        amount,
        timestamp: Date.now(),
        sessionId: this.generateSessionId()
      }

      donations.push(newDonation)

      // Keep only donations from the last 6 months to avoid storage bloat
      const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)
      const filteredDonations = donations.filter(d => d.timestamp > sixMonthsAgo)

      localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(filteredDonations))

      console.log('✅ Donation recorded:', newDonation)
    } catch (error) {
      console.error('Failed to record donation:', error)
    }
  }

  /**
   * Check if user has donated recently (within cooldown period)
   */
  static hasRecentDonation(): boolean {
    try {
      const donations = this.getDonations()
      const cooldownTime = Date.now() - (COOLDOWN_PERIOD_DAYS * 24 * 60 * 60 * 1000)

      return donations.some(donation => donation.timestamp > cooldownTime)
    } catch (error) {
      console.error('Failed to check donation history:', error)
      return false
    }
  }

  /**
   * Get the most recent donation
   */
  static getLastDonation(): DonationRecord | null {
    try {
      const donations = this.getDonations()
      if (donations.length === 0) return null

      return donations.sort((a, b) => b.timestamp - a.timestamp)[0]
    } catch (error) {
      console.error('Failed to get last donation:', error)
      return null
    }
  }

  /**
   * Get days remaining until next donation prompt
   */
  static getDaysUntilNextPrompt(): number {
    try {
      const lastDonation = this.getLastDonation()
      if (!lastDonation) return 0

      const timeSinceLastDonation = Date.now() - lastDonation.timestamp
      const daysSince = Math.floor(timeSinceLastDonation / (24 * 60 * 60 * 1000))

      return Math.max(0, COOLDOWN_PERIOD_DAYS - daysSince)
    } catch (error) {
      console.error('Failed to calculate days until next prompt:', error)
      return 0
    }
  }

  /**
   * Get total donations amount
   */
  static getTotalDonated(): number {
    try {
      const donations = this.getDonations()
      return donations.reduce((total, donation) => total + donation.amount, 0)
    } catch (error) {
      console.error('Failed to calculate total donations:', error)
      return 0
    }
  }

  /**
   * Get donation count
   */
  static getDonationCount(): number {
    try {
      const donations = this.getDonations()
      return donations.length
    } catch (error) {
      console.error('Failed to get donation count:', error)
      return 0
    }
  }

  /**
   * Clear all donation records (for testing or reset)
   */
  static clearDonations(): void {
    try {
      localStorage.removeItem(DONATION_STORAGE_KEY)
      console.log('✅ Donation history cleared')
    } catch (error) {
      console.error('Failed to clear donations:', error)
    }
  }

  /**
   * Get all donations from localStorage
   */
  private static getDonations(): DonationRecord[] {
    try {
      const stored = localStorage.getItem(DONATION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to parse donations from storage:', error)
      return []
    }
  }

  /**
   * Generate a unique session ID for tracking
   */
  private static generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Format timestamp for display
   */
  static formatDonationDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// Export utility functions for easy use
export const {
  recordDonation,
  hasRecentDonation,
  getLastDonation,
  getDaysUntilNextPrompt,
  getTotalDonated,
  getDonationCount,
  clearDonations,
  formatDonationDate
} = DonationTracker