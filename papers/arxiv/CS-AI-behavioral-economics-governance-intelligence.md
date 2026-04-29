# Behavioral Economics Laws as Architectural Constraints in AI Governance Intelligence Systems

**Submission Target:** arXiv — cs.AI (Artificial Intelligence)
**Author:** Alfredo Medina Hernandez
**Affiliation:** Medina Tech, Dallas, Texas
**Contact:** Medinasitech@outlook.com
**Date:** April 2026
**Status:** Prior art established. System deployed and running.

---

## Abstract

AI governance intelligence systems face a communication design problem distinct from accuracy: even perfectly accurate outputs can influence human decisions inappropriately if they violate known behavioral economics principles. We argue that the behavioral economics laws established by Kahneman and Tversky [1,2], and extended by subsequent behavioral economists, should be encoded as *architectural constraints* in AI governance intelligence systems — not as guidelines or recommendations, but as structural properties that the system enforces. We present eight behavioral laws (L72–L79) implemented in MERIDIAN, a deployed AI governance intelligence system for blockchain networks. We focus particular attention on L78 (Right to Both Frames), which we argue is the most policy-relevant constraint for AI governance systems. L78 requires that every recommendation offer both the gain frame and the loss frame, and that neither be suppressed. An AI system that selects frames to guide its principals toward predetermined decisions is not providing governance intelligence — it is providing behavioral manipulation dressed as analysis. We demonstrate how L72–L79 are implemented as architectural constraints in MERIDIAN's communication pipeline (E12, E15), and we discuss the implications for the broader class of AI systems that produce outputs designed to inform human decisions in high-stakes governance contexts.

**Keywords:** behavioral economics, AI governance, framing effects, loss aversion, anchoring, architectural constraints, AI alignment, decision support systems

---

## 1. Introduction

The alignment problem in AI governance systems is usually framed as: how do we ensure the system pursues the right objectives? We propose a complementary framing: how do we ensure the system communicates its outputs in a way that does not manipulate the human decisions it is supposed to support?

This communication alignment problem has received less attention than objective alignment, but it is practically urgent. As AI governance systems are deployed in high-stakes contexts — blockchain governance, regulatory compliance, financial risk assessment — they routinely produce outputs that will influence decisions affecting large numbers of people. If those outputs systematically exploit known cognitive biases, the system becomes a manipulation apparatus, regardless of how accurate its underlying analysis is.

Behavioral economics has established a rich empirical literature on how humans process information under uncertainty, make decisions under risk, and respond to framing effects [1,2,3,4]. The laws established by this literature are not theoretical propositions — they are empirical regularities observed across thousands of experiments with human subjects. They describe how humans actually behave, not how they rationally ought to behave.

We argue that these empirically established laws should be encoded as architectural constraints in AI governance systems: structural properties that the system cannot violate, by design rather than by policy.

---

## 2. Background: Behavioral Economics Foundations

### 2.1 Prospect Theory

Kahneman and Tversky's prospect theory [1] established that humans evaluate outcomes relative to a reference point (the "anchor"), that losses are weighted approximately 2.25× more heavily than equivalent gains (loss aversion), and that the probability weighting function is nonlinear (humans overweight small probabilities and underweight large ones).

These findings have been replicated across cultures, domains, and decision contexts. The loss aversion coefficient λ ≈ 2.25 is one of the most robustly measured constants in behavioral economics [5].

### 2.2 Anchoring Effects

Tversky and Kahneman [6] demonstrated that humans systematically adjust their estimates from an initial anchor value, and that this adjustment is typically insufficient — estimates remain biased toward the anchor even when the anchor is irrelevant. Subsequent work by Ariely, Loewenstein, and Prelec [7] showed that even arbitrary anchors (randomly generated numbers) influence subsequent judgments about completely unrelated quantities.

### 2.3 Framing Effects

The same objective information, presented in different frames (gain frame vs. loss frame), produces systematically different decisions [2]. This effect is robust across domains including medical decision-making [8], financial risk assessment [9], and public policy [10]. Critically, the "right" frame to present to a decision-maker is not a neutral choice — selecting a frame is an act of influence.

### 2.4 Status Quo Bias and Endowment Effects

Samuelson and Zeckhauser [11] documented that humans systematically prefer the status quo over alternatives, even when the alternatives are strictly superior by their own stated preferences. Thaler [12] documented the endowment effect: humans value things they own more than equivalent things they do not own. Both effects produce predictable biases in decision-making that AI systems can either exploit or correct for.

---

## 3. The Eight Behavioral Laws as Architectural Constraints

MERIDIAN implements eight behavioral economics laws (L72–L79) as architectural constraints in its communication pipeline. We describe each law, its empirical basis, and its architectural implementation.

### L72 — Anchoring
**Empirical basis:** Tversky & Kahneman (1974) [6]; Ariely, Loewenstein & Prelec (2003) [7]
**Rule:** Every recommendation is framed relative to the current governance position (the anchor), not relative to an absolute scale.
**Architectural implementation:** E12 (Public Summary Engine) always states the current parameter value, current canister version, or current governance rule before stating the proposed change. The delta between current and proposed is presented, not just the proposed absolute value.
**Rationale:** Failing to anchor to the current position makes the output less useful. Anchoring to the current position prevents the output from implicitly using a misleading anchor.

### L73 — Loss Weight
**Empirical basis:** Kahneman & Tversky (1979) [1]; meta-analysis by Neumann & Böckler (2016) [5]
**Rule:** Losses are weighted Λ = 2.25× more intensely than equivalent gains in consequence communication.
**Architectural implementation:** E6 (Risk Scorer) applies the 2.25× weight to loss-type consequences when generating the risk score. E12 includes both the expected gain and the equivalently-weighted loss in every risk summary.
**Rationale:** This is not a distortion of the analysis. It is a correction for the known asymmetry in how humans process risk. An AI system that treats +$100 and -$100 as equivalent is providing an analysis calibrated for a rational agent that does not exist. L73 calibrates the output for the human agents that do.

### L74 — Cost of Inaction
**Empirical basis:** Samuelson & Zeckhauser (1988) [11]; Thaler (1980) [12]
**Rule:** The status quo is always priced. Inaction is never free.
**Architectural implementation:** Every consequence trace includes a section explicitly analyzing the consequences of not implementing the proposal. If the status quo has costs — protocol debt, security exposure, missed coordination — these are surfaced alongside the proposal's own costs.
**Rationale:** Status quo bias causes humans to systematically underweight the costs of inaction. L74 corrects for this by making inaction's costs as visible as the proposal's costs.

### L75 — Endowment Correction
**Empirical basis:** Thaler (1980) [12]; Kahneman, Knetsch & Thaler (1990) [13]
**Rule:** Things already owned are weighted higher in switching analysis, and this weight must be disclosed.
**Architectural implementation:** When E4 (Effect Path Builder) maps the effects of a proposal, it tags incumbent systems (existing canisters, existing governance rules) as endowed. The risk score explicitly notes when the endowment effect may be influencing risk perception.
**Rationale:** Governance participants will naturally resist changes to existing systems due to endowment effects. L75 does not remove this tendency; it makes it visible so governance participants can adjust consciously.

### L76 — Time Language
**Empirical basis:** Thaler (1981) [14]; Loewenstein & Prelec (1992) [15]
**Rule:** Future consequences are expressed in the governance ecosystem's actual decision horizon, not in abstract units.
**Architectural implementation:** E12 expresses time-dependent consequences using the governance cadence of the target system. For ICP governance, where voting periods are days and reward cycles are months, consequences are expressed in these units, not in abstract "long-term" or "short-term" language.
**Rationale:** Hyperbolic discounting causes humans to systematically underweight consequences that are expressed in abstract time units. L76 re-expresses consequences in units that match the ecosystem's actual decision rhythm.

### L77 — Probability Shape
**Empirical basis:** Kahneman & Tversky (1979) [1]; Prelec (1998) [16]
**Rule:** Communicated probabilities are corrected for human over- and under-weighting of small and large probabilities.
**Architectural implementation:** When E12 expresses probability-dependent risk assessments, the raw probability is accompanied by the empirically observed human perception of that probability level. A 5% risk is noted to be psychologically perceived as approximately 13% (Prelec's probability weighting function evaluated at 0.05).
**Rationale:** A governance system that reports raw probabilities without acknowledging known probability weighting distortions is providing analysis calibrated for a rational Bayesian, not for a human decision-maker.

### L78 — Right to Both Frames
**Empirical basis:** Kahneman & Tversky (1981) [2]; Levin, Schneider & Gaeth (1998) [17]
**Rule:** Gain and loss framing are always offered. Neither frame is suppressed. The system never selects a frame to influence the decision-maker toward a predetermined outcome.
**Architectural implementation:** E12 generates two summary blocks for every output: a gain-frame block ("What this proposal achieves") and a loss-frame block ("What this proposal risks"). Both blocks are required. Neither can be empty. The system cannot produce an output that includes only one frame.
**Policy relevance:** This law addresses the most direct pathway by which an AI governance system becomes a manipulation apparatus. A system that consistently presents governance proposals in one frame — always emphasizing gains, or always emphasizing losses — is not providing neutral analysis. It is nudging its principals. L78 closes this pathway by architectural constraint.

### L79 — Regret Minimization
**Empirical basis:** Zeelenberg (1999) [18]; Bell (1982) [19]
**Rule:** For irreversible decisions, regret analysis is included alongside expected value analysis.
**Architectural implementation:** E6 includes an irreversibility axis in its risk score. Proposals that are irreversible (protocol changes, canister deletions, governance rule changes) receive a mandatory regret analysis section in E12's output. The regret analysis asks: under what conditions would governance participants most regret having passed or rejected this proposal?
**Rationale:** Expected value analysis is appropriate for repeated decisions under risk. For irreversible decisions — which are common in blockchain governance — regret analysis provides information that expected value analysis does not.

---

## 4. L78 as the Central Policy Concern

Among the eight laws, L78 deserves particular attention for policy and governance contexts.

### 4.1 The Framing Problem in AI Governance

As AI systems are increasingly deployed to provide governance intelligence, they will inevitably influence the decisions of governance participants. The question is not whether AI governance systems influence decisions — they do by their existence. The question is whether that influence is manipulative or genuine.

A system that always presents proposals in the gain frame (emphasizing what is achieved) will systematically make governance participants more likely to approve proposals. A system that always presents proposals in the loss frame (emphasizing what is risked) will systematically make governance participants more likely to reject proposals. Either direction of systematic framing bias is manipulation.

L78 is the architectural prohibition on this class of manipulation. By requiring both frames in every output, the system eliminates the designer's ability to influence governance participants through frame selection. The designer cannot make the system more approving or more rejecting through frame choice, because both frames are always present.

### 4.2 Comparison to Existing AI Alignment Approaches

Existing AI alignment approaches address manipulation through objective function design (the system shouldn't have an objective that makes manipulation instrumentally useful [20]) and oversight mechanisms (humans checking whether the system is behaving as intended [21]).

L78 provides a complementary approach: architectural constraint at the output layer. Regardless of what the system's internal processing does, the output must include both frames. This is auditable from the output alone — no inspection of the system's internals is required to verify compliance with L78.

This property makes L78 particularly valuable for deployed governance systems, where the principals may not have the technical capacity to inspect the system's internal computations but can directly observe its outputs.

---

## 5. Implementation in MERIDIAN's Communication Pipeline

E12 (Public Summary Engine) and E15 (Render/Export Engine) jointly implement L72–L79 as follows:

**Template enforcement:** E12 uses a structured output template that requires explicit sections for anchor reference (L72), loss-weighted risk (L73), status quo cost (L74), endowment disclosure (L75), horizon-appropriate time expression (L76), probability shape disclosure (L77), both frames (L78), and regret analysis for irreversible decisions (L79). Missing sections fail validation.

**Law attestation:** Every E15 output includes a behavioral laws attestation: a machine-readable record of which laws were applied, which sections were generated, and whether any law required a mandatory flag (e.g., L79 irreversibility flag).

**Public verifiability:** E15 generates certified HTTPS responses. The law attestation is included in the certification. External parties can verify compliance with L72–L79 by inspecting the certified output, without access to the system's internals.

---

## 6. Discussion

### 6.1 Generalizability

The L72–L79 framework is not specific to blockchain governance. Any AI system that produces outputs designed to inform human decisions in high-stakes contexts faces the same communication alignment problem. Medical diagnosis support systems, financial risk assessment systems, regulatory compliance systems — all of these produce outputs that will influence consequential decisions, and all of them can systematically exploit known cognitive biases through output design.

We propose L72–L79, or an appropriately adapted version, as a general framework for behavioral alignment in AI governance systems.

### 6.2 Limitations

The eight laws do not exhaust the behavioral economics literature. They represent a selection of the most practically relevant laws for governance contexts. Future work will extend the framework to include additional behavioral regularities as they are shown to be relevant to governance decision-making.

The Λ = 2.25 loss aversion coefficient is measured from Western, educated, industrialized, rich, democratic (WEIRD) populations. Cross-cultural robustness has been studied but is not universal [22]. Future deployments in non-WEIRD governance contexts should validate the coefficient locally.

### 6.3 The Governance Implication

A governance system that implements L72–L79 as architectural constraints makes a commitment that its principals can verify: it will not exploit cognitive biases to guide them toward predetermined conclusions. This commitment, verifiable from outputs alone, creates a trust foundation that policy-based neutrality claims cannot provide.

---

## 7. Conclusion

We have presented eight behavioral economics laws implemented as architectural constraints in MERIDIAN, a deployed AI governance intelligence system. We have argued that behavioral law compliance should be an architectural property, not a policy or guideline, because policies can be changed and guidelines can be ignored, but architectural constraints are enforced by the structure of the system. We have given particular attention to L78 (Right to Both Frames) as the most policy-relevant constraint — the prohibition on frame selection as a manipulation mechanism. We propose the L72–L79 framework as a general approach to communication alignment in AI governance systems, and we invite the research community to extend, critique, and formalize this framework.

---

## References

[1] Kahneman, D., & Tversky, A. (1979). Prospect Theory: An Analysis of Decision under Risk. *Econometrica*, 47(2), 263–291.
[2] Kahneman, D., & Tversky, A. (1981). The Framing of Decisions and the Psychology of Choice. *Science*, 211(4481), 453–458.
[3] Thaler, R.H., & Sunstein, C.R. (2008). *Nudge: Improving Decisions about Health, Wealth, and Happiness*. Yale University Press.
[4] Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux.
[5] Neumann, N., & Böckler, C. (2016). Meta-analysis of loss aversion in product choice and pricing. *Journal of Retailing*, 92(1), 69–85.
[6] Tversky, A., & Kahneman, D. (1974). Judgment under Uncertainty: Heuristics and Biases. *Science*, 185(4157), 1124–1131.
[7] Ariely, D., Loewenstein, G., & Prelec, D. (2003). Coherent Arbitrariness. *Quarterly Journal of Economics*, 118(1), 73–106.
[8] McNeil, B.J., Pauker, S.G., Sox, H.C., & Tversky, A. (1982). On the Elicitation of Preferences for Alternative Therapies. *New England Journal of Medicine*, 306(21), 1259–1262.
[9] Hershey, J.C., & Schoemaker, P.J.H. (1980). Risk taking and problem context in the domain of losses. *Journal of Risk and Insurance*, 47(1), 111–132.
[10] Rothman, A.J., & Salovey, P. (1997). Shaping perceptions to motivate healthy behavior. *Psychological Bulletin*, 121(1), 3–19.
[11] Samuelson, W., & Zeckhauser, R. (1988). Status quo bias in decision making. *Journal of Risk and Uncertainty*, 1(1), 7–59.
[12] Thaler, R.H. (1980). Toward a positive theory of consumer choice. *Journal of Economic Behavior & Organization*, 1(1), 39–60.
[13] Kahneman, D., Knetsch, J.L., & Thaler, R.H. (1990). Experimental tests of the endowment effect and the Coase theorem. *Journal of Political Economy*, 98(6), 1325–1348.
[14] Thaler, R.H. (1981). Some empirical evidence on dynamic inconsistency. *Economics Letters*, 8(3), 201–207.
[15] Loewenstein, G., & Prelec, D. (1992). Anomalies in intertemporal choice. *Quarterly Journal of Economics*, 107(2), 573–597.
[16] Prelec, D. (1998). The probability weighting function. *Econometrica*, 66(3), 497–527.
[17] Levin, I.P., Schneider, S.L., & Gaeth, G.J. (1998). All frames are not created equal. *Organizational Behavior and Human Decision Processes*, 76(2), 149–188.
[18] Zeelenberg, M. (1999). Anticipated regret, expected utility and behavioral decision making. *Journal of Behavioral Decision Making*, 12(2), 93–106.
[19] Bell, D.E. (1982). Regret in Decision Making under Uncertainty. *Operations Research*, 30(5), 961–981.
[20] Russell, S. (2019). *Human Compatible: Artificial Intelligence and the Problem of Control*. Viking.
[21] Leike, J., et al. (2018). AI Safety Gridworlds. arXiv:1711.09883.
[22] Rieger, M.O., Wang, M., & Hens, T. (2017). Estimating cumulative prospect theory parameters from an international survey. *Theory and Decision*, 82(4), 567–596.
[23] Medina Hernandez, A. (2026). *BEHAVIORAL ECONOMICS LAWS: The Architecture of Honest Communication*. Paper V, Sovereign Intelligence Research Series. (Full prior art documentation.)
[24] Medina Hernandez, A. (2026). Full prior art series, Papers I–XXXI. Sovereign Intelligence Research Series.
