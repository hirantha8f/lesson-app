# Learning Journey Specification

## Purpose

The learning journey makes progress visible and self-propelling: a skill map, next-up recommendations, and rituals that turn isolated lessons into a continuing quest the learner wants to return to.

## Requirements

### Requirement: Visible skill map

The system SHALL render a per-learner skill map showing every CT skill with its current mastery level and SHALL update it after each assessed interaction.

#### Scenario: Map reflects latest session

- **WHEN** a session ends with new assessment outcomes
- **THEN** the map shows updated levels without requiring a page reload to fetch them

### Requirement: Next-up recommendations

The system SHALL recommend the next activity or lesson targeting the weakest unresolved skill, preferring unresolved misconceptions over unseen content.

#### Scenario: Recommendation targets the gap

- **WHEN** a learner opens the journey view with an unresolved misconception
- **THEN** the top recommendation addresses that misconception's skill

#### Scenario: New learner gets an on-ramp

- **WHEN** a learner has no history
- **THEN** the recommendation is a starter activity matched to age and persona

### Requirement: Streak-as-story ritual

Daily activity SHALL extend a streak that is presented as story progress (chapter/day count), never as a bare number alone.

#### Scenario: Streak continues across midnight boundary correctly

- **WHEN** a learner completes an activity on a new calendar day following an active day
- **THEN** the streak increments by one and the story framing advances one chapter
