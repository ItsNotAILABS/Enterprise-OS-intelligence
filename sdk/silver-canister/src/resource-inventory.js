/**
 * RESOURCE-INVENTORY — School Resource & Asset Management
 * ──────────────────────────────────────────────────────────────────────────────
 * Manages school resources and assets including:
 *   - Textbook inventory and allocation
 *   - Technology devices (Chromebooks, tablets)
 *   - Classroom supplies
 *   - Lab equipment
 *   - Library resources
 *   - Budget tracking per department
 *
 * Theory basis:
 *   Paper XIX  — CIVITAS MERIDIANA: civic infrastructure layer
 *   Paper XX   — STIGMERGY: immutable pheromone trail (CHRONO)
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// ResourceInventory
// ---------------------------------------------------------------------------

export class ResourceInventory {
  /**
   * Create a resource inventory for a school.
   *
   * @param {object} options
   * @param {string} options.schoolId - School identifier
   */
  constructor({ schoolId }) {
    if (!schoolId) throw new Error('ResourceInventory requires a schoolId');

    /** @type {string} */
    this.schoolId = schoolId;

    /**
     * Resources storage (resourceId → resource object)
     * @type {Map<string, object>}
     */
    this._resources = new Map();

    /**
     * Allocations (resourceId → allocation records)
     * @type {Map<string, object[]>}
     */
    this._allocations = new Map();

    /**
     * Budgets by department (departmentId → budget object)
     * @type {Map<string, object>}
     */
    this._budgets = new Map();

    /**
     * Maintenance records
     * @type {object[]}
     */
    this._maintenanceRecords = [];

    /** @type {object|null} */
    this._chrono = null;

    /** @type {number} */
    this._resourceCounter = 0;

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  /**
   * Attach CHRONO for audit trail.
   * @param {object} chrono - CHRONO instance
   * @returns {ResourceInventory}
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  // ── Resource Types ───────────────────────────────────────────────────────

  /**
   * Resource type constants.
   */
  static RESOURCE_TYPE = {
    TEXTBOOK: 'textbook',
    DEVICE: 'device',
    SUPPLY: 'supply',
    EQUIPMENT: 'equipment',
    LIBRARY: 'library',
    FURNITURE: 'furniture',
    SOFTWARE: 'software',
    CONSUMABLE: 'consumable',
    OTHER: 'other',
  };

  /**
   * Resource condition constants.
   */
  static CONDITION = {
    NEW: 'new',
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'fair',
    POOR: 'poor',
    DAMAGED: 'damaged',
    LOST: 'lost',
    RETIRED: 'retired',
  };

  // ── Resource Management ──────────────────────────────────────────────────

  /**
   * Add a resource to inventory.
   *
   * @param {object} resource
   * @param {string} [resource.resourceId]  - Resource identifier (auto-generated if omitted)
   * @param {string} resource.type          - Resource type (RESOURCE_TYPE constant)
   * @param {string} resource.name          - Resource name
   * @param {number} [resource.quantity]    - Quantity (default 1)
   * @param {string} [resource.condition]   - Condition (CONDITION constant)
   * @param {string} [resource.serialNumber] - Serial number (for devices)
   * @param {string} [resource.barcode]     - Barcode
   * @param {string} [resource.departmentId] - Owning department
   * @param {string} [resource.location]    - Storage location
   * @param {number} [resource.unitCost]    - Cost per unit
   * @param {string} [resource.purchaseDate] - Purchase date
   * @param {string} [resource.warrantyExpiry] - Warranty expiration
   * @param {object} [resource.metadata]    - Additional metadata
   * @returns {{ added: boolean, resourceId: string }}
   */
  addResource(resource) {
    const {
      type,
      name,
      quantity = 1,
      condition = ResourceInventory.CONDITION.NEW,
      serialNumber = null,
      barcode = null,
      departmentId = null,
      location = null,
      unitCost = 0,
      purchaseDate = null,
      warrantyExpiry = null,
      metadata = {},
    } = resource;

    if (!type) throw new Error('Resource requires a type');
    if (!name) throw new Error('Resource requires a name');

    this._resourceCounter++;
    const resourceId = resource.resourceId || `RES-${this.schoolId}-${this._resourceCounter}`;

    const resourceObj = {
      resourceId,
      type,
      name,
      quantity,
      availableQuantity: quantity,
      condition,
      serialNumber,
      barcode,
      departmentId,
      location,
      unitCost,
      totalValue: unitCost * quantity,
      purchaseDate,
      warrantyExpiry,
      metadata,
      schoolId: this.schoolId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this._resources.set(resourceId, resourceObj);
    this._allocations.set(resourceId, []);

    this._log('RESOURCE_ADDED', {
      resourceId,
      type,
      name,
      quantity,
      unitCost,
    });

    return { added: true, resourceId };
  }

  /**
   * Get a resource by ID.
   *
   * @param {string} resourceId - Resource identifier
   * @returns {object|null} Resource or null
   */
  getResource(resourceId) {
    return this._resources.get(resourceId) || null;
  }

  /**
   * List resources with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.type]        - Filter by type
   * @param {string} [filters.departmentId] - Filter by department
   * @param {string} [filters.condition]   - Filter by condition
   * @param {string} [filters.location]    - Filter by location
   * @param {boolean} [filters.available]  - Only available resources
   * @returns {object[]} Array of resources
   */
  listResources(filters = {}) {
    let resources = Array.from(this._resources.values());

    if (filters.type) {
      resources = resources.filter(r => r.type === filters.type);
    }
    if (filters.departmentId) {
      resources = resources.filter(r => r.departmentId === filters.departmentId);
    }
    if (filters.condition) {
      resources = resources.filter(r => r.condition === filters.condition);
    }
    if (filters.location) {
      resources = resources.filter(r => r.location === filters.location);
    }
    if (filters.available) {
      resources = resources.filter(r => r.availableQuantity > 0);
    }

    return resources;
  }

  /**
   * Update a resource.
   *
   * @param {string} resourceId - Resource identifier
   * @param {object} updates    - Fields to update
   * @returns {{ updated: boolean, resourceId: string }}
   */
  updateResource(resourceId, updates) {
    const resource = this._resources.get(resourceId);
    if (!resource) {
      return { updated: false, resourceId, error: 'Resource not found' };
    }

    const updatedResource = {
      ...resource,
      ...updates,
      resourceId, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    // Recalculate total value if needed
    if (updates.unitCost !== undefined || updates.quantity !== undefined) {
      updatedResource.totalValue = updatedResource.unitCost * updatedResource.quantity;
    }

    this._resources.set(resourceId, updatedResource);

    this._log('RESOURCE_UPDATED', { resourceId, fields: Object.keys(updates) });

    return { updated: true, resourceId };
  }

  /**
   * Remove a resource from inventory.
   *
   * @param {string} resourceId - Resource identifier
   * @param {string} [reason]   - Reason for removal
   * @returns {{ removed: boolean, resourceId: string }}
   */
  removeResource(resourceId, reason = '') {
    const resource = this._resources.get(resourceId);
    if (!resource) {
      return { removed: false, resourceId, error: 'Resource not found' };
    }

    this._resources.delete(resourceId);
    this._allocations.delete(resourceId);

    this._log('RESOURCE_REMOVED', { resourceId, name: resource.name, reason });

    return { removed: true, resourceId };
  }

  // ── Allocation ───────────────────────────────────────────────────────────

  /**
   * Allocate a resource to a classroom, teacher, or student.
   *
   * @param {string} resourceId  - Resource identifier
   * @param {object} allocation
   * @param {string} allocation.assigneeType - 'classroom', 'teacher', 'student'
   * @param {string} allocation.assigneeId   - ID of assignee
   * @param {number} [allocation.quantity]   - Quantity to allocate (default 1)
   * @param {string} [allocation.dueDate]    - Expected return date
   * @param {string} [allocation.notes]      - Allocation notes
   * @returns {{ allocated: boolean, resourceId: string, allocationId: string }}
   */
  allocate(resourceId, allocation) {
    const resource = this._resources.get(resourceId);
    if (!resource) {
      return { allocated: false, resourceId, error: 'Resource not found' };
    }

    const { assigneeType, assigneeId, quantity = 1, dueDate = null, notes = '' } = allocation;

    if (!assigneeType) throw new Error('Allocation requires an assigneeType');
    if (!assigneeId) throw new Error('Allocation requires an assigneeId');

    if (resource.availableQuantity < quantity) {
      return {
        allocated: false,
        resourceId,
        error: `Insufficient quantity. Available: ${resource.availableQuantity}, Requested: ${quantity}`,
      };
    }

    const allocationId = `ALLOC-${resourceId}-${Date.now()}`;
    const allocationRecord = {
      allocationId,
      resourceId,
      assigneeType,
      assigneeId,
      quantity,
      dueDate,
      notes,
      allocatedAt: new Date().toISOString(),
      returnedAt: null,
      status: 'active',
    };

    const allocations = this._allocations.get(resourceId) || [];
    allocations.push(allocationRecord);
    this._allocations.set(resourceId, allocations);

    resource.availableQuantity -= quantity;

    this._log('RESOURCE_ALLOCATED', {
      resourceId,
      allocationId,
      assigneeType,
      assigneeId,
      quantity,
    });

    return { allocated: true, resourceId, allocationId };
  }

  /**
   * Return an allocated resource.
   *
   * @param {string} allocationId - Allocation identifier
   * @param {object} [options]
   * @param {string} [options.condition] - Condition on return
   * @param {string} [options.notes]     - Return notes
   * @returns {{ returned: boolean, allocationId: string }}
   */
  returnResource(allocationId, options = {}) {
    // Find the allocation
    for (const [resourceId, allocations] of this._allocations) {
      const allocation = allocations.find(a => a.allocationId === allocationId);
      if (allocation) {
        if (allocation.status !== 'active') {
          return { returned: false, allocationId, error: 'Allocation is not active' };
        }

        allocation.returnedAt = new Date().toISOString();
        allocation.status = 'returned';
        allocation.returnCondition = options.condition || null;
        allocation.returnNotes = options.notes || '';

        const resource = this._resources.get(resourceId);
        if (resource) {
          resource.availableQuantity += allocation.quantity;
          
          if (options.condition) {
            resource.condition = options.condition;
          }
        }

        this._log('RESOURCE_RETURNED', {
          resourceId,
          allocationId,
          condition: options.condition,
        });

        return { returned: true, allocationId };
      }
    }

    return { returned: false, allocationId, error: 'Allocation not found' };
  }

  /**
   * Get allocations for a resource.
   *
   * @param {string} resourceId - Resource identifier
   * @param {object} [filters]
   * @param {string} [filters.status] - Filter by status: 'active', 'returned', 'overdue'
   * @returns {object[]} Array of allocations
   */
  getAllocations(resourceId, filters = {}) {
    let allocations = this._allocations.get(resourceId) || [];

    if (filters.status) {
      const now = new Date().toISOString();
      allocations = allocations.filter(a => {
        if (filters.status === 'overdue') {
          return a.status === 'active' && a.dueDate && a.dueDate < now;
        }
        return a.status === filters.status;
      });
    }

    return allocations;
  }

  /**
   * Get all allocations for an assignee.
   *
   * @param {string} assigneeType - 'classroom', 'teacher', 'student'
   * @param {string} assigneeId   - Assignee identifier
   * @returns {object[]} Array of allocations
   */
  getAssigneeAllocations(assigneeType, assigneeId) {
    const results = [];

    for (const allocations of this._allocations.values()) {
      for (const alloc of allocations) {
        if (alloc.assigneeType === assigneeType && alloc.assigneeId === assigneeId && alloc.status === 'active') {
          results.push(alloc);
        }
      }
    }

    return results;
  }

  /**
   * Get overdue allocations.
   *
   * @returns {object[]} Array of overdue allocations
   */
  getOverdueAllocations() {
    const now = new Date().toISOString();
    const overdue = [];

    for (const allocations of this._allocations.values()) {
      for (const alloc of allocations) {
        if (alloc.status === 'active' && alloc.dueDate && alloc.dueDate < now) {
          overdue.push(alloc);
        }
      }
    }

    return overdue;
  }

  // ── Budget Tracking ──────────────────────────────────────────────────────

  /**
   * Set or update a department budget.
   *
   * @param {object} budget
   * @param {string} budget.departmentId - Department identifier
   * @param {string} budget.departmentName - Department name
   * @param {number} budget.allocated    - Allocated budget
   * @param {string} [budget.fiscalYear] - Fiscal year
   * @returns {{ set: boolean, departmentId: string }}
   */
  setBudget(budget) {
    const { departmentId, departmentName, allocated, fiscalYear = '' } = budget;

    if (!departmentId) throw new Error('Budget requires a departmentId');
    if (allocated === undefined) throw new Error('Budget requires an allocated amount');

    const existing = this._budgets.get(departmentId);
    const spent = existing?.spent || 0;

    this._budgets.set(departmentId, {
      departmentId,
      departmentName: departmentName || departmentId,
      allocated,
      spent,
      remaining: allocated - spent,
      fiscalYear,
      updatedAt: new Date().toISOString(),
    });

    this._log('BUDGET_SET', { departmentId, allocated, fiscalYear });

    return { set: true, departmentId };
  }

  /**
   * Record an expenditure against a department budget.
   *
   * @param {string} departmentId - Department identifier
   * @param {number} amount       - Amount spent
   * @param {string} [description] - Expenditure description
   * @param {string} [resourceId]  - Related resource ID
   * @returns {{ recorded: boolean, departmentId: string, remaining: number }}
   */
  recordExpenditure(departmentId, amount, description = '', resourceId = null) {
    const budget = this._budgets.get(departmentId);
    if (!budget) {
      return { recorded: false, departmentId, error: 'Budget not found for department' };
    }

    budget.spent += amount;
    budget.remaining = budget.allocated - budget.spent;
    budget.updatedAt = new Date().toISOString();

    this._log('BUDGET_EXPENDITURE', {
      departmentId,
      amount,
      description,
      resourceId,
      remaining: budget.remaining,
    });

    return { recorded: true, departmentId, remaining: budget.remaining };
  }

  /**
   * Get budget for a department.
   *
   * @param {string} departmentId - Department identifier
   * @returns {object|null} Budget or null
   */
  getBudget(departmentId) {
    return this._budgets.get(departmentId) || null;
  }

  /**
   * Get all department budgets.
   *
   * @returns {object[]} Array of budgets
   */
  getAllBudgets() {
    return Array.from(this._budgets.values());
  }

  // ── Maintenance ──────────────────────────────────────────────────────────

  /**
   * Report a resource issue/maintenance need.
   *
   * @param {object} report
   * @param {string} report.resourceId  - Resource identifier
   * @param {string} report.issue       - Issue description
   * @param {string} [report.reportedBy] - Who reported
   * @param {string} [report.priority]   - Priority: 'low', 'medium', 'high', 'critical'
   * @returns {{ reported: boolean, maintenanceId: string }}
   */
  reportIssue(report) {
    const { resourceId, issue, reportedBy = null, priority = 'medium' } = report;

    if (!resourceId) throw new Error('Report requires a resourceId');
    if (!issue) throw new Error('Report requires an issue description');

    const resource = this._resources.get(resourceId);
    if (!resource) {
      return { reported: false, resourceId, error: 'Resource not found' };
    }

    const maintenanceId = `MAINT-${resourceId}-${Date.now()}`;

    const record = {
      maintenanceId,
      resourceId,
      resourceName: resource.name,
      issue,
      reportedBy,
      priority,
      reportedAt: new Date().toISOString(),
      status: 'open',
      resolvedAt: null,
      resolution: null,
    };

    this._maintenanceRecords.push(record);

    this._log('MAINTENANCE_REPORTED', {
      maintenanceId,
      resourceId,
      issue: issue.slice(0, 100),
      priority,
    });

    return { reported: true, maintenanceId };
  }

  /**
   * Resolve a maintenance issue.
   *
   * @param {string} maintenanceId - Maintenance record identifier
   * @param {string} resolution    - Resolution description
   * @param {string} [resolvedBy]  - Who resolved
   * @returns {{ resolved: boolean, maintenanceId: string }}
   */
  resolveIssue(maintenanceId, resolution, resolvedBy = null) {
    const record = this._maintenanceRecords.find(r => r.maintenanceId === maintenanceId);
    if (!record) {
      return { resolved: false, maintenanceId, error: 'Maintenance record not found' };
    }

    record.status = 'resolved';
    record.resolvedAt = new Date().toISOString();
    record.resolution = resolution;
    record.resolvedBy = resolvedBy;

    this._log('MAINTENANCE_RESOLVED', {
      maintenanceId,
      resourceId: record.resourceId,
      resolution: resolution.slice(0, 100),
    });

    return { resolved: true, maintenanceId };
  }

  /**
   * Get maintenance records.
   *
   * @param {object} [filters]
   * @param {string} [filters.resourceId] - Filter by resource
   * @param {string} [filters.status]     - Filter by status: 'open', 'resolved'
   * @param {string} [filters.priority]   - Filter by priority
   * @returns {object[]} Array of maintenance records
   */
  getMaintenanceRecords(filters = {}) {
    let records = [...this._maintenanceRecords];

    if (filters.resourceId) {
      records = records.filter(r => r.resourceId === filters.resourceId);
    }
    if (filters.status) {
      records = records.filter(r => r.status === filters.status);
    }
    if (filters.priority) {
      records = records.filter(r => r.priority === filters.priority);
    }

    return records;
  }

  // ── Inventory Reports ────────────────────────────────────────────────────

  /**
   * Get full inventory report.
   *
   * @returns {{ schoolId: string, totalResources: number, totalValue: number, byType: object, byCondition: object, lowStock: object[] }}
   */
  inventoryReport() {
    const resources = Array.from(this._resources.values());

    let totalValue = 0;
    const byType = {};
    const byCondition = {};
    const lowStock = [];

    for (const r of resources) {
      totalValue += r.totalValue;
      byType[r.type] = (byType[r.type] || 0) + r.quantity;
      byCondition[r.condition] = (byCondition[r.condition] || 0) + 1;

      // Flag low stock (less than 10% available)
      if (r.quantity > 0 && r.availableQuantity / r.quantity < 0.1) {
        lowStock.push({
          resourceId: r.resourceId,
          name: r.name,
          total: r.quantity,
          available: r.availableQuantity,
        });
      }
    }

    return {
      schoolId: this.schoolId,
      totalResources: resources.length,
      totalValue,
      byType,
      byCondition,
      lowStock,
    };
  }

  /**
   * Get statistics.
   *
   * @returns {{ schoolId: string, totalResources: number, totalAllocations: number, activeAllocations: number, overdueAllocations: number, openMaintenance: number, departmentBudgets: number }}
   */
  stats() {
    let totalAllocations = 0;
    let activeAllocations = 0;
    const overdue = this.getOverdueAllocations();

    for (const allocations of this._allocations.values()) {
      totalAllocations += allocations.length;
      activeAllocations += allocations.filter(a => a.status === 'active').length;
    }

    const openMaintenance = this._maintenanceRecords.filter(r => r.status === 'open').length;

    return {
      schoolId: this.schoolId,
      totalResources: this._resources.size,
      totalAllocations,
      activeAllocations,
      overdueAllocations: overdue.length,
      openMaintenance,
      departmentBudgets: this._budgets.size,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /** @private */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({
        type,
        schoolId: this.schoolId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
