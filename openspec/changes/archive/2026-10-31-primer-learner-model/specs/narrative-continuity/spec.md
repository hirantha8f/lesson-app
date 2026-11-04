# Spec Delta

## Purpose

Narrative continuity turns isolated lessons into chapters: persistent story elements per learner that generated content references and extends, giving the Primer its book-like relationship instead of a feed of worksheets.

## ADDED Requirements

### Requirement: Persistent story elements per learner

The system SHALL store per-learner narrative elements (recurring characters, settings, running scenario) as part of the learner model and reuse them across sessions.

#### Scenario: Second session reuses the cast

- **WHEN** a lesson is generated for a learner with stored narrative elements
- **THEN** its hook and analogies reuse at least one stored element instead of inventing new ones

### Requirement: Callback hooks to prior episodes

Generated lessons SHALL include at least one explicit callback to a previous session's content or outcome for returning learners.

#### Scenario: Callback references real history

- **WHEN** prior sessions exist
- **THEN** the callback names a real past skill, activity, or event from history, never a fabricated one

### Requirement: Personas as lenses on one story

Parent prompts and teacher views SHALL reference the same learner narrative and mastery state the student sees, each framed for its audience.

#### Scenario: Parent sees the same quest

- **WHEN** a parent opens the learner's progress
- **THEN** it shows the same skills, streak chapter, and characters as the student journey, plus a co-play prompt
