# Plan: <short name>
Status: draft | approved | shipped
Date: <yyyy-mm-dd>
Preview: <artifact link>

## Goal
<One or two sentences. What problem for the visitor does this solve?>

## What the visitor will see
<Plain words. Desktop and phone. What is new, what is gone, what stays.>

## Changes, file by file
- `path` — <what changes and why>

## Slices (for parallel builders)
Each slice has its own files. No file appears in two slices.

### Slice A: <name>
- Files: `path`, `path`
- Do: <specific, checkable instructions>
- Done when: <what a reviewer can check>

## Decisions for the owner
1. <Question>. Recommended: <option>, because <reason>. Alternative: <option>, which costs <honest cost>.

## Risks and unknowns
- <Things not yet verified, and how the plan finds out.>

## Verification
- [ ] <Check that can fail, e.g. "/compare?a=x&b=y shows both names at 400px with no horizontal scroll">
- [ ] `npm run build`, lint and `tsc` pass

## Out of scope
- <Things the owner might expect but this change deliberately leaves alone.>
