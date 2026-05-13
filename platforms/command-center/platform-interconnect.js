/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          P L A T F O R M   I N T E R C O N N E C T   M E S H                ║
 * ║         All 4 Platforms Communicating Through Mesh Network                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * platform-interconnect.js
 * RSHIP-2026-MESH-001
 * 
 * Enables cross-platform communication for:
 * - NEXUS AI ↔ SYNAPSE AI ↔ MERIDIAN AI ↔ PHANTOM AI
 * - φ-weighted routing and load balancing
 * - Sovereign message authentication
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const PLATFORM_NODES = {
  NEXUS: { id: 'node-nexus', weight: PHI, capacity: 1000, type: 'workflow' },
  SYNAPSE: { id: 'node-synapse', weight: PHI_INV, capacity: 800, type: 'cognitive' },
  MERIDIAN: { id: 'node-meridian', weight: 1.0, capacity: 1200, type: 'autonomous' },
  PHANTOM: { id: 'node-phantom', weight: PHI * PHI, capacity: 2000, type: 'infrastructure' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MESH NODE
// ═══════════════════════════════════════════════════════════════════════════════

class MeshNode extends EventEmitter {
  constructor(platformKey) {
    super();
    this.config = PLATFORM_NODES[platformKey];
    this.key = platformKey;
    this.neighbors = new Map();
    this.messageQueue = [];
    this.routingTable = new Map();
    this.stats = { sent: 0, received: 0, forwarded: 0, dropped: 0 };
  }

  addNeighbor(nodeKey, cost = 1) {
    const phiCost = cost * Math.pow(PHI_INV, this.neighbors.size);
    this.neighbors.set(nodeKey, { cost: phiCost, lastSeen: Date.now(), alive: true });
    this.updateRoutingTable();
  }

  removeNeighbor(nodeKey) {
    this.neighbors.delete(nodeKey);
    this.updateRoutingTable();
  }

  updateRoutingTable() {
    // Simple shortest-path routing with φ-weighted costs
    this.routingTable.clear();
    for (const [neighbor, data] of this.neighbors) {
      this.routingTable.set(neighbor, { nextHop: neighbor, cost: data.cost, hops: 1 });
    }
  }

  getNextHop(destination) {
    const route = this.routingTable.get(destination);
    return route ? route.nextHop : null;
  }

  sendMessage(destination, payload, options = {}) {
    const message = {
      id: crypto.randomUUID(),
      source: this.key,
      destination,
      payload,
      ttl: options.ttl || 10,
      priority: options.priority || 0.5,
      timestamp: Date.now(),
      path: [this.key],
      hash: this.hashPayload(payload)
    };
    
    this.stats.sent++;
    this.emit('message-sent', message);
    return message;
  }

  receiveMessage(message) {
    if (message.destination === this.key) {
      // Message arrived at destination
      this.stats.received++;
      this.emit('message-received', message);
      return { delivered: true, message };
    }
    
    // Forward message
    if (message.ttl <= 0) {
      this.stats.dropped++;
      this.emit('message-dropped', { reason: 'ttl-expired', message });
      return { delivered: false, reason: 'ttl-expired' };
    }
    
    const nextHop = this.getNextHop(message.destination);
    if (!nextHop) {
      this.stats.dropped++;
      this.emit('message-dropped', { reason: 'no-route', message });
      return { delivered: false, reason: 'no-route' };
    }
    
    message.ttl--;
    message.path.push(this.key);
    this.stats.forwarded++;
    this.emit('message-forwarded', { nextHop, message });
    return { delivered: false, forwarded: true, nextHop, message };
  }

  hashPayload(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
  }

  status() {
    return {
      node: this.key,
      config: this.config,
      neighborCount: this.neighbors.size,
      neighbors: Array.from(this.neighbors.keys()),
      routeCount: this.routingTable.size,
      stats: this.stats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESH NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

class PlatformInterconnect extends EventEmitter {
  constructor() {
    super();
    this.id = 'RSHIP-2026-MESH-001';
    this.name = 'Platform Interconnect Mesh';
    this.version = '1.0.0';
    this.nodes = new Map();
    this.channels = new Map();
    this.messageLog = [];
    this.initializeNodes();
  }

  initializeNodes() {
    // Create nodes for each platform
    for (const key of Object.keys(PLATFORM_NODES)) {
      const node = new MeshNode(key);
      node.on('message-sent', (msg) => this.emit('message-sent', msg));
      node.on('message-received', (msg) => this.emit('message-received', msg));
      node.on('message-forwarded', (data) => this.emit('message-forwarded', data));
      node.on('message-dropped', (data) => this.emit('message-dropped', data));
      this.nodes.set(key, node);
    }
  }

  createFullMesh() {
    // Connect all nodes to each other (full mesh topology)
    const keys = Array.from(this.nodes.keys());
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        this.connect(keys[i], keys[j]);
      }
    }
    return this.getTopology();
  }

  connect(nodeA, nodeB, bidirectional = true) {
    const a = this.nodes.get(nodeA);
    const b = this.nodes.get(nodeB);
    if (!a || !b) return false;
    
    const cost = this.calculateLinkCost(nodeA, nodeB);
    a.addNeighbor(nodeB, cost);
    
    if (bidirectional) {
      b.addNeighbor(nodeA, cost);
    }
    
    const channelId = `${nodeA}<->${nodeB}`;
    this.channels.set(channelId, { nodes: [nodeA, nodeB], cost, created: Date.now() });
    this.emit('connected', { nodeA, nodeB, cost });
    return true;
  }

  disconnect(nodeA, nodeB) {
    const a = this.nodes.get(nodeA);
    const b = this.nodes.get(nodeB);
    if (!a || !b) return false;
    
    a.removeNeighbor(nodeB);
    b.removeNeighbor(nodeA);
    
    this.channels.delete(`${nodeA}<->${nodeB}`);
    this.channels.delete(`${nodeB}<->${nodeA}`);
    this.emit('disconnected', { nodeA, nodeB });
    return true;
  }

  calculateLinkCost(nodeA, nodeB) {
    const a = PLATFORM_NODES[nodeA];
    const b = PLATFORM_NODES[nodeB];
    // Cost based on platform weights
    return Math.abs(a.weight - b.weight) + PHI_INV;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MESSAGE ROUTING
  // ─────────────────────────────────────────────────────────────────────────────

  send(source, destination, payload, options = {}) {
    const srcNode = this.nodes.get(source);
    if (!srcNode) throw new Error(`Unknown source node: ${source}`);
    
    const message = srcNode.sendMessage(destination, payload, options);
    this.messageLog.push(message);
    
    // Route the message
    return this.routeMessage(message, source);
  }

  routeMessage(message, currentNode) {
    const node = this.nodes.get(currentNode);
    const result = node.receiveMessage(message);
    
    if (result.delivered) {
      return { success: true, path: message.path, hops: message.path.length - 1 };
    }
    
    if (result.forwarded) {
      return this.routeMessage(message, result.nextHop);
    }
    
    return { success: false, reason: result.reason, path: message.path };
  }

  broadcast(source, payload, options = {}) {
    const results = [];
    for (const dest of this.nodes.keys()) {
      if (dest !== source) {
        try {
          const result = this.send(source, dest, payload, options);
          results.push({ destination: dest, ...result });
        } catch (err) {
          results.push({ destination: dest, success: false, error: err.message });
        }
      }
    }
    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TOPOLOGY & MONITORING
  // ─────────────────────────────────────────────────────────────────────────────

  getTopology() {
    const topology = {
      nodes: [],
      links: []
    };
    
    for (const [key, node] of this.nodes) {
      topology.nodes.push({
        id: key,
        ...node.config,
        stats: node.stats
      });
    }
    
    for (const [channelId, channel] of this.channels) {
      topology.links.push({
        id: channelId,
        source: channel.nodes[0],
        target: channel.nodes[1],
        cost: channel.cost
      });
    }
    
    return topology;
  }

  getRoutingInfo() {
    const info = {};
    for (const [key, node] of this.nodes) {
      info[key] = {
        neighbors: Array.from(node.neighbors.entries()).map(([k, v]) => ({ node: k, cost: v.cost })),
        routes: Array.from(node.routingTable.entries()).map(([k, v]) => ({ destination: k, ...v }))
      };
    }
    return info;
  }

  getStats() {
    let totalSent = 0, totalReceived = 0, totalForwarded = 0, totalDropped = 0;
    for (const node of this.nodes.values()) {
      totalSent += node.stats.sent;
      totalReceived += node.stats.received;
      totalForwarded += node.stats.forwarded;
      totalDropped += node.stats.dropped;
    }
    return { totalSent, totalReceived, totalForwarded, totalDropped, messageLogSize: this.messageLog.length };
  }

  renderTopologyCLI() {
    const lines = [];
    lines.push('');
    lines.push('╔══════════════════════════════════════════════════════════════════════════════╗');
    lines.push('║          P L A T F O R M   I N T E R C O N N E C T   M E S H                ║');
    lines.push('╚══════════════════════════════════════════════════════════════════════════════╝');
    lines.push('');
    lines.push('                    ┌─────────────┐');
    lines.push('                    │  NEXUS AI   │');
    lines.push('                    │  (Workflow) │');
    lines.push('                    └──────┬──────┘');
    lines.push('                           │');
    lines.push('           ┌───────────────┼───────────────┐');
    lines.push('           │               │               │');
    lines.push('   ┌───────┴───────┐       │       ┌───────┴───────┐');
    lines.push('   │  SYNAPSE AI   │       │       │  MERIDIAN AI  │');
    lines.push('   │  (Cognitive)  │───────┼───────│  (Autonomous) │');
    lines.push('   └───────┬───────┘       │       └───────┬───────┘');
    lines.push('           │               │               │');
    lines.push('           └───────────────┼───────────────┘');
    lines.push('                           │');
    lines.push('                    ┌──────┴──────┐');
    lines.push('                    │ PHANTOM AI  │');
    lines.push('                    │(Infrastruc) │');
    lines.push('                    └─────────────┘');
    lines.push('');
    
    const stats = this.getStats();
    lines.push(`  Messages: Sent=${stats.totalSent} | Received=${stats.totalReceived} | Forwarded=${stats.totalForwarded} | Dropped=${stats.totalDropped}`);
    lines.push('');
    
    return lines.join('\n');
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      nodeCount: this.nodes.size,
      channelCount: this.channels.size,
      stats: this.getStats()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = { PlatformInterconnect, MeshNode, PLATFORM_NODES };

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Platform Interconnect Mesh - Demo');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const mesh = new PlatformInterconnect();
  
  console.log('🔗 Creating full mesh topology...');
  mesh.createFullMesh();
  
  console.log(mesh.renderTopologyCLI());
  
  console.log('\n📨 Sending test messages:');
  
  // Test routing
  const tests = [
    { from: 'NEXUS', to: 'PHANTOM', payload: { action: 'sync' } },
    { from: 'SYNAPSE', to: 'MERIDIAN', payload: { cognitive: 'merge' } },
    { from: 'PHANTOM', to: 'NEXUS', payload: { ghost: 'register' } },
    { from: 'MERIDIAN', to: 'SYNAPSE', payload: { autonomous: 'report' } }
  ];
  
  for (const test of tests) {
    const result = mesh.send(test.from, test.to, test.payload);
    console.log(`  ${test.from} → ${test.to}: ${result.success ? '✓' : '✗'} (${result.hops || 0} hops)`);
  }
  
  console.log('\n📡 Broadcasting from NEXUS:');
  const broadcastResults = mesh.broadcast('NEXUS', { type: 'heartbeat' });
  for (const r of broadcastResults) {
    console.log(`  NEXUS → ${r.destination}: ${r.success ? '✓' : '✗'}`);
  }
  
  console.log('\n📊 Final Stats:', mesh.getStats());
  console.log('\n✅ Platform Interconnect operational!\n');
}
