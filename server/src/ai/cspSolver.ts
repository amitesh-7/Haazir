/**
 * AI Timetable Generator - CSP Solver Engine
 * Implements backtracking algorithm with constraint propagation and heuristics
 */

import {
  CSPVariable,
  CSPAssignment,
  Constraint,
  CourseSession,
  TimeSlot,
  CSPSolverConfig,
  CSPSolutionTrace,
  CSPSolutionStep,
} from "./types";

export class CSPSolver {
  private constraints: Constraint[];
  private variables: CSPVariable[];
  private config: CSPSolverConfig;
  private solutionTrace: CSPSolutionStep[];
  private backtrackCount: number;
  private propagationCount: number;
  private startTime: number;

  constructor(
    variables: CSPVariable[],
    constraints: Constraint[],
    config: Partial<CSPSolverConfig> = {}
  ) {
    this.variables = variables;
    this.constraints = constraints;
    this.solutionTrace = [];
    this.backtrackCount = 0;
    this.propagationCount = 0;
    this.startTime = 0;

    // Default configuration
    this.config = {
      algorithm: "backtracking",
      heuristics: {
        variable_ordering: "most_constrained_first",
        value_ordering: "least_constraining_value",
        constraint_propagation: true,
        backjumping: false,
      },
      limits: {
        max_iterations: 50000, // Increased from 10000
        max_time_ms: 60000, // Increased to 60 seconds (1 minute)
        max_backtracks: 5000, // Increased from 1000
      },
      optimization: {
        enable_optimization: true,
        optimization_method: "weighted_sum",
        max_optimization_iterations: 100,
      },
      ...config,
    };
  }

  // ==================== MAIN SOLVE METHOD ====================

  async solve(): Promise<{
    assignment: CSPAssignment | null;
    trace: CSPSolutionTrace;
  }> {
    this.startTime = Date.now();
    this.solutionTrace = [];
    this.backtrackCount = 0;
    this.propagationCount = 0;

    console.log(
      "🤖 Starting CSP solver with",
      this.variables.length,
      "variables and",
      this.constraints.length,
      "constraints"
    );

    // Apply initial constraint propagation
    if (this.config.heuristics.constraint_propagation) {
      this.propagateConstraints({});
    }

    // Start backtracking search
    const assignment = await this.backtrackSearch({});

    const trace: CSPSolutionTrace = {
      steps: this.solutionTrace,
      final_assignment: assignment || {},
      total_backtracks: this.backtrackCount,
      total_propagations: this.propagationCount,
      solution_time_ms: Date.now() - this.startTime,
    };

    return { assignment, trace };
  }

  // ==================== BACKTRACKING ALGORITHM ====================

  private async backtrackSearch(
    assignment: CSPAssignment
  ): Promise<CSPAssignment | null> {
    // Check time and iteration limits
    if (Date.now() - this.startTime > this.config.limits.max_time_ms) {
      console.log("⏰ CSP solver timeout");
      return null;
    }

    if (this.backtrackCount > this.config.limits.max_backtracks) {
      console.log("🔄 CSP solver exceeded backtrack limit");
      return null;
    }

    // Check if assignment is complete
    if (this.isComplete(assignment)) {
      console.log("✅ CSP solver found complete assignment");
      return assignment;
    }

    // Select next variable to assign
    const variable = this.selectUnassignedVariable(assignment);
    if (!variable) {
      console.log("❌ No unassigned variable found but assignment incomplete");
      return null;
    }

    this.addTraceStep(
      "assign",
      variable.id,
      undefined,
      "Selected variable for assignment"
    );

    // Try each value in the variable's domain
    const orderedValues = this.orderDomainValues(variable, assignment);

    for (const value of orderedValues) {
      // Check if assignment is consistent with constraints
      if (this.isConsistent(variable, value, assignment)) {
        // Make assignment
        assignment[variable.id] = value;
        this.addTraceStep(
          "assign",
          variable.id,
          value.id,
          "Assigned value to variable"
        );

        // Apply constraint propagation
        if (this.config.heuristics.constraint_propagation) {
          const savedDomains = this.saveDomains();
          const propagationResult = this.propagateConstraints(assignment);

          if (propagationResult.success) {
            // Recursively search with reduced domains
            const result = await this.backtrackSearch(assignment);
            if (result) {
              return result;
            }
          }

          // Restore domains if propagation failed or search failed
          this.restoreDomains(savedDomains);
        } else {
          // No propagation - direct recursive search
          const result = await this.backtrackSearch(assignment);
          if (result) {
            return result;
          }
        }

        // Backtrack
        delete assignment[variable.id];
        this.backtrackCount++;
        this.addTraceStep(
          "backtrack",
          variable.id,
          value.id,
          "Backtracked assignment"
        );
      }
    }

    return null; // No solution found
  }

  // ==================== VARIABLE SELECTION HEURISTICS ====================

  private selectUnassignedVariable(
    assignment: CSPAssignment
  ): CSPVariable | null {
    const unassigned = this.variables.filter((v) => !(v.id in assignment));

    if (unassigned.length === 0) return null;

    switch (this.config.heuristics.variable_ordering) {
      case "most_constrained_first":
        return this.selectMostConstrainedVariable(unassigned, assignment);

      case "least_constraining_value":
        return this.selectLeastConstrainingVariable(unassigned, assignment);

      case "random":
        return unassigned[Math.floor(Math.random() * unassigned.length)];

      default:
        return unassigned[0];
    }
  }

  private selectMostConstrainedVariable(
    variables: CSPVariable[],
    assignment: CSPAssignment
  ): CSPVariable {
    // Select variable with smallest domain (most constrained)
    return variables.reduce((most, current) =>
      current.domain.length < most.domain.length ? current : most
    );
  }

  private selectLeastConstrainingVariable(
    variables: CSPVariable[],
    assignment: CSPAssignment
  ): CSPVariable {
    // Select variable that constrains the fewest remaining variables
    let leastConstraining = variables[0];
    let minConstraints = Infinity;

    for (const variable of variables) {
      let constraintCount = 0;

      for (const value of variable.domain) {
        for (const constraint of this.constraints) {
          if (constraint.getAffectedSessions(variable.session).length > 0) {
            constraintCount++;
          }
        }
      }

      if (constraintCount < minConstraints) {
        minConstraints = constraintCount;
        leastConstraining = variable;
      }
    }

    return leastConstraining;
  }

  // ==================== VALUE ORDERING HEURISTICS ====================

  private orderDomainValues(
    variable: CSPVariable,
    assignment: CSPAssignment
  ): TimeSlot[] {
    switch (this.config.heuristics.value_ordering) {
      case "least_constraining_value":
        return this.orderByLeastConstraining(variable, assignment);

      case "most_constraining_value":
        return this.orderByMostConstraining(variable, assignment);

      case "random":
        return this.shuffleArray([...variable.domain]);

      default:
        return [...variable.domain];
    }
  }

  private orderByLeastConstraining(
    variable: CSPVariable,
    assignment: CSPAssignment
  ): TimeSlot[] {
    // Order values by how much they constrain other variables (least first)
    return variable.domain.slice().sort((a, b) => {
      const constraintsA = this.countConstrainedVariables(
        variable,
        a,
        assignment
      );
      const constraintsB = this.countConstrainedVariables(
        variable,
        b,
        assignment
      );
      return constraintsA - constraintsB;
    });
  }

  private orderByMostConstraining(
    variable: CSPVariable,
    assignment: CSPAssignment
  ): TimeSlot[] {
    // Order values by how much they constrain other variables (most first)
    return variable.domain.slice().sort((a, b) => {
      const constraintsA = this.countConstrainedVariables(
        variable,
        a,
        assignment
      );
      const constraintsB = this.countConstrainedVariables(
        variable,
        b,
        assignment
      );
      return constraintsB - constraintsA;
    });
  }

  private countConstrainedVariables(
    variable: CSPVariable,
    value: TimeSlot,
    assignment: CSPAssignment
  ): number {
    let count = 0;
    const tempAssignment = { ...assignment, [variable.id]: value };

    for (const otherVariable of this.variables) {
      if (otherVariable.id === variable.id || otherVariable.id in assignment)
        continue;

      // Count how many values in other variable's domain would be eliminated
      for (const otherValue of otherVariable.domain) {
        for (const constraint of this.constraints) {
          if (
            constraint.type === "hard" &&
            constraint.isViolated(
              tempAssignment,
              otherVariable.session,
              otherValue
            )
          ) {
            count++;
            break;
          }
        }
      }
    }

    return count;
  }

  // ==================== CONSTRAINT CHECKING ====================

  private isConsistent(
    variable: CSPVariable,
    value: TimeSlot,
    assignment: CSPAssignment
  ): boolean {
    const tempAssignment = { ...assignment, [variable.id]: value };

    // Check all hard constraints
    for (const constraint of this.constraints) {
      if (
        constraint.type === "hard" &&
        constraint.isViolated(tempAssignment, variable.session, value)
      ) {
        return false;
      }
    }

    return true;
  }

  private isComplete(assignment: CSPAssignment): boolean {
    return Object.keys(assignment).length === this.variables.length;
  }

  // ==================== CONSTRAINT PROPAGATION ====================

  private propagateConstraints(assignment: CSPAssignment): {
    success: boolean;
    domainsReduced: number;
  } {
    this.propagationCount++;
    let domainsReduced = 0;
    let changed = true;

    while (changed) {
      changed = false;

      for (const variable of this.variables) {
        if (variable.id in assignment) continue;

        const originalDomainSize = variable.domain.length;

        // Remove inconsistent values from domain
        variable.domain = variable.domain.filter((value) =>
          this.isConsistent(variable, value, assignment)
        );

        if (variable.domain.length === 0) {
          // Domain wipeout - no solution possible
          return { success: false, domainsReduced };
        }

        if (variable.domain.length < originalDomainSize) {
          domainsReduced += originalDomainSize - variable.domain.length;
          changed = true;
        }
      }
    }

    this.addTraceStep(
      "propagate",
      undefined,
      undefined,
      `Constraint propagation reduced ${domainsReduced} domain values`
    );

    return { success: true, domainsReduced };
  }

  private saveDomains(): Map<string, TimeSlot[]> {
    const saved = new Map<string, TimeSlot[]>();
    for (const variable of this.variables) {
      saved.set(variable.id, [...variable.domain]);
    }
    return saved;
  }

  private restoreDomains(savedDomains: Map<string, TimeSlot[]>): void {
    for (const variable of this.variables) {
      const saved = savedDomains.get(variable.id);
      if (saved) {
        variable.domain = [...saved];
      }
    }
  }

  // ==================== OPTIMIZATION ====================

  calculateSolutionQuality(assignment: CSPAssignment): number {
    if (!this.config.optimization.enable_optimization) return 0;

    let totalCost = 0;

    for (const constraint of this.constraints) {
      if (constraint.type === "soft") {
        totalCost += constraint.getViolationCost(assignment);
      }
    }

    // Convert cost to quality score (lower cost = higher quality)
    const maxPossibleCost = this.constraints
      .filter((c) => c.type === "soft")
      .reduce((sum, c) => sum + c.weight * 100, 0); // Estimate max cost

    return Math.max(0, 100 - (totalCost / maxPossibleCost) * 100);
  }

  // ==================== UTILITY METHODS ====================

  private addTraceStep(
    action: "assign" | "unassign" | "propagate" | "backtrack",
    sessionId?: string,
    timeSlotId?: string,
    reason?: string
  ): void {
    this.solutionTrace.push({
      step: this.solutionTrace.length + 1,
      action,
      session_id: sessionId,
      time_slot_id: timeSlotId,
      reason: reason || "",
      constraint_violations: this.countTotalViolations(),
      domains_reduced: this.getTotalDomainSize(),
    });
  }

  private countTotalViolations(): number {
    // This would count current constraint violations
    return 0;
  }

  private getTotalDomainSize(): number {
    return this.variables.reduce((sum, v) => sum + v.domain.length, 0);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ==================== DEBUG AND STATISTICS ====================

  getStatistics() {
    return {
      variables: this.variables.length,
      constraints: this.constraints.length,
      backtrack_count: this.backtrackCount,
      propagation_count: this.propagationCount,
      trace_steps: this.solutionTrace.length,
      total_domain_size: this.getTotalDomainSize(),
    };
  }

  printDomains(): void {
    console.log("📊 Current Domain Sizes:");
    for (const variable of this.variables) {
      console.log(`  ${variable.id}: ${variable.domain.length} values`);
    }
  }
}
