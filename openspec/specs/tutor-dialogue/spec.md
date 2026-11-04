# Tutor Dialogue Specification

## Purpose

Tutor dialogue delivers the private-tutor turn — a Socratic follow-up question after a wrong answer — served by a small cheap model so per-learner conversation stays affordable at consumer scale.

## Requirements

### Requirement: Socratic follow-up on wrong answers

After an incorrect quiz or retrieval answer, the system SHALL offer one follow-up question that guides toward the answer without stating it, before revealing the explanation.

#### Scenario: Wrong answer triggers guidance

- **WHEN** a learner picks a wrong option
- **THEN** a follow-up question appears alongside (not instead of) the existing misconception hint

#### Scenario: Correct answer skips dialogue

- **WHEN** a learner picks the correct option first try
- **THEN** no follow-up is shown and XP is awarded as today

### Requirement: Dialogue served by the cheap model path

Follow-up turns SHALL be served through the small-model dialogue path, never the primary generation model, and SHALL complete within the same 50-second budget.

#### Scenario: Dialogue falls back gracefully

- **WHEN** the cheap model is unreachable or misconfigured
- **THEN** the quiz falls back to the existing static misconception hint with no error shown

### Requirement: Dialogue outcomes update the learner model

The learner's response to a follow-up (correct, incorrect, or skipped) SHALL be recorded against the relevant skill and misconception.

#### Scenario: Follow-up success resolves misconception

- **WHEN** the learner answers the follow-up correctly
- **THEN** the linked misconception is marked resolved per the learner-model rules
