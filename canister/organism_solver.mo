/**
 * Organism Solver — Canister
 *
 * The autonomous job-queue executor at the heart of the organism.
 * Wired directly to the SYN Synapse Binding Engine.
 *
 * Architecture
 * ────────────
 * • ICP timer → agi_terminal.systemTick() every 873 ms
 * • Every 50 ticks → solverTick() is called by the AGI Terminal
 * • solverTick() processes 5 jobs per tick (CRITICAL jobs bypass the limit)
 * • Failed jobs retry up to MAX_RETRIES (3×) with exponential back-off
 * • MAX_QUEUE = 200 jobs; LOW-priority jobs shed first if full
 * • MAX_WORKERS = 50 concurrent named service workers
 *
 * Job types: AUTO_DISCOVER | GOVERNANCE_SYNC | HEARTBEAT_CHECK |
 *            DEPLOY_WORKER | ADD_HOTKEY | NNS_VOTE | CUSTOM
 *
 * Ring: Sovereign Ring | Wire: intelligence-wire/solver
 */

import Text      "mo:base/Text";
import Nat       "mo:base/Nat";
import Int       "mo:base/Int";
import Float     "mo:base/Float";
import Time      "mo:base/Time";
import Array     "mo:base/Array";
import Buffer    "mo:base/Buffer";
import HashMap   "mo:base/HashMap";
import Iter      "mo:base/Iter";
import Principal "mo:base/Principal";
import Result    "mo:base/Result";
import Order     "mo:base/Order";

// ── Types ─────────────────────────────────────────────────────────────────────

type JobType = {
  #AUTO_DISCOVER;
  #GOVERNANCE_SYNC;
  #HEARTBEAT_CHECK;
  #DEPLOY_WORKER;
  #ADD_HOTKEY;
  #NNS_VOTE;
  #CUSTOM;
};

type Priority = { #CRITICAL; #HIGH; #NORMAL; #LOW };

type JobStatus = {
  #PENDING;
  #RUNNING;
  #COMPLETED;
  #FAILED;
  #RETRYING;
  #DROPPED;
};

type Job = {
  id          : Nat;
  jobType     : JobType;
  priority    : Priority;
  payload     : Text;
  status      : JobStatus;
  retries     : Nat;
  maxRetries  : Nat;
  createdAt   : Int;
  scheduledAt : Int;  // earliest execution time
  completedAt : Int;
  errorLog    : Text;
};

type WorkerStatus = { #IDLE; #RUNNING; #DEAD };

type Worker = {
  name        : Text;
  mission     : Text;
  status      : WorkerStatus;
  deployedAt  : Int;
  lastHeartbeat: Int;
};

// Stable serialisation helpers
type StableJob = (Nat, Text, Text, Text, Text, Nat, Nat, Int, Int, Int, Text);
type StableWorker = (Text, Text, Text, Int, Int);

// ── Actor ─────────────────────────────────────────────────────────────────────

actor OrganismSolver {

  // ── Constants ────────────────────────────────────────────────────────────

  let MAX_QUEUE   : Nat = 200;
  let MAX_WORKERS : Nat = 50;
  let MAX_RETRIES : Nat = 3;
  let JOBS_PER_TICK : Nat = 5;
  let PHI : Float = 1.618033988749895;

  // ── Stable state ─────────────────────────────────────────────────────────

  stable var stableJobs    : [StableJob]    = [];
  stable var stableWorkers : [StableWorker] = [];
  stable var initialized   : Bool           = false;
  stable var owner         : Principal      = Principal.fromText("aaaaa-aa");
  stable var nextJobId     : Nat            = 1;
  stable var solverTicks   : Nat            = 0;
  stable var totalJobsOk   : Nat            = 0;
  stable var totalJobsFail : Nat            = 0;
  stable var totalChrEarned: Nat            = 0;

  // ── Event log (ring buffer, max 1000) ────────────────────────────────────

  stable var eventLog : [Text] = [];

  // ── Live state ────────────────────────────────────────────────────────────

  var jobQueue : Buffer.Buffer<Job>   = Buffer.Buffer<Job>(64);
  var workers  : HashMap.HashMap<Text, Worker> =
    HashMap.HashMap<Text, Worker>(16, Text.equal, Text.hash);

  // ── Upgrade hooks ─────────────────────────────────────────────────────────

  system func preupgrade() {
    // Serialise job queue
    let jbuf = Buffer.Buffer<StableJob>(jobQueue.size());
    for (j in jobQueue.vals()) {
      jbuf.add((
        j.id,
        jobTypeText(j.jobType),
        priorityText(j.priority),
        statusText(j.status),
        j.payload,
        j.retries,
        j.maxRetries,
        j.createdAt,
        j.scheduledAt,
        j.completedAt,
        j.errorLog,
      ));
    };
    stableJobs := Buffer.toArray(jbuf);

    // Serialise workers
    let wbuf = Buffer.Buffer<StableWorker>(workers.size());
    for ((_name, w) in workers.entries()) {
      wbuf.add((w.name, w.mission, workerStatusText(w.status), w.deployedAt, w.lastHeartbeat));
    };
    stableWorkers := Buffer.toArray(wbuf);
  };

  system func postupgrade() {
    for ((id, jt, pr, st, pl, ret, mr, ca, sa, coa, el) in stableJobs.vals()) {
      let j : Job = {
        id;
        jobType     = parseJobType(jt);
        priority    = parsePriority(pr);
        status      = parseStatus(st);
        payload     = pl;
        retries     = ret;
        maxRetries  = mr;
        createdAt   = ca;
        scheduledAt = sa;
        completedAt = coa;
        errorLog    = el;
      };
      jobQueue.add(j);
    };
    for ((name, mission, st, da, lh) in stableWorkers.vals()) {
      let w : Worker = { name; mission; status = parseWorkerStatus(st); deployedAt = da; lastHeartbeat = lh };
      workers.put(name, w);
    };
  };

  // ── Serialisation helpers ─────────────────────────────────────────────────

  func jobTypeText(jt : JobType) : Text {
    switch jt {
      case (#AUTO_DISCOVER)   "AUTO_DISCOVER";
      case (#GOVERNANCE_SYNC) "GOVERNANCE_SYNC";
      case (#HEARTBEAT_CHECK) "HEARTBEAT_CHECK";
      case (#DEPLOY_WORKER)   "DEPLOY_WORKER";
      case (#ADD_HOTKEY)      "ADD_HOTKEY";
      case (#NNS_VOTE)        "NNS_VOTE";
      case (#CUSTOM)          "CUSTOM";
    }
  };
  func parseJobType(s : Text) : JobType {
    if (s == "AUTO_DISCOVER")   #AUTO_DISCOVER
    else if (s == "GOVERNANCE_SYNC") #GOVERNANCE_SYNC
    else if (s == "HEARTBEAT_CHECK") #HEARTBEAT_CHECK
    else if (s == "DEPLOY_WORKER")   #DEPLOY_WORKER
    else if (s == "ADD_HOTKEY")      #ADD_HOTKEY
    else if (s == "NNS_VOTE")        #NNS_VOTE
    else                             #CUSTOM
  };

  func priorityText(p : Priority) : Text {
    switch p {
      case (#CRITICAL) "CRITICAL";
      case (#HIGH)     "HIGH";
      case (#NORMAL)   "NORMAL";
      case (#LOW)      "LOW";
    }
  };
  func parsePriority(s : Text) : Priority {
    if (s == "CRITICAL") #CRITICAL
    else if (s == "HIGH") #HIGH
    else if (s == "NORMAL") #NORMAL
    else #LOW
  };

  func priorityOrd(p : Priority) : Nat {
    switch p {
      case (#CRITICAL) 3;
      case (#HIGH)     2;
      case (#NORMAL)   1;
      case (#LOW)      0;
    }
  };

  func statusText(s : JobStatus) : Text {
    switch s {
      case (#PENDING)   "PENDING";
      case (#RUNNING)   "RUNNING";
      case (#COMPLETED) "COMPLETED";
      case (#FAILED)    "FAILED";
      case (#RETRYING)  "RETRYING";
      case (#DROPPED)   "DROPPED";
    }
  };
  func parseStatus(s : Text) : JobStatus {
    if (s == "COMPLETED") #COMPLETED
    else if (s == "FAILED")   #FAILED
    else if (s == "RUNNING")  #RUNNING
    else if (s == "RETRYING") #RETRYING
    else if (s == "DROPPED")  #DROPPED
    else                      #PENDING
  };

  func workerStatusText(s : WorkerStatus) : Text {
    switch s {
      case (#IDLE)    "IDLE";
      case (#RUNNING) "RUNNING";
      case (#DEAD)    "DEAD";
    }
  };
  func parseWorkerStatus(s : Text) : WorkerStatus {
    if (s == "RUNNING") #RUNNING
    else if (s == "DEAD") #DEAD
    else #IDLE
  };

  // ── Event log ─────────────────────────────────────────────────────────────

  func logEvent(msg : Text) {
    let ts = Int.toText(Time.now());
    let entry = "[" # ts # "] " # msg;
    let buf = Buffer.fromArray<Text>(eventLog);
    buf.add(entry);
    if (buf.size() > 1000) {
      let _ = buf.remove(0);
    };
    eventLog := Buffer.toArray(buf);
  };

  // ── Owner guard ───────────────────────────────────────────────────────────

  func assertInitialized() : Result.Result<(), Text> {
    if (not initialized) #err("Not initialized") else #ok(())
  };

  func assertOwner(caller : Principal) : Result.Result<(), Text> {
    switch (assertInitialized()) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    if (caller != owner) #err("Caller is not the owner")
    else #ok(())
  };

  // ── Initialization ────────────────────────────────────────────────────────

  public shared(msg) func initialize() : async Result.Result<Text, Text> {
    if (initialized) return #err("Already initialized");
    owner       := msg.caller;
    initialized := true;

    // Queue the three seed jobs
    ignore dispatchJobInternal(#AUTO_DISCOVER,   #CRITICAL, "boot:auto-discover");
    ignore dispatchJobInternal(#GOVERNANCE_SYNC, #HIGH,     "boot:governance-sync");
    ignore dispatchJobInternal(#HEARTBEAT_CHECK, #NORMAL,   "boot:heartbeat-check");

    logEvent("OrganismSolver initialized. Owner=" # Principal.toText(owner));
    #ok("OrganismSolver initialized")
  };

  // ── Job Dispatch ──────────────────────────────────────────────────────────

  func dispatchJobInternal(jt : JobType, pr : Priority, payload : Text) : Result.Result<Nat, Text> {
    let now = Time.now();
    let id  = nextJobId;
    nextJobId += 1;

    // Shed LOW priority when queue is full
    if (jobQueue.size() >= MAX_QUEUE) {
      switch (pr) {
        case (#CRITICAL) or (#HIGH) {};
        case _ return #err("Queue full; LOW/NORMAL job dropped");
      };
      // Drop the lowest-priority pending job to make room
      var dropIdx : ?Nat = null;
      var i = 0;
      while (i < jobQueue.size()) {
        let j = jobQueue.get(i);
        if (j.status == #PENDING and priorityOrd(j.priority) == 0) {
          dropIdx := ?i;
          i := jobQueue.size(); // break
        };
        i += 1;
      };
      switch (dropIdx) {
        case null return #err("Queue full; cannot make room");
        case (?idx) {
          let dropped = jobQueue.get(idx);
          let updated : Job = {
            id          = dropped.id;
            jobType     = dropped.jobType;
            priority    = dropped.priority;
            status      = #DROPPED;
            payload     = dropped.payload;
            retries     = dropped.retries;
            maxRetries  = dropped.maxRetries;
            createdAt   = dropped.createdAt;
            scheduledAt = dropped.scheduledAt;
            completedAt = now;
            errorLog    = "Dropped: queue full";
          };
          jobQueue.put(idx, updated);
        };
      };
    };

    let job : Job = {
      id;
      jobType     = jt;
      priority    = pr;
      status      = #PENDING;
      payload;
      retries     = 0;
      maxRetries  = MAX_RETRIES;
      createdAt   = now;
      scheduledAt = now;
      completedAt = 0;
      errorLog    = "";
    };

    jobQueue.add(job);
    logEvent("Job dispatched: id=" # Nat.toText(id) # " type=" # jobTypeText(jt) # " priority=" # priorityText(pr));
    #ok(id)
  };

  /// Public entry point for dispatching a job.
  public shared(msg) func dispatchJob(
    jobType  : Text,
    priority : Text,
    payload  : Text,
  ) : async Result.Result<Nat, Text> {
    switch (assertOwner(msg.caller)) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    dispatchJobInternal(parseJobType(jobType), parsePriority(priority), payload)
  };

  // ── Solver Tick ───────────────────────────────────────────────────────────

  /**
   * Called by AGI Terminal every 50 heartbeat ticks (~43 s).
   * Processes up to JOBS_PER_TICK pending jobs; CRITICAL jobs bypass limit.
   */
  public shared(msg) func solverTick() : async {
    tickNumber    : Nat;
    jobsProcessed : Nat;
    queueSize     : Nat;
    workerCount   : Nat;
  } {
    solverTicks += 1;
    let now = Time.now();
    var processed = 0;

    // Collect pending jobs sorted by priority desc
    let pending = Buffer.Buffer<(Nat, Job)>(16);
    var idx = 0;
    while (idx < jobQueue.size()) {
      let j = jobQueue.get(idx);
      if ((j.status == #PENDING or j.status == #RETRYING) and j.scheduledAt <= now) {
        pending.add((idx, j));
      };
      idx += 1;
    };

    // Sort by priority descending (stable-ish)
    let sorted = Array.sort<(Nat, Job)>(
      Buffer.toArray(pending),
      func((_, a), (_, b)) {
        let pa = priorityOrd(a.priority);
        let pb = priorityOrd(b.priority);
        if (pa > pb) #less        // higher priority first
        else if (pa < pb) #greater
        else #equal
      }
    );

    for ((qIdx, job) in sorted.vals()) {
      // CRITICAL jobs always execute; others obey JOBS_PER_TICK
      let isCritical = job.priority == #CRITICAL;
      if (not isCritical and processed >= JOBS_PER_TICK) {
        // Skip but keep iterating to find any remaining CRITICAL
      } else {
        let result = executeJob(job, now);
        let updatedJob = switch (result) {
          case (#ok(_)) {
            totalJobsOk += 1;
            totalChrEarned += 1;
            processed += 1;
            logEvent("Job OK: id=" # Nat.toText(job.id) # " type=" # jobTypeText(job.jobType));
            {
              id          = job.id;
              jobType     = job.jobType;
              priority    = job.priority;
              status      = #COMPLETED;
              payload     = job.payload;
              retries     = job.retries;
              maxRetries  = job.maxRetries;
              createdAt   = job.createdAt;
              scheduledAt = job.scheduledAt;
              completedAt = now;
              errorLog    = "";
            }
          };
          case (#err(e)) {
            let newRetries = job.retries + 1;
            if (newRetries >= job.maxRetries) {
              totalJobsFail += 1;
              logEvent("Job FAILED: id=" # Nat.toText(job.id) # " err=" # e);
              {
                id          = job.id;
                jobType     = job.jobType;
                priority    = job.priority;
                status      = #FAILED;
                payload     = job.payload;
                retries     = newRetries;
                maxRetries  = job.maxRetries;
                createdAt   = job.createdAt;
                scheduledAt = job.scheduledAt;
                completedAt = now;
                errorLog    = e;
              }
            } else {
              // Exponential back-off: delay = PHI^retries × 1_000_000_000 ns
              let delayNs : Int = Float.toInt(Float.pow(PHI, Float.fromInt(newRetries)) * 1_000_000_000.0);
              logEvent("Job RETRYING: id=" # Nat.toText(job.id) # " attempt=" # Nat.toText(newRetries));
              {
                id          = job.id;
                jobType     = job.jobType;
                priority    = job.priority;
                status      = #RETRYING;
                payload     = job.payload;
                retries     = newRetries;
                maxRetries  = job.maxRetries;
                createdAt   = job.createdAt;
                scheduledAt = now + delayNs;
                completedAt = 0;
                errorLog    = e;
              }
            }
          };
        };
        jobQueue.put(qIdx, updatedJob);
      };
    };

    {
      tickNumber    = solverTicks;
      jobsProcessed = processed;
      queueSize     = jobQueue.size();
      workerCount   = workers.size();
    }
  };

  // ── Job Execution ─────────────────────────────────────────────────────────

  /// Dispatches a job to its handler.  Extend with real logic per job type.
  func executeJob(job : Job, _now : Int) : Result.Result<Text, Text> {
    switch (job.jobType) {
      case (#AUTO_DISCOVER)   { logEvent("AUTO_DISCOVER executed"); #ok("discovered") };
      case (#HEARTBEAT_CHECK) { logEvent("HEARTBEAT_CHECK executed"); #ok("alive") };
      case (#GOVERNANCE_SYNC) { logEvent("GOVERNANCE_SYNC executed"); #ok("synced") };
      case (#ADD_HOTKEY)      { logEvent("ADD_HOTKEY: " # job.payload); #ok("hotkey-added") };
      case (#NNS_VOTE)        { logEvent("NNS_VOTE: " # job.payload); #ok("voted") };
      case (#DEPLOY_WORKER)   {
        // Parse "name:X|mission:Y" from payload
        let name = "worker-" # Nat.toText(workers.size() + 1);
        if (workers.size() >= MAX_WORKERS) {
          return #err("MAX_WORKERS reached");
        };
        let w : Worker = {
          name;
          mission      = job.payload;
          status       = #RUNNING;
          deployedAt   = Time.now();
          lastHeartbeat = Time.now();
        };
        workers.put(name, w);
        logEvent("Worker deployed: " # name);
        #ok("deployed:" # name)
      };
      case (#CUSTOM) { logEvent("CUSTOM: " # job.payload); #ok("custom-ok") };
    }
  };

  // ── Worker Management ─────────────────────────────────────────────────────

  public shared(msg) func killWorker(name : Text) : async Result.Result<Text, Text> {
    switch (assertOwner(msg.caller)) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    switch (workers.remove(name)) {
      case null #err("Worker not found: " # name);
      case (_)  { logEvent("Worker killed: " # name); #ok("killed:" # name) };
    }
  };

  // ── Diagnostics ───────────────────────────────────────────────────────────

  public query func getJobQueue() : async [{
    id       : Nat;
    jobType  : Text;
    priority : Text;
    status   : Text;
    retries  : Nat;
    payload  : Text;
  }] {
    Array.map<Job, {id:Nat; jobType:Text; priority:Text; status:Text; retries:Nat; payload:Text}>(
      Buffer.toArray(jobQueue),
      func(j) {{
        id       = j.id;
        jobType  = jobTypeText(j.jobType);
        priority = priorityText(j.priority);
        status   = statusText(j.status);
        retries  = j.retries;
        payload  = j.payload;
      }}
    )
  };

  public query func getSolverStats() : async {
    solverTicks   : Nat;
    totalJobsOk   : Nat;
    totalJobsFail : Nat;
    totalChrEarned: Nat;
    queueSize     : Nat;
    workerCount   : Nat;
  } {
    {
      solverTicks;
      totalJobsOk;
      totalJobsFail;
      totalChrEarned;
      queueSize  = jobQueue.size();
      workerCount = workers.size();
    }
  };

  public query func getSolverLog(count : Nat) : async [Text] {
    let len = eventLog.size();
    let n   = if (count > len) len else count;
    Array.tabulate<Text>(n, func(i) = eventLog[len - n + i])
  };

  public query func getWorkers() : async [{name:Text; mission:Text; status:Text; deployedAt:Int}] {
    Iter.toArray(
      Iter.map<(Text, Worker), {name:Text; mission:Text; status:Text; deployedAt:Int}>(
        workers.entries(),
        func((_, w)) {{ name = w.name; mission = w.mission; status = workerStatusText(w.status); deployedAt = w.deployedAt }}
      )
    )
  };

  public query func isInitialized() : async Bool { initialized };

}
