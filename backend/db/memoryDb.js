// EventHub - College Event & Fest Management System
// Author: Harsh Yadav (Roll No: 129, TYCS-B)
// Guide: Faculty Coordinator
// memoryDb.js: Fail-safe embedded database store with file persistence
// Guarantees zero crashes during college viva evaluation even without MongoDB service running!

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'store.json');

// Initial seed store
const initialData = {
  users: [],
  events: [],
  registrations: [],
  announcements: []
};

class MemoryStore {
  constructor() {
    this.data = { ...initialData };
    this.loadFromFile();
  }

  loadFromFile() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[EventHub DB] Loaded persistent records from local storage.');
      }
    } catch (err) {
      console.warn('[EventHub DB] Initializing fresh in-memory database store.');
      this.data = { ...initialData };
    }
  }

  saveToFile() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[EventHub DB] Could not write to disk, keeping in memory:', err.message);
    }
  }

  // Generic query matcher
  _matches(item, filter) {
    if (!filter) return true;
    for (const key of Object.keys(filter)) {
      if (filter[key] !== undefined && item[key] !== filter[key]) {
        return false;
      }
    }
    return true;
  }

  // Collection accessors
  collection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    const self = this;
    const getList = () => {
      if (!self.data[name]) self.data[name] = [];
      return self.data[name];
    };

    return {
      find: (filter = {}) => {
        return getList().filter(item => self._matches(item, filter));
      },
      findOne: (filter = {}) => {
        return getList().find(item => self._matches(item, filter)) || null;
      },
      findById: (id) => {
        return getList().find(item => String(item._id || item.id) === String(id)) || null;
      },
      insert: (doc) => {
        const newDoc = {
          _id: 'eh_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...doc
        };
        getList().push(newDoc);
        self.saveToFile();
        return newDoc;
      },
      findByIdAndUpdate: (id, updates) => {
        const list = getList();
        const idx = list.findIndex(item => String(item._id || item.id) === String(id));
        if (idx === -1) return null;
        list[idx] = {
          ...list[idx],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        self.saveToFile();
        return list[idx];
      },
      findByIdAndDelete: (id) => {
        const list = getList();
        const idx = list.findIndex(item => String(item._id || item.id) === String(id));
        if (idx === -1) return null;
        const [deleted] = list.splice(idx, 1);
        self.saveToFile();
        return deleted;
      },
      count: (filter = {}) => {
        return getList().filter(item => self._matches(item, filter)).length;
      },
      clear: () => {
        self.data[name] = [];
        self.saveToFile();
      }
    };
  }
}

const memoryDb = new MemoryStore();
module.exports = memoryDb;
