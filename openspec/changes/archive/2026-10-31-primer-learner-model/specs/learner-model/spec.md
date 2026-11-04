# Spec Delta

## Purpose

The learner model is the Primer's memory: durable per-learner state (skill mastery, misconceptions, interests, history) that every generated lesson is personalized against, so teaching compounds across sessions instead of restarting each time.

## ADDED Requirements

### Requirement: Persistent skill mastery per learner

The system SHALL maintain a mastery level per CT skill per learner with values `unseen`, `seen`, `practicing`, or `mastered`, updated from quiz, Parsons, playground, and tutor-dialogue outcomes.

#### Scenario: Mastery advances on demonstrated success

- **WHEN** a learner answers retrieval checks for a skill correctly across two separate sessions
- **THEN** that skill advances toward `mastered` and the journey view reflects the new level

#### Scenario: Mastery regresses on later failure

- **WHEN** a learner fails a check on a skill previously marked `practicing` or higher
- **THEN** the skill steps back one level and is prioritized for spaced re-checks

### Requirement: Misconception log feeds future lessons

The system SHALL record each demonstrated misconception (skill, wrong answer, session) and SHALL surface unresolved ones in later lesson generations until corrected.

#### Scenario: Old misconception resurfaces

- **WHEN** a new lesson is generated for a learner with an unresolved misconception in a related skill
- **THEN** the lesson includes a retrieval check targeting that misconception

#### Scenario: Misconception resolves

- **WHEN** the learner answers the targeted check correctly
- **THEN** the misconception is marked resolved and stops being scheduled

### Requirement: Learner-model summary injection

Lesson and study-guide generation SHALL receive a compact learner-model summary (mastery levels, open misconceptions, interests, last-session callback) of at most a few hundred tokens.

#### Scenario: Continuity line appears

- **WHEN** a lesson is generated for a returning learner with prior history
- **THEN** the lesson contains at least one explicit callback to a previous session, skill, or interest

#### Scenario: Anonymous learners still work

- **WHEN** no account or stored model exists
- **THEN** generation proceeds with only the session profile and no summary, with no error
