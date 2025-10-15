import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url?: string;
  is_hyperemote: boolean;
  created_at: string;
  moderation_status?: string;
  payment_status?: string;
  streamer_id?: string;
  message_visible?: boolean;
}

export interface QueuedAlert {
  id: string;
  donation: Donation;
  priority: 1 | 2 | 3; // 1=Hyperemote, 2=Voice, 3=Text
  attempts: number;
  firstSeen: number;
  lastAttempt: number;
  status: 'pending' | 'displaying' | 'completed' | 'failed';
  displayedAt?: number;
}

interface AlertDB extends DBSchema {
  alerts: {
    key: string;
    value: QueuedAlert;
    indexes: { 'by-status': string; 'by-priority': number };
  };
  shown: {
    key: string;
    value: { id: string; timestamp: number };
  };
}

class AlertQueueManager {
  private db: IDBPDatabase<AlertDB> | null = null;
  private readonly DB_NAME = 'ankit_alerts_db';
  private readonly DB_VERSION = 1;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.db = await openDB<AlertDB>(this.DB_NAME, this.DB_VERSION, {
          upgrade(db) {
            // Alerts queue store
            if (!db.objectStoreNames.contains('alerts')) {
              const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
              alertStore.createIndex('by-status', 'status');
              alertStore.createIndex('by-priority', 'priority');
            }

            // Shown alerts deduplication store
            if (!db.objectStoreNames.contains('shown')) {
              db.createObjectStore('shown', { keyPath: 'id' });
            }
          },
        });
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        // Fallback: operate in-memory only
      }
    })();

    return this.initPromise;
  }

  private calculatePriority(donation: Donation): 1 | 2 | 3 {
    if (donation.is_hyperemote) return 1;
    if (donation.voice_message_url) return 2;
    return 3;
  }

  async addAlert(donation: Donation): Promise<boolean> {
    await this.init();

    // Check if already shown (deduplication)
    if (await this.hasBeenShown(donation.id)) {
      console.log(`Alert ${donation.id} already shown, skipping`);
      return false;
    }

    // Check if already in queue
    if (this.db) {
      const existing = await this.db.get('alerts', donation.id);
      if (existing) {
        console.log(`Alert ${donation.id} already in queue`);
        return false;
      }
    }

    const queuedAlert: QueuedAlert = {
      id: donation.id,
      donation,
      priority: this.calculatePriority(donation),
      attempts: 0,
      firstSeen: Date.now(),
      lastAttempt: 0,
      status: 'pending',
    };

    if (this.db) {
      await this.db.add('alerts', queuedAlert);
    }

    return true;
  }

  async getNextAlert(): Promise<QueuedAlert | null> {
    await this.init();
    if (!this.db) return null;

    const tx = this.db.transaction('alerts', 'readonly');
    const index = tx.store.index('by-priority');
    
    // Get all pending alerts, sorted by priority
    const pending = await index.getAll();
    const pendingAlerts = pending.filter(a => a.status === 'pending');
    
    if (pendingAlerts.length === 0) return null;

    // Sort by priority (1 > 2 > 3), then by firstSeen
    pendingAlerts.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.firstSeen - b.firstSeen;
    });

    return pendingAlerts[0];
  }

  async markAsDisplaying(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const alert = await this.db.get('alerts', id);
    if (alert) {
      alert.status = 'displaying';
      alert.lastAttempt = Date.now();
      alert.attempts += 1;
      await this.db.put('alerts', alert);
    }
  }

  async markAsCompleted(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const alert = await this.db.get('alerts', id);
    if (alert) {
      alert.status = 'completed';
      alert.displayedAt = Date.now();
      await this.db.put('alerts', alert);

      // Add to shown list for deduplication
      await this.db.put('shown', { id, timestamp: Date.now() });

      // Clean up completed alert after 1 hour
      setTimeout(async () => {
        if (this.db) {
          await this.db.delete('alerts', id);
        }
      }, 3600000); // 1 hour
    }
  }

  async markAsFailed(id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const alert = await this.db.get('alerts', id);
    if (alert && alert.attempts < 3) {
      // Retry
      alert.status = 'pending';
      await this.db.put('alerts', alert);
    } else if (alert) {
      // Max retries reached
      alert.status = 'failed';
      await this.db.put('alerts', alert);
    }
  }

  async hasBeenShown(id: string): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const shown = await this.db.get('shown', id);
    return !!shown;
  }

  async getQueueSize(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const all = await this.db.getAll('alerts');
    return all.filter(a => a.status === 'pending').length;
  }

  async clearOldShown(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const tx = this.db.transaction('shown', 'readwrite');
    const all = await tx.store.getAll();
    const oneHourAgo = Date.now() - 3600000;

    for (const item of all) {
      if (item.timestamp < oneHourAgo) {
        await tx.store.delete(item.id);
      }
    }

    await tx.done;
  }

  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.clear('alerts');
    await this.db.clear('shown');
  }
}

export const alertQueueManager = new AlertQueueManager();
